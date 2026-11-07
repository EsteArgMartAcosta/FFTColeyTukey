# Numerical audit: November 7, 2026

## Verified scope

The prototype package was inspected and its experimental protocol reused. The Python experiments and 30 numerical tests were run again; all 30 passed. This audit does not replace independent validation of the TypeScript core or browser interface tests.

The original new run started at 14:29:15 UTC and ended at 14:29:22 UTC. Environment: Linux x86-64, Intel Xeon Platinum 8573C, Python 3.12.14, NumPy 2.3.5, SciPy 1.17.0, Numba 0.65.1, mpmath 1.3.0, and one BLAS thread. Full details remain in the JSON.

The later expanded campaign has its own protocol and provenance in [EXTENDED_STUDY.md](EXTENDED_STUDY.md). The numerical observations below refer specifically to the original `results.json` campaign.

## Changes relative to the historical package

- The accuracy reference now documents the exact conversion of an already representable binary input, distinguishing algorithmic error from input rounding.
- Tests check that single-precision paths retain `complex64` and that double-precision radix-2 returns `complex128`.
- The error metric defines the zero-reference case explicitly.
- The program hash, protocol version, and completion timestamp are recorded.
- Additional tests cover circular shifts, pure complex modes, 80-digit versus 110-digit references, preservation of the single-precision type, and zero input.
- The September result file was preserved byte for byte and separated from the active run.

## Observed evidence

The tests include agreement with SciPy through $N=1024$, impulses, constant signals, Parseval, inversion, invalid sizes, independent high-precision references, linear convolution, and periodic Poisson.

At $N=256$, the median relative normwise error of radix-2 across three double-precision signals was $3.3433\times10^{-16}$. For the single-precision stage implementation it was $1.0407\times10^{-7}$. These are observations on the tested signals, not universal stability bounds.

For Poisson at $N=128$, the finite-difference operator produced relative solution error $2.1945\times10^{-3}$ and relative residual $1.4868\times10^{-14}$. Error reduction under refinement is consistent with second order. This separates accurately solving the discrete system from accurately approximating the continuous problem.

Convolution of two vectors with 30,000 entries produced these descriptive medians:

| FFT length | Time per convolution |
|---:|---:|
| 59,999 | 13.7939 ms |
| 60,000 | 2.7924 ms |
| 65,536 | 3.1493 ms |

All three paths compute the same cropped linear convolution. Timing ratios change between runs and machines; they should not be transferred to another environment as constants.

## Limits of the evidence

The machine is a shared container without isolated clock frequency or system load. The original campaign uses nine timing batches and three signals per accuracy study. Quartiles are not confidence intervals. GPU execution and hardware-accelerated mixed precision were not measured.

The Poisson trigonometric polynomial is resolved on every tested grid. Spectral error near roundoff validates this example, but does not establish a convergence rate for every smooth source.

Dense DFT construction and radix-2 planning are recorded as single observations and excluded from kernel timing. Any display of the timing curves must retain this scope explanation.

## Provenance and reproduction

`public/data/provenance.json` identifies the active and historical runs. `public/data/results.json` contains raw samples and metadata; `timings.csv`, `accuracy.csv`, and `poisson.csv` provide tables. Reproduction instructions are in [EXPERIMENTS.md](EXPERIMENTS.md).

The recorded hash of `experiments/experiments.py` matches the executed program and its downloadable copy. The historical file matches the recovered original byte for byte.
