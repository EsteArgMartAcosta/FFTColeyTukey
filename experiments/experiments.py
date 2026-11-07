"""FFT Atlas — reproducible CPU experiments.

Run from repository root: python experiments/experiments.py --output public/data
Timing is descriptive, not a claim of a universal speedup. No GPU is used.
The radix-2 kernel is compiled by Numba with fastmath=False; compilation,
bit-reversal construction, and twiddle construction are outside kernel timing.
Dense matrix construction is reported separately. Outputs are newly allocated.
"""
from __future__ import annotations

import os
# Set before numerical imports in a fresh process.
for key in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS', 'NUMEXPR_NUM_THREADS'):
    os.environ[key] = '1'

import argparse
import csv
import json
import hashlib
import platform
import sys
from datetime import datetime, timezone
from pathlib import Path
from time import perf_counter
from typing import Callable

import mpmath as mp
import numba
import numpy as np
import scipy
from numba import njit
from scipy import fft as sfft
from threadpoolctl import threadpool_info, threadpool_limits

SEED = 20260926


def radix2_plan(n: int) -> tuple[np.ndarray, np.ndarray]:
    if n < 1 or n & (n - 1):
        raise ValueError('n must be a positive power of two')
    bits = n.bit_length() - 1
    p = np.arange(n, dtype=np.int64)
    rev = np.zeros(n, dtype=np.int64)
    for _ in range(bits):
        rev = 2 * rev + (p & 1)
        p >>= 1
    w = np.exp(-2j * np.pi * np.arange(n // 2) / n)
    return rev, w


@njit(cache=True, fastmath=False)
def radix2_kernel(x: np.ndarray, rev: np.ndarray, roots: np.ndarray) -> np.ndarray:
    """Unnormalized forward DIT FFT; accepts the matching precomputed plan."""
    n = len(x)
    y = x[rev].copy()
    size = 2
    while size <= n:
        half = size // 2
        stride = n // size
        for start in range(0, n, size):
            for j in range(half):
                t = roots[j * stride] * y[start + j + half]
                a = y[start + j]
                y[start + j] = a + t
                y[start + j + half] = a - t
        size *= 2
    return y


def radix2(x: np.ndarray) -> np.ndarray:
    x = np.asarray(x, dtype=np.complex128)
    if x.ndim != 1:
        raise ValueError('Expected a 1-D array')
    rev, w = radix2_plan(len(x))
    return radix2_kernel(x, rev, w)


def dense_matrix(n: int) -> np.ndarray:
    # Reduce the integer exponent modulo n to avoid gratuitously large angles.
    k = np.arange(n, dtype=np.int64)
    return np.exp(-2j * np.pi * ((k[:, None] * k[None, :]) % n) / n)


def mp_dft(x: np.ndarray, digits: int = 80) -> list[mp.mpc]:
    """Independent direct DFT of the exact represented binary input.

    A binary32 component converted to Python float is represented exactly.
    mpmath then converts that binary64 value exactly at the chosen precision.
    """
    with mp.workdps(digits):
        z = [mp.mpc(float(a.real), float(a.imag)) for a in x]
        n = len(z)
        roots = [mp.exp(-2j * mp.pi * k / n) for k in range(n)]
        return [mp.fsum(z[j] * roots[(j * k) % n] for j in range(n)) for k in range(n)]


def relative_mp_error(y: np.ndarray, reference: list[mp.mpc]) -> float:
    with mp.workdps(80):
        numerator = mp.fsum(abs(mp.mpc(float(v.real), float(v.imag)) - r)**2
                            for v, r in zip(y, reference))
        denominator = mp.fsum(abs(r)**2 for r in reference)
        if denominator == 0:
            return 0.0 if numerator == 0 else float('inf')
        return float(mp.sqrt(numerator / denominator))


def measure_functions(functions: dict[str, Callable], seed: int,
                      repeats: int = 9, target_seconds: float = .012) -> dict:
    """Randomized round-robin batches, returning every per-call batch average."""
    rng = np.random.default_rng(seed)
    loops: dict[str, int] = {}
    for name, fn in functions.items():
        fn(); fn()
        t = perf_counter()
        for _ in range(5):
            fn()
        dt = max((perf_counter() - t) / 5, 1e-8)
        loops[name] = max(1, min(10000, int(target_seconds / dt)))
    raw: dict[str, list[float]] = {name: [] for name in functions}
    for _ in range(repeats):
        for name in rng.permutation(list(functions)):
            t = perf_counter()
            for _ in range(loops[name]):
                functions[name]()
            raw[name].append((perf_counter() - t) / loops[name])
    return {name: {
        'median_seconds': float(np.median(samples)),
        'q25_seconds': float(np.quantile(samples, .25)),
        'q75_seconds': float(np.quantile(samples, .75)),
        'min_seconds': float(np.min(samples)),
        'batch_average_seconds': samples,
        'calls_per_batch': loops[name],
        'batches': repeats,
    } for name, samples in raw.items()}


def benchmark() -> list[dict]:
    rng = np.random.default_rng(SEED)
    rows = []
    for n in (64, 128, 256, 512, 1024, 2048):
        x = (rng.standard_normal(n) + 1j * rng.standard_normal(n)).astype(np.complex128)
        t = perf_counter(); matrix = dense_matrix(n); matrix_build = perf_counter() - t
        t = perf_counter(); rev, roots = radix2_plan(n); plan_build = perf_counter() - t
        radix2_kernel(x, rev, roots)  # Exclude compilation/warm-up.
        methods = {
            'dense_precomputed': lambda: matrix @ x,
            'radix2_numba': lambda: radix2_kernel(x, rev, roots),
            'scipy_fft': lambda: sfft.fft(x, workers=1),
        }
        ref = sfft.fft(x, workers=1)
        for name, fn in methods.items():
            assert np.linalg.norm(fn() - ref) / np.linalg.norm(ref) < 2e-13, name
        rows.append({'n': n, 'matrix_build_seconds_single_observation': matrix_build,
                     'radix2_plan_seconds_single_observation': plan_build,
                     'matrix_bytes': matrix.nbytes,
                     'methods': measure_functions(methods, SEED + n)})
    return rows


def accuracy() -> list[dict]:
    """Algorithm error on representable inputs, not input quantization error.

    For each dtype, values are cast first; high-precision DFT receives that exact
    cast input. Twiddles and per-stage storage use the selected dtype in NumPy.
    """
    out = []
    for n in (16, 32, 64, 128, 256):
        samples = {'radix2_c128': [], 'scipy_c128': [], 'dense_c128': [],
                   'radix2_c64': [], 'scipy_c64': []}
        for replicate in range(3):
            rng = np.random.default_rng(SEED + n + replicate * 10000)
            x64 = rng.standard_normal(n) + 1j * rng.standard_normal(n)
            x32 = x64.astype(np.complex64)
            ref64 = mp_dft(x64)
            ref32 = mp_dft(x32.astype(np.complex128))
            rev, roots = radix2_plan(n)
            y64 = radix2_kernel(x64, rev, roots)
            # Pure NumPy stagewise reference forces c64 storage after each stage.
            y32 = x32[rev].copy()
            size = 2
            while size <= n:
                w = roots[np.arange(size//2) * (n//size)].astype(np.complex64)
                a = y32.reshape(-1, size)
                even = a[:, :size//2].copy()
                product = a[:, size//2:] * w[None, :]
                a[:, :size//2] = even + product
                a[:, size//2:] = even - product
                size *= 2
            values = {
                'radix2_c128': (y64, ref64),
                'scipy_c128': (sfft.fft(x64, workers=1), ref64),
                'dense_c128': (dense_matrix(n) @ x64, ref64),
                'radix2_c64': (y32, ref32),
                'scipy_c64': (sfft.fft(x32, workers=1), ref32),
            }
            assert y32.dtype == np.complex64
            assert values['scipy_c64'][0].dtype == np.complex64
            assert y64.dtype == np.complex128
            for name, (value, reference) in values.items():
                samples[name].append(relative_mp_error(value, reference))
        out.append({'n': n, 'replicates': 3, 'methods': {
            name: {'median_relative_l2': float(np.median(v)),
                   'min_relative_l2': min(v), 'max_relative_l2': max(v),
                   'relative_l2_samples': v} for name, v in samples.items()}})
    return out


def convolution_lengths() -> dict:
    rng = np.random.default_rng(SEED)
    na = nb = 30000
    a = rng.normal(size=na).astype(np.complex128)
    b = rng.normal(size=nb).astype(np.complex128)
    needed = na + nb - 1
    fast = sfft.next_fast_len(needed)
    lengths = sorted(set((needed, fast, 1 << (needed - 1).bit_length())))
    def conv(length):
        return sfft.ifft(sfft.fft(a, length, workers=1) * sfft.fft(b, length, workers=1),
                         workers=1)[:needed]
    functions = {str(length): (lambda length=length: conv(length)) for length in lengths}
    timing = measure_functions(functions, SEED, repeats=9, target_seconds=.02)
    reference = conv(fast)
    rows = []
    for length in lengths:
        error = float(np.linalg.norm(conv(length)-reference)/np.linalg.norm(reference))
        rows.append({'length': length, 'agreement_with_fast_length': error, **timing[str(length)]})
    return {'input_lengths': [na, nb], 'linear_output_length': needed,
            'next_fast_len': fast, 'note': 'All paddings compute the same linear convolution. '
            'Agreement with one binary64 output is not error against exact arithmetic.', 'rows': rows}


def poisson(n: int, method: str = 'spectral') -> dict:
    if n < 16 or n & (n-1):
        raise ValueError('Use a power of two n >= 16 for this manufactured example')
    if method not in ('spectral', 'fd'):
        raise ValueError('method must be spectral or fd')
    t = 2 * np.pi * np.arange(n) / n
    x, y = np.meshgrid(t, t, indexing='ij')
    exact = np.sin(3*x) * np.cos(2*y) + .25*np.cos(5*x)
    forcing = 13*np.sin(3*x) * np.cos(2*y) + 6.25*np.cos(5*x)
    forcing -= forcing.mean()
    k = sfft.fftfreq(n, 1/n)
    h = 2*np.pi/n
    if method == 'spectral':
        lam = k[:, None]**2 + k[None, :]**2
    else:
        z = 4*np.sin(np.pi*k/n)**2/h**2
        lam = z[:, None]+z[None, :]
    fhat = sfft.fft2(forcing, workers=1)
    lam[0, 0] = 1
    uhat = fhat / lam
    uhat[0, 0] = 0
    solution = sfft.ifft2(uhat, workers=1).real
    if method == 'fd':
        applied = (4*solution-np.roll(solution,1,0)-np.roll(solution,-1,0)
                   -np.roll(solution,1,1)-np.roll(solution,-1,1))/h**2
    else:
        lam[0, 0] = 0
        applied = sfft.ifft2(lam*sfft.fft2(solution, workers=1), workers=1).real
    return {'n': n, 'method': method,
            'relative_solution_l2': float(np.linalg.norm(solution-exact)/np.linalg.norm(exact)),
            'relative_residual_l2': float(np.linalg.norm(applied-forcing)/np.linalg.norm(forcing)),
            'solution_mean_abs': float(abs(solution.mean()))}


def metadata() -> dict:
    cpu = platform.processor()
    try:
        lines = Path('/proc/cpuinfo').read_text().splitlines()
        cpu = next(x.split(':',1)[1].strip() for x in lines if x.startswith('model name'))
    except (OSError, StopIteration):
        pass
    return {'created_utc': datetime.now(timezone.utc).isoformat(),
            'execution_status': 'reproduced',
            'protocol_version': 'fft-atlas-1.0',
            'source_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
            'seed': SEED, 'platform': platform.platform(), 'cpu': cpu,
            'python': sys.version.split()[0], 'numpy': np.__version__,
            'scipy': scipy.__version__, 'numba': numba.__version__, 'mpmath': mp.__version__,
            'threadpools': threadpool_info(), 'fft_workers': 1,
            'timing_scope': 'Shared CPU container. Compilation, dense-matrix construction, and '
            'radix-2 planning excluded from execution timings. Dense build and radix-2 plan '
            'times separately reported as single observations, not rigorous benchmarks. '
            'Allocation included. No GPU. Randomized round-robin timing; no confidence intervals.',
            'accuracy_reference': 'Independent direct DFT at 80 decimal digits of each '
            'dtype-representable input. 3 random Gaussian complex inputs per size. Normwise errors.'}


def write_csvs(data: dict, output: Path) -> None:
    with (output/'timings.csv').open('w', newline='') as f:
        w=csv.writer(f); w.writerow(['n','method','median_us','q25_us','q75_us','calls_per_batch','batches'])
        for row in data['timings']:
            for method, r in row['methods'].items():
                w.writerow([row['n'],method,*[r[s]*1e6 for s in ('median_seconds','q25_seconds','q75_seconds')],r['calls_per_batch'],r['batches']])
    with (output/'accuracy.csv').open('w', newline='') as f:
        w=csv.writer(f);w.writerow(['n','method','replicate','relative_l2'])
        for row in data['accuracy']:
            for method, r in row['methods'].items():
                for replicate, value in enumerate(r['relative_l2_samples']):
                    w.writerow([row['n'],method,replicate,value])
    with (output/'poisson.csv').open('w', newline='') as f:
        w=csv.DictWriter(f,fieldnames=list(data['poisson'][0]));w.writeheader();w.writerows(data['poisson'])


def main() -> None:
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('data'))
    args=parser.parse_args();args.output.mkdir(parents=True,exist_ok=True)
    with threadpool_limits(limits=1):
        data={'metadata':metadata()}
        print('Timing compiled kernels...', flush=True);data['timings']=benchmark()
        print('Independent 80-digit accuracy reference...', flush=True);data['accuracy']=accuracy()
        print('Same-convolution padding experiment...', flush=True);data['convolution']=convolution_lengths()
        print('Poisson manufactured-solution validation...', flush=True)
        data['poisson']=[poisson(n,m) for n in (16,32,64,128) for m in ('spectral','fd')]
    data['metadata']['completed_utc'] = datetime.now(timezone.utc).isoformat()
    (args.output/'results.json').write_text(json.dumps(data,indent=2),encoding='utf-8')
    write_csvs(data,args.output)
    print(json.dumps({'metadata':data['metadata'],'timing_last':data['timings'][-1],
                      'convolution':data['convolution'],'poisson':data['poisson']},indent=2))

if __name__=='__main__':
    main()
