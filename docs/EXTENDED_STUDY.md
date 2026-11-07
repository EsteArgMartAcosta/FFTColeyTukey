# Extended numerical study

This campaign complements the original measurements with repeated CPU timings,
multiple signal families, neighboring-length convolution, and a nonpolynomial
manufactured Poisson solution. The JSON stores every timing batch and accuracy
replicate used by the interface. It is empirical evidence, not a proof of a
worst-case error or runtime bound.

## Reproduce

Use the pinned dependencies in `experiments/requirements.txt` and run from the
repository root:

```bash
python -m pip install -r experiments/requirements.txt
python -m pytest experiments/tests/test_extended_study.py -q
python experiments/extended_study.py --output public/data/extended-study.json
```

The downloadable `public/downloads/extended_study.py` is a byte-identical copy
of the script. It is self-contained; it does not import the earlier campaign.
The output records the script SHA-256, package versions, CPU model, seed, clock,
thread-pool state, precision, and elapsed time. Timing values are in **seconds**.
The interface may convert them to microseconds or milliseconds for readability.

The forward convention is

\[
X_k=\sum_{j=0}^{N-1}x_j e^{-2\pi i jk/N};
\qquad
x_j=\frac1N\sum_{k=0}^{N-1}X_k e^{2\pi i jk/N}.
\]

## 1. Scaling with an explicit timing boundary

**Question.** How does measured execution scale when the mathematical transform
and input precision are held fixed?

We compare an independently implemented direct sum, a radix-2 DIT kernel, and
SciPy's optimized FFT. The first two kernels are compiled by Numba with
`fastmath=False`. The data type is complex128. Sizes range from 64 to 262144;
the quadratic direct method is measured only through 2048. Missing large-size
direct measurements remain absent, rather than being extrapolated as timings.

Inputs, roots, bit-reversal permutations, and JIT compilation are outside the
timed region. Each timed call allocates an output. SciPy's internal dispatch and
workspace handling remain inside the timed region, so these are precisely
defined **implementations**, not architecture-independent primitive costs.
Explicit planning time is stored as a separate single observation.

After warm-up, a short calibration chooses a batch count. Eleven rounds run the
methods in seeded random order. Each sample is elapsed batch time divided by its
number of calls. The chart's middle curve is the median; its band is the 10th–90th
percentile of these eleven **batch averages**. This is a descriptive variability
band, not a confidence interval, and it smooths individual-call jitter.

Each timed output is checked against SciPy before timing. The direct sum uses
integer exponents reduced modulo N to avoid unnecessarily large root angles.
It is not a dense-BLAS benchmark. Cache state, allocations, wrapper overhead,
compiler choices and this CPU affect the observed crossover.

## 2. Normwise accuracy and a weak spectral coefficient

**Question.** Does a small normwise FFT error imply an accurate weak coefficient?

At N=16,32,64,128,256, the study uses three seed/phase replicates of:

- complex Gaussian samples;
- a single complex Fourier mode at bin 3;
- a bin-3 mode of amplitude 10⁶ plus a bin-7 mode of amplitude 10⁻².

Both complex64 and complex128 inputs are tested with the compiled radix-2 and
SciPy methods. The reference is an independent direct DFT evaluated by mpmath
at 80 decimal digits. Crucially, each input is **cast to its tested precision
before** constructing its high-precision reference. Thus the reported normwise
error isolates the transformation of those represented input values:

\[
E_2=\frac{\|\widehat X-F_N x_{\mathrm{represented}}\|_2}
{\|F_N x_{\mathrm{represented}}\|_2}.
\]

Input quantization relative to the originally generated complex128 signal is
stored separately. It is zero by construction for the complex128 input; that
does not mean the analytic exponential was evaluated exactly. Output dtypes are
asserted to prevent silent promotion of the single-precision experiment.

For the dynamic-range family, the report also retains relative error at bin 7,
computed against that bin of the represented-input reference. The intended
analytic weak component may already be damaged by binary32 input rounding.
These two effects must not be conflated. Conditioning of the complete DFT in
the Euclidean norm is one; relative error in an individual nearly cancelled
coefficient can nevertheless be large.

Minimum, median and maximum across three replicates are descriptive. They are
not a sampling theorem or a proof of a stability bound. The raw replicates
remain available for inspection.

## 3. Padding preserves the problem while changing the FFT length

**Question.** Can a longer transform compute the same linear convolution faster?

Two fixed arrays of length 8191 require 16381 output coefficients. For each
transform length L=16381,…,16396, the timed pipeline performs two forward complex
FFTs, a pointwise product, an inverse FFT, and truncation to the required support.
All these lengths meet L ≥ len(a)+len(b)−1, so they implement the same linear
convolution in exact arithmetic. A separate direct convolution is the numerical
reference. Its computation is excluded from timing.

Eleven randomized batches are stored at each length, together with its prime
factorization and error against the direct reference. `next_fast_len` is reported
as a library-selected candidate, not asserted to be the fastest possible length.
A prime size can invoke a different algorithm; factorization, cache behavior and
implementation details all matter. One platform does not justify a universal
"prime bad, power of two best" conclusion.

## 4. Poisson: residual and solution error are different measurements

**Question.** Can an almost-zero discrete residual coexist with visible error
against the continuous PDE solution?

On the periodic square [0,2π)², take

\[
u(x,y)=e^{0.8\cos x+0.6\sin y}-C,
\]

where C fixes the mean. Analytic differentiation gives

\[
f=-\Delta u=e^{0.8\cos x+0.6\sin y}
\left(0.8\cos x+0.6\sin y-0.64\sin^2x-0.36\cos^2y\right).
\]

This is smooth and periodic and has infinitely many Fourier modes. It therefore
tests convergence beyond exact recovery of a resolved trigonometric polynomial.
For n=8,16,32,64,128,256, we sample the field and analytic source and subtract
their discrete means. The removed source mean is explicitly stored; the solver
solves this compatible projected source. Centering the sampled exact solution
selects the same discrete mean-zero gauge as the solver.

The spectral symbol is k²+l². The five-point symbol, with h=2π/n, is

\[
\lambda_h(k,l)=\frac4{h^2}
\left[\sin^2\!\left(\frac{\pi k}{n}\right)
+\sin^2\!\left(\frac{\pi l}{n}\right)\right].
\]

At nonzero modes, divide the source transform by the selected symbol; set the
solution's zero mode to zero. Report both

\[
\frac{\|u_h-u_{\mathrm{exact,sampled}}\|_2}
{\|u_{\mathrm{exact,sampled}}\|_2},
\qquad
\frac{\|L_hu_h-f_h\|_2}{\|f_h\|_2}.
\]

The residual uses the same discrete operator used to solve the system, applied
to a fresh FFT of the returned physical-space solution. This includes solution
reconstruction roundoff; it does not merely reuse the divided coefficients to
check a division identity. A small residual is evidence about that algebraic solve, not a discretization-error
certificate. Grid-halving orders are log₂(E_n/E_2n); they are omitted below an
error of 10⁻¹², where interpreting floating-point plateaus as convergence orders
would be misleading. Smooth periodic data favor spectral methods; no claim is
made about nonsmooth solutions or other boundary conditions.

## Validation

The study adds seven tests covering independent DFT/FFT agreement, single-
precision preservation, correctly referenced error, valid versus insufficient
convolution padding, smooth spectral convergence, second-order finite-difference
convergence, residuals, gauge fixing, and 80-versus-110-digit reference agreement.
All JSON numbers must be finite: serialization rejects NaN and infinity.
