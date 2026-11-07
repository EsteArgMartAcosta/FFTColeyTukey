# FFT Atlas

Academic interactive website for Cooley–Tukey, Numerical Analysis, IMPA.

## Invariants
- Spanish prose; mathematics rendered with KaTeX. Forward DFT sign is negative; inverse includes 1/N.
- src/math.ts is the numerical core. Stage diagrams consume fftTrace from the same FFT kernel.
- Distinguish theorem, intuition, computed observation and limitation. Never invent benchmark results.
- Preserve Poisson periodic compatibility and explain changes to the source from mean projection.
- Distinguish spectral and finite-difference operators, residual and continuous-solution error.
- N log N complexity statements must identify the allowed size/factorization and computational model.
- Entropy lower bounds require the unitary two-coordinate gate model. State permutation conventions.
- Fresh Python results live in public/data/results.json; preserve historical provenance.
- Source is hosted at EsteArgMartAcosta/FFTColeyTukey. base is /FFTColeyTukey/.

## Validation
- npm test: independent numerical properties and strict mathematical typography.
- npm run build: TypeScript and production bundling.
- python3 -m pytest experiments/tests -q: independent Python checks.
- Review interactions and desktop/mobile layout before publishing major UI changes.
- Keep all runtime fonts, formula rendering and data bundled; external links are references only.

## User authorization
The project owner authorized implementation and GitHub Pages publication in this repository. Preserve unrelated content and report the published result accurately. Never claim tests or deployment succeeded without evidence.
