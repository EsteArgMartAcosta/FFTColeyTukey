# FFT Atlas · Cooley–Tukey

An interactive academic website for a Numerical Analysis presentation at IMPA. Nine chapters connect the algebraic structure of the DFT, Cooley–Tukey factorization, implementation, floating-point behavior, and periodic Poisson equations.

**Website:** https://esteargmartacosta.github.io/FFTColeyTukey/

## Explore, study, present

- **Explore:** laboratories with parameters, values, and indices computed live.
- **Study:** complete derivations, floating mathematical explanations, and questions to prepare for discussion.
- **Present:** a 55-minute route, with five additional minutes for questions.
- **Concept map:** 22 draggable concepts, animated connections, zoom, category filters, search, and four inspector views.
- **Mathematical dossier:** 16 detailed proofs opened on hover or focus; click to pin, expand, or switch derivations.
- **Research dashboard:** four recorded studies and two live laboratories, inspectable charts, descriptive variation bands, and downloadable observations.

The laboratories include roots of unity and orthogonality, general factorization without a coprimality requirement, stage-by-stage radix-2, aliasing and spectral leakage, measured runtime and accuracy, two Poisson discretizations, and an entropy lower bound in a restricted model. The extended numerical campaign adds separate reproducible evidence with its own protocol and provenance.

## Run locally

Requires Node.js 24 and npm.

```bash
npm ci
npm run dev
```

Open the address printed by Vite with the path `/FFTColeyTukey/`. To check and build the production version:

```bash
npm test
npm run build
npm run preview
```

Fonts, KaTeX, and datasets are bundled. Once dependencies have been installed, the local server works without an Internet connection for the presentation; external reference links still need Internet. `npm run preview` requires a built `dist/` directory.

## Conventions and verification

The forward DFT uses the negative sign and no normalization. The inverse includes `1/N`. The stage trace and FFT share one numerical kernel. Tests use independent references and check Parseval, every displayed butterfly, composite lengths, the Poisson zero mode, and grid convergence. Mathematical content is also checked with strict KaTeX rendering.

Operation counts, mathematical bounds, and observations are labeled separately. Stored timings are actual CPU measurements from the documented environment; opening a chart does not run Python. GPU and hardware mixed-precision discussions are attributed to their sources rather than presented as our own reproduction.

- [Mathematical development](docs/MATHEMATICS.md)
- [Original experiment protocol](docs/EXPERIMENTS.md)
- [Expanded research campaign](docs/EXTENDED_STUDY.md)
- [Numerical audit](docs/NUMERICAL_AUDIT.md)
- [Presenter guide](docs/LECTURE.md)
- [BibTeX references](docs/REFERENCES.bib)

## Structure

| Path | Purpose |
|---|---|
| `src/math.ts` | DFT, FFT, trace, composite factorization, and Poisson |
| `src/content.ts`, `src/proofs.ts` | Theory, derivations, discussion questions, and references |
| `src/labs.ts`, `src/advanced.ts` | Interactive numerical laboratories |
| `src/research.ts`, `src/charts.ts` | Six research views and interactive scientific charts |
| `src/network.ts`, `src/proof-lens.ts` | Concept network and complete floating derivations |
| `src/field.ts` | Procedural animated Fourier surface with reduced-motion support |
| `src/main.ts`, `src/style.css` | Navigation and responsive visual design |
| `experiments/` | Reproducible Python experiments and independent tests |
| `public/data/` | Measured results, CSV tables, and provenance |
| `tests/` | Numerical TypeScript tests and mathematical typography checks |

## GitHub Pages

Vite uses `base: '/FFTColeyTukey/'`. The workflow `.github/workflows/pages.yml` tests and builds before deploying `main`; pull requests are validated without deployment. **Settings → Pages → Source** is configured as **GitHub Actions**. The independent `numerics.yml` workflow checks Python when the experiments change.

Deployment requires no private keys in the source code. The temporary workflow token has limited Pages permissions. If the repository name changes, update both `base` and the website URL.

## Academic scope

This is independent educational material, not an official IMPA publication. Linked papers belong to their authors. Stability and complexity statements include their mathematical assumptions. A finite test suite does not replace a proof.
