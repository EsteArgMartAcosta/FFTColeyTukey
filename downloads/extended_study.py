"""FFT Atlas: an auditable, four-part numerical study (CPU only).

From the repository root:
    python experiments/extended_study.py --output public/data/extended-study.json

The file is self-contained and uses the pinned experiments/requirements.txt.
No timing is inferred from an operation count. All raw timing batches and
accuracy replicates are retained. The default study takes a few minutes.
"""
from __future__ import annotations

import os
for _key in ('OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS', 'OMP_NUM_THREADS', 'NUMEXPR_NUM_THREADS'):
    os.environ[_key] = '1'

import argparse
import hashlib
import json
import platform
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
from scipy.signal import convolve
from threadpoolctl import threadpool_info, threadpool_limits

SEED = 20261107


def plan(n: int, dtype=np.complex128):
    if n < 1 or n & (n - 1):
        raise ValueError('The radix-2 transform requires a positive power of two.')
    indices = np.arange(n, dtype=np.int64)
    reversed_indices = np.zeros(n, dtype=np.int64)
    for _ in range(n.bit_length() - 1):
        reversed_indices = (reversed_indices << 1) | (indices & 1)
        indices >>= 1
    roots = np.exp(-2j * np.pi * np.arange(n) / n).astype(dtype)
    return reversed_indices, roots


@njit(cache=True, fastmath=False)
def direct_dft(x, roots):
    """Independent direct summation; reduced integer exponents, no FFT calls."""
    n = len(x)
    out = np.empty_like(x)
    for k in range(n):
        value = x[0] * roots[0]
        for j in range(1, n):
            value += x[j] * roots[(j * k) % n]
        out[k] = value
    return out


@njit(cache=True, fastmath=False)
def radix2(x, reverse, roots):
    """Iterative DIT with twiddles and storage in the selected complex dtype."""
    y = x[reverse].copy()
    n = len(x)
    size = 2
    while size <= n:
        half = size // 2
        stride = n // size
        for start in range(0, n, size):
            for j in range(half):
                a = y[start + j]
                b = y[start + j + half] * roots[j * stride]
                y[start + j] = a + b
                y[start + j + half] = a - b
        size *= 2
    return y


def time_batches(functions: dict[str, Callable], seed: int,
                 batches: int = 11, target_seconds: float = .006) -> dict:
    """Randomized round-robin order; quantiles are not confidence intervals."""
    rng = np.random.default_rng(seed)
    loops = {}
    values = {name: [] for name in functions}
    for name, function in functions.items():
        function(); function()
        start = perf_counter()
        for _ in range(3):
            function()
        elapsed = max((perf_counter() - start) / 3, 1e-8)
        loops[name] = max(1, min(20000, int(target_seconds / elapsed)))
    for _ in range(batches):
        for name in rng.permutation(list(functions)):
            start = perf_counter()
            for _ in range(loops[name]):
                functions[name]()
            values[name].append((perf_counter() - start) / loops[name])
    return {name: {
        'median_seconds': float(np.median(samples)),
        'q10_seconds': float(np.quantile(samples, .1)),
        'q90_seconds': float(np.quantile(samples, .9)),
        'samples_seconds': samples,
        'calls_per_batch': loops[name],
        'batches': batches,
    } for name, samples in values.items()}


def timing_study():
    rows = []
    for n in (64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144):
        rng = np.random.default_rng(SEED + n)
        x = rng.normal(size=n) + 1j * rng.normal(size=n)
        start = perf_counter()
        reverse, roots = plan(n)
        setup = perf_counter() - start
        methods = {
            'radix2': lambda: radix2(x, reverse, roots),
            'scipy_fft': lambda: sfft.fft(x, workers=1),
        }
        if n <= 2048:
            methods['direct_dft'] = lambda: direct_dft(x, roots)
        reference = sfft.fft(x, workers=1)
        checks = {name: float(np.linalg.norm(fn() - reference) / np.linalg.norm(reference))
                  for name, fn in methods.items()}
        if max(checks.values()) > 1e-11:
            raise AssertionError('A timed method failed its numerical check.')
        rows.append({'n': n, 'setup_seconds': setup,
                     'correctness_relative_l2': checks,
                     'methods': time_batches(methods, SEED + 7 * n)})
    return {
        'question': 'How does measured execution scale when the mathematical transform is held fixed?',
        'protocol': 'Complex128 inputs; one CPU thread; independent direct summation, compiled radix-2, and SciPy FFT. Eleven randomized-order batches per method and size. JIT compilation, input generation, and explicit root/permutation planning are excluded. Every call allocates its output; SciPy internal dispatch and workspace handling remain included. Direct DFT stops at N=2048.',
        'limitations': 'Bands are empirical 10th–90th percentiles of per-call batch averages, not confidence intervals. One machine and one implementation of each algorithm do not establish universal speedups. Cached, repeated inputs are used. The direct method is a compiled scalar sum, not optimized dense BLAS.',
        'method_labels': {'direct_dft': 'Direct DFT · compiled sum', 'radix2': 'Radix-2 · compiled DIT', 'scipy_fft': 'SciPy FFT · optimized backend'},
        'rows': rows,
    }


def high_precision_dft(x, digits=80):
    with mp.workdps(digits):
        n = len(x)
        values = [mp.mpc(float(v.real), float(v.imag)) for v in x]
        roots = [mp.exp(-2j * mp.pi * k / n) for k in range(n)]
        return [mp.fsum(values[j] * roots[(j*k) % n] for j in range(n)) for k in range(n)]


def mp_metrics(y, reference, weak_bin=None):
    with mp.workdps(80):
        error = [abs(mp.mpc(float(v.real), float(v.imag)) - r)
                 for v, r in zip(y, reference)]
        norm = mp.sqrt(mp.fsum(abs(r)**2 for r in reference))
        if norm == 0:
            raise ValueError('This study excludes the zero reference.')
        weak = None
        if weak_bin is not None and abs(reference[weak_bin]) > 0:
            weak = float(error[weak_bin] / abs(reference[weak_bin]))
        return float(mp.sqrt(mp.fsum(e**2 for e in error)) / norm), weak


def signal(n, family, seed):
    rng = np.random.default_rng(seed)
    j = np.arange(n)
    if family == 'random':
        return rng.normal(size=n) + 1j * rng.normal(size=n)
    phase = rng.uniform(-np.pi, np.pi)
    if family == 'single_mode':
        return np.exp(1j * (2*np.pi*3*j/n + phase))
    if family == 'dynamic_range':
        # A 1e8 amplitude ratio: normwise accuracy need not preserve the weak bin.
        return 1e6*np.exp(1j*(2*np.pi*3*j/n + phase)) + .01*np.exp(2j*np.pi*7*j/n)
    raise ValueError(f'Unknown signal family: {family}')


def accuracy_study():
    rows = []
    for n in (16, 32, 64, 128, 256):
        for family in ('random', 'single_mode', 'dynamic_range'):
            samples = {}
            for precision, dtype in (('float64', np.complex128), ('float32', np.complex64)):
                samples[precision] = {m: {'errors': [], 'weak': [], 'quantization': []}
                                      for m in ('radix2', 'scipy_fft')}
                for replicate in range(3):
                    raw = signal(n, family, SEED + n + 10000*replicate)
                    x = raw.astype(dtype)
                    reference = high_precision_dft(x)
                    reverse, roots = plan(n, dtype)
                    quantization = float(np.linalg.norm(x.astype(np.complex128) - raw) / np.linalg.norm(raw))
                    values = {'radix2': radix2(x, reverse, roots),
                              'scipy_fft': sfft.fft(x, workers=1)}
                    for method, y in values.items():
                        if y.dtype != np.dtype(dtype):
                            raise AssertionError('Unexpected precision promotion.')
                        relative, weak = mp_metrics(y, reference, 7 if family == 'dynamic_range' else None)
                        target = samples[precision][method]
                        target['errors'].append(relative)
                        target['weak'].append(weak)
                        target['quantization'].append(quantization)
                for method, data in samples[precision].items():
                    weak_values = [v for v in data['weak'] if v is not None]
                    rows.append({
                        'n': n, 'family': family, 'precision': precision, 'method': method,
                        'replicates': 3,
                        'median_relative_l2': float(np.median(data['errors'])),
                        'min_relative_l2': min(data['errors']),
                        'max_relative_l2': max(data['errors']),
                        'samples_relative_l2': data['errors'],
                        'weak_bin_relative_error_median': float(np.median(weak_values)) if weak_values else None,
                        'samples_weak_bin_relative_error': data['weak'],
                        'input_quantization_relative_l2_median': float(np.median(data['quantization'])),
                    })
    return {
        'question': 'Does a small normwise FFT error guarantee accurate weak spectral coefficients?',
        'protocol': 'Three deterministic phase/seed replicates per N, signal family, precision and method. Each binary input is cast BEFORE its independent direct DFT at 80 decimal digits. Error is relative Euclidean norm. Complex64 and complex128 output types are checked. Weak-bin error refers to bin 7 of the represented input, not the unrounded analytic signal.',
        'limitations': 'These are finite empirical samples, not worst-case stability bounds. Binary32 input quantization is measured separately. In the dynamic-range case, quantization may already obscure the intended weak mode before the FFT starts. Near-zero coefficient relative errors are intrinsically sensitive; normwise conditioning is still one.',
        'family_labels': {'random': 'Complex Gaussian', 'single_mode': 'One Fourier mode', 'dynamic_range': 'Strong + weak modes · 10⁸ ratio'},
        'precision_labels': {'float64': 'Binary64 · complex128', 'float32': 'Binary32 · complex64'},
        'rows': rows,
    }


def factorization(n):
    factors = []
    divisor = 2
    while divisor * divisor <= n:
        exponent = 0
        while n % divisor == 0:
            n //= divisor
            exponent += 1
        if exponent:
            factors.append([divisor, exponent])
        divisor += 1
    if n > 1:
        factors.append([n, 1])
    return factors


def linear_convolution(a, b, length):
    required = len(a) + len(b) - 1
    if length < required:
        raise ValueError('Padding is insufficient for linear convolution.')
    return sfft.ifft(sfft.fft(a, length, workers=1) * sfft.fft(b, length, workers=1),
                     workers=1)[:required]


def padding_study():
    rng = np.random.default_rng(SEED)
    n = 8191
    a = rng.normal(size=n)
    b = rng.normal(size=n)
    needed = len(a) + len(b) - 1
    # The direct convolution is an independent O(n^2) reference, computed once.
    reference = convolve(a, b, mode='full', method='direct')
    lengths = list(range(needed, needed + 16))
    functions = {str(length): (lambda length=length: linear_convolution(a, b, length))
                 for length in lengths}
    measured = time_batches(functions, SEED + 71, batches=11, target_seconds=.008)
    rows = []
    for length in lengths:
        relative = float(np.linalg.norm(functions[str(length)]() - reference) / np.linalg.norm(reference))
        if relative > 1e-11:
            raise AssertionError('A padding strategy changed the convolution result.')
        rows.append({'length': length, 'factorization': factorization(length),
                     'timing': measured[str(length)], 'relative_l2_vs_reference': relative})
    return {
        'question': 'Can padding to a slightly longer FFT make the SAME linear convolution faster?',
        'protocol': 'Two fixed real arrays of length 8191; each method computes two forward complex FFTs, a pointwise product and one inverse FFT, then truncates to the required 16381 outputs. Eleven randomized batches at each of 16 neighboring valid transform lengths. Every result is checked against a separate direct convolution.',
        'limitations': 'Performance reflects SciPy on this CPU. Longer is not always faster, prime length is not automatically slow on every implementation, and no speedup changes the O(N log N) algorithmic class. Padding is valid here because all lengths exceed the full linear-convolution support.',
        'input_lengths': [n, n], 'required_length': needed,
        'next_fast_length': int(sfft.next_fast_len(needed)),
        'rows': rows,
    }


def smooth_poisson(n, method):
    if method not in ('spectral', 'fd'):
        raise ValueError('Unknown operator.')
    x = 2*np.pi*np.arange(n)/n
    X, Y = np.meshgrid(x, x, indexing='ij')
    exact = np.exp(.8*np.cos(X) + .6*np.sin(Y))
    source = exact * (.8*np.cos(X) + .6*np.sin(Y) - .64*np.sin(X)**2 - .36*np.cos(Y)**2)
    source_mean = float(source.mean())
    source = source - source_mean
    exact = exact - exact.mean()  # Match the unique discrete mean-zero gauge.
    modes = sfft.fftfreq(n, d=1/n)
    K, L = np.meshgrid(modes, modes, indexing='ij')
    h = 2*np.pi/n
    symbol = K*K + L*L if method == 'spectral' else 4/h**2*(np.sin(np.pi*K/n)**2 + np.sin(np.pi*L/n)**2)
    fhat = sfft.fft2(source, workers=1)
    uhat = np.zeros_like(fhat)
    nonzero = symbol > 0
    uhat[nonzero] = fhat[nonzero] / symbol[nonzero]
    computed = sfft.ifft2(uhat, workers=1).real
    # Re-transform the computed physical-space solution. Reusing uhat here would
    # mostly check the division identity and hide reconstruction roundoff.
    recovered_hat = sfft.fft2(computed, workers=1)
    residual = sfft.ifft2(symbol*recovered_hat, workers=1).real - source
    return {
        'n': n, 'method': method,
        'relative_solution_l2': float(np.linalg.norm(computed-exact)/np.linalg.norm(exact)),
        'relative_residual_l2': float(np.linalg.norm(residual)/np.linalg.norm(source)),
        'source_mean': source_mean, 'mean_removed': source_mean,
        'solution_mean_abs': float(abs(computed.mean())),
    }


def poisson_study():
    rows = []
    for method in ('spectral', 'fd'):
        previous = None
        for n in (8, 16, 32, 64, 128, 256):
            row = smooth_poisson(n, method)
            error = row['relative_solution_l2']
            row['observed_order'] = (float(np.log2(previous/error))
                                     if previous is not None and min(previous, error) > 1e-12 else None)
            previous = error
            rows.append(row)
    return {
        'question': 'Can an almost-zero discrete residual coexist with a visibly inaccurate PDE solution?',
        'protocol': 'Periodic [0,2π)² grid, u=exp(0.8 cos x+0.6 sin y) up to a constant, and the analytically differentiated source f=−Δu. This analytic field has infinitely many Fourier modes. Both source and reference are centered on each grid; removed source means are reported. Solve with either the continuous spectral symbol k²+l² or the five-point finite-difference symbol. Report the residual of the selected discrete operator separately from error against the sampled exact field.',
        'limitations': 'Smooth periodic manufactured data favor spectral convergence. The experiment does not cover nonsmooth fields or nonperiodic boundaries. Observed orders below the 1e−12 error threshold are omitted because roundoff dominates. Projecting the sampled source is necessary for discrete compatibility and is explicitly recorded.',
        'method_labels': {'spectral': 'Spectral symbol', 'fd': 'Five-point finite differences'},
        'rows': rows,
    }


def cpu_model():
    path = Path('/proc/cpuinfo')
    if path.exists():
        for line in path.read_text().splitlines():
            if line.startswith('model name'):
                return line.split(':', 1)[1].strip()
    return platform.processor() or 'Not reported'


def run_study():
    start = perf_counter()
    with threadpool_limits(limits=1):
        timing = timing_study()
        accuracy = accuracy_study()
        padding = padding_study()
        poisson = poisson_study()
        pools = threadpool_info()
    script_hash = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    return {
        'schema_version': 1,
        'metadata': {
            'generated_utc': datetime.now(timezone.utc).isoformat(),
            'seed': SEED, 'cpu': cpu_model(), 'platform': platform.platform(),
            'python': platform.python_version(),
            'versions': {'numpy': np.__version__, 'scipy': scipy.__version__,
                         'numba': numba.__version__, 'mpmath': mp.__version__},
            'clock': 'time.perf_counter', 'time_unit': 'seconds',
            'threads_requested': 1, 'threadpools': pools,
            'high_precision_decimal_digits': 80, 'numba_fastmath': False,
            'script_sha256': script_hash,
            'elapsed_seconds': perf_counter() - start,
            'scope': 'Measured CPU results in this environment; no GPU results or inferred timings.',
        },
        'timing': timing, 'accuracy': accuracy, 'padding': padding, 'poisson': poisson,
    }


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=Path('public/data/extended-study.json'))
    args = parser.parse_args()
    report = run_study()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, allow_nan=False) + '\n')
    print(json.dumps({'output': str(args.output), 'seconds': report['metadata']['elapsed_seconds'],
                      'timing_sizes': len(report['timing']['rows']),
                      'accuracy_rows': len(report['accuracy']['rows']),
                      'padding_lengths': len(report['padding']['rows']),
                      'poisson_rows': len(report['poisson']['rows'])}))
