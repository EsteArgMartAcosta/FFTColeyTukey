# Reproducible experiments for FFT Atlas

The measurements in `public/data/results.json` come from an actual run of `experiments/experiments.py`. The file records UTC timestamps, CPU, package versions, random seed, thread configuration, timing samples, and the SHA-256 hash of the executed program. These values describe that specific environment.

The expanded research campaign is documented separately in [EXTENDED_STUDY.md](EXTENDED_STUDY.md). Its data are kept in a separate file so that the original protocols and measurements remain identifiable.

## Reproduce the original campaign

Use Python 3.12, preferably in a virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r experiments/requirements.txt
python -m pytest experiments/tests -q
python experiments/experiments.py --output public/data
```

On Windows, activate the environment with `.venv\Scripts\activate`. The downloadable `experiments.py` also accepts `--output data` when used outside this repository.

The JSON contains `metadata`, `timings`, `accuracy`, `convolution`, and `poisson`. CSV exports support inspection without running the website. Fresh timings vary with processor, system load, operating system, and numerical libraries. Reproducing a protocol does not mean reproducing every wall-clock measurement.

## Fourier convention

The forward transform is

$$
X_k=\sum_{n=0}^{N-1}x_n e^{-2\pi i nk/N},
$$

with no forward normalization. The inverse includes a factor of $1/N$. Every comparison uses this convention.

## Timing: compare implementations with a declared scope

For $N=64,128,256,512,1024,2048$, double-precision complex Gaussian signals are transformed by:

1. Multiplication by a precomputed dense DFT matrix.
2. A radix-2 decimation-in-time FFT compiled with Numba and `fastmath=False`.
3. `scipy.fft.fft`, with `workers=1`.

BLAS and OpenMP thread pools are limited to one thread. Each method is warmed up, and nine batches run in randomized order. Each timing sample is the average time per call within one batch. All samples, medians, and quartiles are retained. The interquartile range is descriptive; it is not a confidence interval.

Compilation, matrix construction, and radix-2 planning are outside the execution timing. Matrix and plan construction are recorded separately as single observations. Output allocation is included. The dense matrix requires $16N^2$ bytes with `complex128` entries.

Timing curves do not prove asymptotic complexity; operation counts establish that result. Observed timing differences also reflect different constants and implementation strategies, so they cannot be attributed entirely to asymptotic order.

## Accuracy: an independent reference

For $N=16,32,64,128,256$, three complex Gaussian signals are generated per size. An independent direct DFT is evaluated with 80 decimal digits in mpmath. The signal is first rounded to `complex64` or `complex128`; the reference receives exactly the resulting representable values. This separates algorithmic error from initial input quantization.

The error metric is

$$
\varepsilon_{\mathrm{rel}}
=\frac{\|\widetilde X-X_{\mathrm{ref}}\|_2}{\|X_{\mathrm{ref}}\|_2}.
$$

For a zero reference, discrepancy is zero when both vectors vanish and infinite when the computed result is nonzero.

The single-precision stage implementation uses `complex64` storage and twiddle factors; an explicit test checks that SciPy retains that type. Double-precision comparisons include radix-2, SciPy, and the dense DFT. One small case also compares 80-digit and 110-digit reference calculations.

Three signals do not characterize worst-case behavior or establish a universal statistical law. Although $F_N/\sqrt N$ is unitary, good normwise conditioning does not guarantee a small relative error in each nearly zero coefficient. An FFT–IFFT round trip provides an additional consistency check, not an independent reference.

## Length effects: preserve the same linear convolution

Two vectors of length 30,000 produce 59,999 linear-convolution coefficients. The program compares the minimum length, `scipy.fft.next_fast_len(59999)`, and the next power of two. Every result is cropped to the same linear convolution.

Agreement between these results is a consistency check between double-precision computations, not error against exact arithmetic. A separate test compares small convolutions with the direct sum from `numpy.convolve`. Zero-padding a signal changes its DFT and frequency grid; the preserved object here is the cropped linear convolution.

## Periodic Poisson: residual versus discretization error

The equation $-\Delta u=f$ is solved on $[0,2\pi)^2$, with zero mean and the manufactured solution

$$
u(x,y)=\sin(3x)\cos(2y)+\tfrac14\cos(5x),\qquad
f(x,y)=13\sin(3x)\cos(2y)+\tfrac{25}{4}\cos(5x).
$$

The grids have $N=16,32,64,128$ points in each direction. The spectral operator has symbol $k^2+\ell^2$. The periodic five-point operator has symbol

$$
\lambda_h(k,\ell)=\frac4{h^2}
\left(\sin^2\frac{\pi k}{N}+\sin^2\frac{\pi\ell}{N}\right),
\qquad h=\frac{2\pi}{N}.
$$

The zero solution mode is fixed to zero. The finite-difference residual is checked by applying the stencil in physical space, independently of the modal division. The spectral residual is checked by transforming the solution again and applying the spectral multiplier.

The error against the analytical solution and the residual of the chosen discrete system are reported separately. This manufactured solution is a trigonometric polynomial resolved on every grid in the experiment. The spectral method therefore reaches roundoff; this example does not establish a general spectral convergence rate. For finite differences, second-order convergence is expected: doubling $N$ should approximately divide the error by four.

## Historical data and browser computations

`results-historical-20260926.json` retains the prototype results from September 26, 2026. It is a historical provenance record. The original evidence laboratory reads the new run in `results.json`; measurements from the two environments are not silently combined.

The website also runs small JavaScript laboratories locally. Their timings depend on the browser and must not be pooled with the stored Python measurements.
