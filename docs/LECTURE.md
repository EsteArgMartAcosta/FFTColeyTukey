# Presenter guide · 55 minutes + 5 for discussion

| Chapter | Minutes | Action supporting the argument |
|---|---:|---|
| Overview | 2 | Separate the mathematical transform from its algorithm; ask what structure makes it faster. |
| Roots & DFT | 5 | Prove the geometric sum and obtain the inverse. Show both k=ℓ and k≠ℓ in the laboratory. |
| Cooley–Tukey | 17 | Derive the general reindexing, work through 12=3×4, then derive both radix-2 identities. |
| Butterflies | 8 | Explain bit reversal; step through N=8 and select a node. Derive the work recurrence. |
| Aliasing | 2 | Show two waves agreeing at every sample. Distinguish aliasing from spectral leakage. |
| Cost & accuracy | 9 | Contrast operation counts with timings, independent accuracy references, and length dependence. |
| Poisson | 9 | Establish compatibility, compare symbols, refine finite differences, and test an incompatible source. |
| Limits | 3 | Specify the computational model, introduce its potential, and connect to precision and memory. |

The concept map is a supporting index with no additional required time. Full proofs remain available for questions. The expanded experiments are supporting evidence rather than a requirement to present every plot. If the professor prefers a longer theoretical conclusion, reallocate time after rehearsal instead of silently extending the presentation.

## Three board derivations

1. Geometric sum and $F_N^*F_N=NI$: specify conjugation and normalization explicitly.
2. Cooley–Tukey: state the ranges of $a,b,c,d$ before expanding the product of indices. In radix-2, justify the $k+N/2$ output as well.
3. Poisson: integrate the periodic equation before dividing by eigenvalues. Explain why the zero mode determines existence and the remaining additive constant.

## Rehearse with the website

- Use **Present** to emphasize laboratories and **Study** to read the written development.
- Left/right arrows change chapters when focus is not inside a control. **F** toggles full screen.
- Pause motion before explaining an identity. Laboratory controls reset when the chapter or reading mode changes.
- The custom FFT vector accepts exactly N comma-separated real numbers. Presets also include complex data.
- For Poisson, choose the trigonometric source, N=64, and the spectral operator. Switch to finite differences, then N=128. Discuss residual and solution error separately.
- Add a constant and disable mean projection: the incompatible source must block the solve. Re-enable projection and explicitly state that the right-hand side has changed.
- In accuracy experiments, the reference receives the already representable input at each precision. Do not confuse the reported error with initial quantization.
- In length experiments, the cropped linear convolution is preserved; a DFT of a different length is not the same transform.
- Use floating proofs to answer a specific question, then return to the numerical observation that motivated it. Avoid opening a long derivation without stating its claim and assumptions first.

## Local backup

Before the talk, run `npm ci`, `npm run build`, and `npm run preview` on the presentation computer. Check the whole route and text sizes on the projector. Fonts, mathematical rendering, and measured datasets are bundled; the local server can remain available without Internet. Open external papers beforehand or retain copies where their licenses permit it.

## Boundaries worth being able to defend

The DFT is well conditioned in Euclidean norm, but a nearly zero coefficient may have a large relative error. Timings depend on the implementation and machine. Radix-2 requires power-of-two lengths; other factorizations support more sizes. The entropy lower bound applies to a restricted model. A residual measures the selected discrete system, whereas discretization error depends on how that system approximates the PDE. An observed convergence curve is evidence for the tested family and resolution range, not a proof of a universal rate.
