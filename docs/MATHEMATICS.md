# FFT Atlas: mathematical conventions and proof map

The complete English derivations live in [src/proofs.ts](../src/proofs.ts). They are the shared source for the chapter text and floating proof explorer; each contains its assumptions, statement, derivation, and interpretation. [src/content.ts](../src/content.ts) supplies the chapter introductions, questions for an oral defense, and bibliography. This document records the mathematical contract that the numerical core and visualizations must satisfy.

The main presentation has 55 minutes of content plus roughly five minutes for questions. The aliasing laboratory is integrated into the foundations or used during questions; the concept map remains available throughout. Additional derivations support study and discussion rather than adding unannounced time to the main route.

## Proof index

| Proof ID | Topic | Main mathematical point |
|---|---|---|
| `orthogonality` | Roots of unity | A finite geometric sum is zero unless its frequency is divisible by N |
| `inverse-parseval` | Inverse and energy | F*F = NI implies inversion and Parseval |
| `polynomial-view` | Evaluation viewpoint | Opposite roots share their square, enabling reuse |
| `cooley-tukey` | General factorization | Two index bijections separate the Fourier kernel |
| `radix-two` | Butterflies | One twiddle product produces two outputs |
| `bit-reversal` | Iterative execution | Recursive leaf order becomes contiguous bottom-up blocks |
| `operation-count` | Work and memory | N/2 butterflies in each of log₂N stages |
| `conditioning` | Problem sensitivity | Normwise relative perturbations are preserved |
| `stability` | Arithmetic error | Controlled unitary-stage errors accumulate with stage count |
| `aliasing` | Sampling | Continuous modes combine in residue classes |
| `leakage` | Finite windows | Off-grid tones produce a finite geometric kernel |
| `convolution` | Multiplication | Sufficient padding prevents circular wraparound |
| `poisson-zero` | Solvability | The mean-zero source condition is necessary and sufficient |
| `poisson-symbols` | Discretization | Spectral and finite-difference symbols define different systems |
| `poisson-error` | Numerical diagnosis | Residual controls algebraic error, not discretization error |
| `entropy-bound` | Restricted optimality | Each unitary two-coordinate gate changes the potential by at most two bits |

## 1. DFT, inverse, and normalization

Use zero-based indices and the negative forward exponent:

\[
\omega_N=e^{-2\pi i/N},\qquad X_k=\sum_{n=0}^{N-1}x_n\omega_N^{nk},
\qquad x_n=\frac1N\sum_{k=0}^{N-1}X_k\omega_N^{-nk}.
\]

The finite geometric sum gives

\[
\sum_{n=0}^{N-1}\omega_N^{qn}=N\mathbf1_{N\mid q}.
\]

Hence \(F_N^*F_N=NI\), \(U_N=F_N/\sqrt N\) is unitary, and

\[
\|F_Nx\|_2^2=N\|x\|_2^2,\qquad \kappa_2(F_N)=1.
\]

The two-dimensional inverse divides by \(N^2\) on an \(N\times N\) grid. The original Cooley–Tukey paper uses a positive exponent; sign conventions differ without changing the underlying factorization. Every formula, axis label, and numerical routine in this atlas uses the convention above.

## 2. General Cooley–Tukey: indices and matrix order

Let \(N=N_1N_2\), \(n=a+N_1b\), and \(k=c+N_2d\), with \(0\leq a,d<N_1\) and \(0\leq b,c<N_2\). Euclidean division establishes both bijections. Expanding

\[
nk=ac+aN_2d+N_1bc+Nbd
\]

and applying root identities yields

\[
X_{c+N_2d}=\sum_{a=0}^{N_1-1}\omega_{N_1}^{ad}\omega_N^{ac}
\sum_{b=0}^{N_2-1}x_{a+N_1b}\omega_{N_2}^{bc}.
\]

Define \(P\) by \((Px)_{aN_2+b}=x_{a+N_1b}\), and define the diagonal twiddle matrix by \(D_{aN_2+c,aN_2+c}=\omega_N^{ac}\). Under exactly this storage convention,

\[
F_N=(F_{N_1}\otimes I_{N_2})D(I_{N_1}\otimes F_{N_2})P.
\]

The product output index \(dN_2+c\) is already the natural frequency index. No coprimality is assumed. Nonsquare factors, reversed factor order, and repeated factors must all pass independent DFT comparisons.

A single split does not prove quasilinear work for every integer family. The smaller transforms must also be analyzed. Repeated bounded-radix splitting gives the familiar asymptotic behavior; prime-size algorithms are a separate extension.

## 3. Radix-2, execution, and exact operation counts

For even N, write E and O for the DFTs of the even and odd subsequences. Then

\[
X_k=E_k+\omega_N^kO_k,\qquad X_{k+N/2}=E_k-\omega_N^kO_k.
\]

The minus sign follows from \(\omega_N^{N/2}=-1\) and the period N/2 of E and O. The butterfly matrix B satisfies \(B^*B=2I\), so its normalized version is unitary.

Iterative DIT for \(N=2^m\) reverses the m input-index bits, then uses block sizes 2, 4, …, N. The recursive split reads the least significant bit first; the leaf traversal explains the permutation. The final output is in natural frequency order. The one-level even/odd permutation is not full bit reversal.

Before special-twiddle simplification, the standard network has

\[
B(N)=M(N)=\frac N2\log_2N,\qquad A(N)=N\log_2N.
\]

M counts complex products and A complex additions. Direct literal evaluation uses \(N^2\) products and \(N(N-1)\) additions. Twiddle generation, planning, copies, and real instruction counts require their own cost model. A stage trace uses O(N log N) storage; an iterative current-state array uses O(N).

## 4. Sampling, leakage, and convolution

At \(t_n=2\pi n/N\), integer frequencies differing by a multiple of N are indistinguishable. If the continuous Fourier coefficients are absolutely summable, then

\[
\widetilde f_k=\frac1N\sum_n f(t_n)e^{-ikt_n}
=\sum_{q\in\mathbb Z}\widehat f_{k+qN}.
\]

The regularity assumption justifies interchanging the Fourier series and finite sum; orthogonality selects the residue class. This is distinct from leakage. A finite complex tone with noninteger bin frequency α gives, for δ = α − k,

\[
X_k=e^{\pi i(N-1)\delta/N}\frac{\sin(\pi\delta)}{\sin(\pi\delta/N)},
\]

with the limiting value N when δ is divisible by N. Zero padding samples the same finite-record transform more densely; it adds no observations.

The DFT converts circular convolution to pointwise multiplication. A linear convolution of lengths \(n_a,n_b\) has support of length \(n_a+n_b-1\). Padding both inputs to any \(L\geq n_a+n_b-1\), transforming, multiplying, inverting, and cropping recovers that same linear convolution. Shorter lengths can fold distinct output coefficients together. Timing comparisons of padding lengths must preserve this mathematical output.

## 5. Conditioning and conditional stability

For x nonzero, exact DFT perturbations satisfy

\[
\frac{\|F_N\delta x\|_2}{\|F_Nx\|_2}=\frac{\|\delta x\|_2}{\|x\|_2}.
\]

Individual coefficients can be sensitive when cancellation makes them small. Their relative sensitivity to normwise input perturbations is \(\sqrt N\|x\|_2/|X_k|\), when Xk is nonzero. At a zero coefficient, use an absolute or globally normalized error.

For normalized unitary stages \(U_N=Q_m\cdots Q_1P\), suppose

\[
\|\operatorname{fl}(Q_sv)-Q_sv\|_2\leq\eta\|v\|_2.
\]

Unrolling the computed recurrence gives

\[
\|\widetilde y-U_Nx\|_2\leq\big((1+\eta)^m-1\big)\|x\|_2.
\]

If \(\eta\leq\gamma_c=cu/(1-cu)\) and cmu < 1, this is at most \(\gamma_{cm}\). Accurate twiddles, controlled complex arithmetic, and exclusion of overflow/significant underflow are essential assumptions. The atlas does not claim a certified c for a browser trigonometric library.

Unitarity gives an exact backward-error interpretation: \(\delta x=U_N^*(\widetilde y-U_Nx)\). Its relative norm equals the forward relative norm. This argument is normwise, and it does not certify every tiny coefficient.

## 6. Periodic Poisson and numerical error

On \(\mathbb T^2=[0,2\pi)^2\), solve \(-\Delta u=f\) with zero mean. For smooth periodic f, compatibility is \(\widehat f_{0,0}=0\). Nonzero Fourier modes satisfy

\[
\widehat u_{k,\ell}=\widehat f_{k,\ell}/(k^2+\ell^2),\qquad \widehat u_{0,0}=0.
\]

Existence follows from the convergent Fourier construction; uniqueness follows by integrating \(\overline v(-\Delta v)\) for the difference of two solutions. Artificially replacing the zero denominator does not repair an incompatible problem. Source-mean projection changes the equation and must be reported.

On a grid with h = 2π/N, the five-point finite-difference symbol is

\[
\lambda_h(k,\ell)=4h^{-2}\left(\sin^2(kh/2)+\sin^2(\ell h/2)\right).
\]

Applying the stencil to a Fourier mode proves the symbol directly. For fixed k, ℓ as h tends to zero,

\[
\lambda_h=k^2+\ell^2-\frac{h^2}{12}(k^4+\ell^4)+O(h^4).
\]

This is not a uniform relative approximation near Nyquist. The spectral and finite-difference solvers use the same transform but solve different systems.

For the exact discrete solution uh and computed solution ũh,

\[
\widetilde u_h-u_*|_h=(\widetilde u_h-u_h)+(u_h-u_*|_h).
\]

Residual controls the first term through the inverse discrete operator on the mean-zero subspace. It does not control the second term. The trigonometric manufactured solution checks exactly represented modes. The analytic solution \(e^{\cos x+\sin y}\), with its mean removed, introduces infinitely many modes and supports a meaningful refinement experiment. Its source is

\[
f=(\cos x+\sin y-\sin^2x-\cos^2y)e^{\cos x+\sin y}.
\]

A general convergence theorem must still state regularity, truncation, and sampling assumptions. Two-dimensional FFT cost is O(N² log N), or O(M log M) for M = N² unknowns.

## 7. Entropy lower bound and scope

Ailon's exact circuit model permits unitary 2×2 gates on pairs of N complex registers and no auxiliary registers. Define

\[
\Phi(M)=-\sum_{i,j}|M_{ij}|^2\log_2|M_{ij}|^2,\qquad 0\log_20=0.
\]

The initial potential is zero and the normalized Fourier matrix has potential N log₂N. One gate only changes two rows. In each column the sum of their squared magnitudes is preserved; their contribution changes by at most that sum. Adding columns gives at most two, because each row has unit norm. Therefore T ≥ (N/2) log₂N gates are required.

This is not entropy of a signal, a universal lower bound across every computational model, or a prediction in seconds. If permutations are charged as gates, account for their swaps. Normalized radix-2 matches the asymptotic order for power-of-two sizes.

## Evidence standards

- A mathematical proof establishes a claim under explicit assumptions.
- An experimental curve describes the specified inputs, arithmetic, reference, and execution environment.
- A theoretical reference slope is not a wall-clock forecast.
- Interquartile ranges are descriptive variability, not confidence intervals.
- Direct high-precision references must use the stored input values when isolating transform arithmetic error.
- External GPU and mixed-precision papers are attributed as research context, not claimed as locally reproduced experiments.
- Numerical tests verify selected cases and invariants; they do not substitute for the derivations above.

Primary references and numerical-analysis sources are linked in the site and recorded in [REFERENCES.bib](REFERENCES.bib).
