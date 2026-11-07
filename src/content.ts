import {proofEntries} from './proofs.ts';

export type Chapter = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  minutes: number;
  question: string;
  body: string;
};

const section = (label:string,title:string,body:string) =>
  `<section class="theory-block"><div class="eyebrow">${label}</div><h3>${title}</h3>${body}</section>`;
const note = (body:string) => `<aside class="note">${body}</aside>`;
const development = (id:string) => {
  const p=proofEntries.find(p=>p.id===id)!;
  return section('THEOREM & DERIVATION',p.title,`<p>${p.summary}</p><div class="theorem-statement">${p.statement}</div><button type="button" class="proof-link" data-proof="${p.id}">Explore the full derivation ↗</button><details><summary>Read every step here</summary><div class="proof-content">${p.body}</div></details>`);
};

export const chapters:Chapter[] = [
  {
    id:'overview', kicker:'AN INTERACTIVE RESEARCH ATLAS · IMPA', title:'Structure changes the computation.',
    subtitle:'A rigorous journey from roots of unity to fast transforms, numerical evidence, and periodic PDEs.',
    minutes:2, question:'What structure lets us evaluate exactly the same transformation with dramatically less work?', body:''
  },
  {
    id:'roots', kicker:'01 · THE GEOMETRY OF THE DFT', title:'A basis built from rotation.',
    subtitle:'Roots of unity turn samples into frequency coordinates. Orthogonality makes the transformation invertible.',
    minutes:5, question:'Why do discrete oscillations form an orthogonal basis?',
    body:section('DEFINITION','One convention, throughout the atlas',String.raw`
      <p>Let \(N\geq1\), \(x\in\mathbb C^N\), and use indices \(0,\ldots,N-1\). The forward transform uses a negative sign and no normalization:</p>
      \[\omega_N=e^{-2\pi i/N},\qquad X_k=\sum_{n=0}^{N-1}x_n\omega_N^{nk},\qquad X=F_Nx.\]
      <p>The inverse uses the positive sign and a factor \(1/N\). The DFT is an exact finite-dimensional linear map; an FFT is an algorithm for evaluating that map. Approximating a continuous Fourier transform is a separate modelling and sampling question.</p>
      <p>The geometric picture uses clockwise roots, consistent with this sign convention. A positive-frequency input \(x_n=e^{2\pi i qn/N}\) occupies output bin \(q\bmod N\), with amplitude \(N\).</p>
    `)+section('INTUITION','Rotation becomes a coordinate system',String.raw`
      <p>A coefficient measures alignment with one oscillation. When two discrete frequencies differ, their phase differences sweep a symmetric set of roots and cancel; when they agree modulo \(N\), every phase difference is zero.</p>
      \[X_k=\langle (e^{2\pi i kn/N})_{n=0}^{N-1},x\rangle.\]
      <p>The laboratory separates the location of each root from the accumulated vector sum. Repeated points do not invalidate orthogonality. Exact zero and a floating-point number near zero must be interpreted differently.</p>
    `)+development('orthogonality')+development('inverse-parseval')+development('polynomial-view')+
    note(String.raw`<strong>Reading the theorem correctly.</strong> Unitarity after normalization is a statement in the Euclidean norm. It does not imply that every tiny Fourier coefficient has a small relative error. The precision chapter makes that distinction explicit.`)
  },
  {
    id:'factor', kicker:'02 · THE CENTRAL ALGEBRAIC ARGUMENT', title:'Factor the size. Expose the reuse.',
    subtitle:'A change of indices turns a large Fourier sum into short transforms, diagonal rotations, and a permutation.',
    minutes:17, question:'How does a dense DFT become several small DFTs and twiddle factors?',
    body:section('ROADMAP','Three passes, one exact transformation',String.raw`
      <p>For \(N=N_1N_2\), the first pass transforms a strided set of inputs; the second applies phase rotations; the third transforms along the other index. The reusable inner sums are the computational opportunity.</p>
      \[x\ \longrightarrow\ A_{a,c}\ \longrightarrow\ \omega_N^{ac}A_{a,c}\ \longrightarrow\ X_{c+N_2d}.\]
      <p>The factorization laboratory exposes all of these arrays, with actual complex values. It compares its final output with an independently evaluated direct DFT. That comparison is an experiment; the following index derivation proves the identity for all inputs.</p>
    `)+development('cooley-tukey')+development('radix-two')+section('ALGORITHMIC CONSEQUENCE','A factorization is also an execution plan',String.raw`
      <p>The same algebra admits different memory layouts, radix orders, and traversal strategies. A mathematical factorization is therefore not yet a complete performance model. Good implementations account for contiguous access, cache reuse, vector instructions, and the cost of planning.</p>
      \[T(N_1N_2)=N_1T(N_2)+N_2T(N_1)+O(N_1N_2).\]
      <p>The last term covers the twiddle pass and data movement at the arithmetic-model level. Repeated bounded-radix splitting gives quasilinear arithmetic work. Large prime factors require an additional algorithmic choice; the simple radix-2 recurrence does not cover them.</p>
    `)+note(String.raw`<strong>No coprimality assumption.</strong> The proof uses Euclidean division and root identities. It works for \(N_1=N_2\), including \(16=4\cdot4\). A Chinese-remainder factorization is a different construction.`)
  },
  {
    id:'butterfly', kicker:'03 · FROM THE PROOF TO THE EXECUTION', title:'One rotation. Two outputs.',
    subtitle:'Inspect the actual complex values moving through the network, one butterfly and one stage at a time.',
    minutes:8, question:'What does each stage compute, and why does bit reversal appear?',
    body:section('LOCAL OPERATION','The butterfly is an executable identity',String.raw`
      \[t=wb,\qquad y_0=a+t,\qquad y_1=a-t,\qquad |w|=1.\]
      <p>The same product serves two outputs. Selecting a connection reveals both source values, the twiddle factor, and the resulting pair. The visual trace is generated by the same numerical kernel as the FFT itself.</p>
      <p>At stage \(s\), the block length is \(2^s\). The graph initially displays the bit-reversed input; the final column is in natural frequency order. Distinguish these two orders before interpreting a highlighted row.</p>
    `)+development('bit-reversal')+development('operation-count')+section('IMPLEMENTATION','The visualization has a storage cost of its own',String.raw`
      <p>A recursive implementation mirrors the proof directly. An iterative implementation can update one work array after reordering the data. This atlas additionally records every stage so that intermediate computations remain inspectable.</p>
      \[\text{single current state: }O(N),\qquad \text{complete stage trace: }O(N\log N).\]
      <p>The trace is an educational data structure, not a lower bound on FFT memory. Similarly, animation duration is a presentation choice; it is not a benchmark of numerical execution.</p>
    `)
  },
  {
    id:'aliasing', kicker:'04 · WHAT THE SAMPLES CANNOT DISTINGUISH', title:'Different waves. Identical samples.',
    subtitle:'The sampling operator determines what is identifiable; the FFT computes the information already present.',
    minutes:0, question:'How can two different frequencies produce exactly the same sampled vector?',
    body:section('INTUITION','A grid sees residue classes',String.raw`
      <p>Imagine recording the angle of a rotating pointer only at equally spaced times. Adding whole turns between observations changes the continuous motion while leaving every recorded angle unchanged. On the Fourier grid, that ambiguity is exactly arithmetic modulo \(N\).</p>
      <p>The integer-frequency control demonstrates exact aliasing. The off-grid-frequency control demonstrates leakage from a finite observation window. Compare the continuous curves, the sample points, and the computed spectrum separately.</p>
    `)+development('aliasing')+development('leakage')+note(String.raw`<strong>Placement in the presentation.</strong> This chapter is an optional laboratory that can be visited during the five-minute foundations segment or expanded during questions. It has no separate time allocation in the 55-minute main route.`)
  },
  {
    id:'evidence', kicker:'05 · NUMERICAL ANALYSIS & REPRODUCIBLE EVIDENCE', title:'Measure the claim you are making.',
    subtitle:'Arithmetic work, elapsed time, and numerical error require different experiments and different interpretations.',
    minutes:9, question:'Which conclusions follow from algebra, and which depend on arithmetic, implementation, and hardware?',
    body:section('EXPERIMENTAL CONTRACT','Every curve has a protocol',String.raw`
      <p>Theoretical operation counts are exact within their declared model. Stored timing curves are actual measurements from the recorded environment. Live browser experiments are new local measurements. None of these quantities is silently substituted for another.</p>
      <p>A reproducible experiment specifies input generation and seed, transform lengths, numeric types, warmup, repetitions, threading, preparation costs, reference computation, and the error norm. Medians summarize typical observations; interquartile ranges describe dispersion, not confidence intervals or worst-case guarantees.</p>
      \[\varepsilon_{\rm rel}=\frac{\|\widetilde X-X_{\rm ref}\|_2}{\|X_{\rm ref}\|_2}.\]
      <p>If the reference is zero, relative error is undefined. Report absolute error or identify the zero-reference case. Tiny coefficients deserve an absolute or globally normalized scale.</p>
    `)+development('conditioning')+development('stability')+development('convolution')+section('HOW TO INTERPRET THE RESULTS','An experiment can challenge a claim without proving a theorem',String.raw`
      <p>A reference slope \(N\log N\) is a scaling guide, not a universal prediction in seconds. A library FFT can beat an educational FFT by a large constant while sharing the same asymptotic order. Precomputing a dense matrix removes setup from execution time but consumes quadratic memory.</p>
      <p>Comparing single and double precision requires checking the library's actual input and output types. Comparing to a double-precision reference is useful but does not establish double-precision forward error; the high-precision direct reference serves that purpose at tractable sizes.</p>
      <p>Accuracy on a random ensemble is evidence about that ensemble. It does not replace a worst-case error analysis. A measured advantage of one padded length is specific to the transform library and environment.</p>
    `)
  },
  {
    id:'poisson', kicker:'06 · FOURIER AS AN ELLIPTIC SOLVER', title:'Transform. Divide. Reconstruct.',
    subtitle:'A frequency-space diagonalization becomes a fast solver, with compatibility and discretization kept explicit.',
    minutes:9, question:'Why can a tiny residual coexist with a visible error in the continuous solution?',
    body:section('THE NUMERICAL PROBLEM','A diagonalization is useful only after the operator is specified',String.raw`
      <p>We solve \(-\Delta u=f\) on a periodic square, with the mean of \(u\) fixed to zero. The Fourier basis converts the continuous constant-coefficient operator to scalar multiplication. On a grid, the chosen symbol determines whether we solve a spectral collocation problem or a finite-difference system.</p>
      \[f_h\ \xrightarrow{\ \mathcal F\ }\ \widehat f_h\ \xrightarrow{\ /\lambda\ }\ \widehat u_h\ \xrightarrow{\ \mathcal F^{-1}\ }\ u_h.\]
      <p>The zero mode is excluded from division and checked for compatibility. The source, spectrum, solution, residual, and exact-reference error are displayed as separate objects.</p>
    `)+development('poisson-zero')+development('poisson-symbols')+development('poisson-error')+note(String.raw`<strong>What is essential here.</strong> Constant coefficients, periodic boundaries, and a uniform grid produce this direct diagonalization. Other boundary conditions can lead to sine/cosine transforms; variable coefficients generally destroy the simple mode-by-mode scalar solve.`)
  },
  {
    id:'limits', kicker:'07 · LOWER BOUNDS & COMPUTATIONAL FRONTIERS', title:'What work is unavoidable?',
    subtitle:'A lower bound needs a model. A fast implementation needs an understanding of the machine.',
    minutes:5, question:'In which computational model is quasilinear work optimal, and where can implementations still improve?',
    body:development('entropy-bound')+section('RESEARCH CONTEXT','The arithmetic count is only one layer',String.raw`
      <p>FFTW uses planning and adaptive decompositions to exploit hardware. FlashFFTConv investigates reorganizing long convolutions around matrix units and memory traffic. These research directions improve implementation performance without contradicting a bound in a restricted arithmetic circuit model.</p>
      <p>Mixed precision raises a different question: how many bits do data, twiddles, and accumulations need to satisfy the downstream application's tolerance? Deveshwar, Rajagopal, and Larson study a mixed-precision FFT with MRI applications. These papers are research references, not GPU or MRI experiments reproduced by this atlas.</p>
      <p>A meaningful extension would choose stage precisions under a final Poisson error budget. Such a study must separate discretization error, arithmetic error, and measured hardware speed; a software emulation alone does not demonstrate acceleration.</p>
    `)+section('DEFENSIBLE CONCLUSION','Three levels of evidence',String.raw`
      <p><strong>Proved:</strong> the transform identity, the radix-2 operation count, and the entropy lower bound under its model.</p>
      <p><strong>Conditional:</strong> the normwise error bound given controlled stage errors and accurate twiddle factors.</p>
      <p><strong>Observed:</strong> measured timing distributions and numerical errors for the stored and live experiments. Their inputs, environments, and reference methods define the scope of each conclusion.</p>
    `)
  },
  {
    id:'map', kicker:'08 · THE THEORY AS A CONNECTED SYSTEM', title:'Every idea has a dependency.',
    subtitle:'Move between intuition, definitions, complete derivations, experiments, and the limits of each claim.',
    minutes:0, question:'Which mathematical results support each algorithm and each numerical conclusion?', body:''
  }
];

export const references:{id:string;authors:string;title:string;year:string;url:string;note:string}[] = [
  {id:'cooley-tukey',authors:'James W. Cooley · John W. Tukey',title:'An Algorithm for the Machine Calculation of Complex Fourier Series',year:'1965',url:'https://doi.org/10.1090/S0025-5718-1965-0178586-1',note:'The central paper. Mathematics of Computation 19(90), 297–301. Composite-size factorization and computational organization. The paper uses a positive exponent; this atlas consistently uses a negative forward exponent.'},
  {id:'higham',authors:'Nicholas J. Higham',title:'Accuracy and Stability of Numerical Algorithms, 2nd edition',year:'2002',url:'https://nhigham.com/accuracy-and-stability-of-numerical-algorithms/',note:'The numerical-analysis framework for roundoff, conditioning, forward error, and backward stability. The atlas states its stage-error assumptions rather than assigning an unverified constant to a browser implementation.'},
  {id:'trefethen',authors:'Lloyd N. Trefethen',title:'Spectral Methods in MATLAB',year:'2000',url:'https://people.maths.ox.ac.uk/trefethen/spectral.html',note:'SIAM. Periodic Fourier grids, differentiation, smoothness and spectral accuracy, with numerical PDE examples and the author’s accompanying programs. The atlas supplies its own explicit periodic-Poisson derivations.'},
  {id:'fftw3',authors:'Matteo Frigo · Steven G. Johnson',title:'The Design and Implementation of FFTW3',year:'2005',url:'https://www.fftw.org/fftw-paper-ieee.pdf',note:'Proceedings of the IEEE 93(2), 216–231. Planning, adaptive decomposition, and the interaction between numerical algorithms and hardware.'},
  {id:'fftw-definition',authors:'FFTW',title:'What FFTW Really Computes',year:'Technical documentation',url:'https://www.fftw.org/fftw3_doc/What-FFTW-Really-Computes.html',note:'Explicit transform definitions and sign/normalization conventions. A useful check when comparing the atlas, independent scripts, and library calls.'},
  {id:'fftw-accuracy',authors:'FFTW / benchFFT',title:'FFT Accuracy Benchmark Methodology',year:'Technical documentation',url:'https://www.fftw.org/accuracy/method.html',note:'Independent high-precision references and meaningful normwise accuracy comparisons. A round-trip test alone is not sufficient verification.'},
  {id:'fftw-twiddles',authors:'FFTW / benchFFT',title:'FFT Accuracy Benchmark Comments',year:'Technical documentation',url:'https://www.fftw.org/accuracy/comments.html',note:'Explains why twiddle-factor generation and floating-point implementation details can dominate an otherwise well-conditioned transform.'},
  {id:'ailon',authors:'Nir Ailon',title:'A Lower Bound for Fourier Transform Computation in a Linear Model Over 2×2 Unitary Gates Using Matrix Entropy',year:'2013',url:'https://arxiv.org/abs/1305.4745',note:'The entropy lower bound for a restricted exact unitary-gate model. It must not be presented as a universal lower bound for every conceivable Fourier algorithm.'},
  {id:'flashfftconv',authors:'Daniel Y. Fu · Hermann Kumbong · Eric Nguyen · Christopher Ré',title:'FlashFFTConv: Efficient Convolutions for Long Sequences with Tensor Cores',year:'2023 · preprint',url:'https://arxiv.org/abs/2311.05908',note:'Research on reorganizing FFT convolutions for matrix units and memory efficiency. The paper’s GPU benchmarks are external research, not locally reproduced results.'},
  {id:'mixed-precision',authors:'Nikhil Deveshwar · Abhejit Rajagopal · Peder E. Z. Larson',title:'A Mixed Precision FFT with applications in MRI',year:'2026 · version 2',url:'https://arxiv.org/abs/2512.04317v2',note:'Version 2, 17 February 2026; the arXiv record reports ICASSP 2026 acceptance. Mantissa precision, block scaling, and quantized twiddles. Cited as research context.'},
  {id:'scipy-length',authors:'SciPy',title:'scipy.fft.next_fast_len',year:'Documentation',url:'https://docs.scipy.org/doc/scipy/reference/generated/scipy.fft.next_fast_len.html',note:'Selecting favorable internal FFT lengths. Padding comparisons in this atlas preserve the same linear convolution and crop to the same output support.'}
];

export const defenseQuestions:{question:string;answer:string;chapter:string}[] = [
  {chapter:'roots',question:'Is the DFT an approximation to a continuous Fourier transform?',answer:'The DFT is an exact linear map on a finite vector. Interpreting its output as an approximation to continuous coefficients requires a sampling model, normalization, and regularity or band-limitation assumptions. The aliasing formula describes exactly how continuous modes combine under periodic sampling.'},
  {chapter:'roots',question:'Why does a condition number of one not guarantee accurate tiny coefficients?',answer:String.raw`Conditioning in the Euclidean norm controls the vector as a whole. A coefficient with \(|X_k|\ll\|X\|_2\) can have a large relative sensitivity or even a mathematically zero denominator. Normwise stability and componentwise relative accuracy are different properties.`},
  {chapter:'roots',question:'Where does the forward sign convention matter?',answer:String.raw`With \(\omega_N=e^{-2\pi i/N}\), the positive-frequency input \(e^{2\pi i qn/N}\) lands in bin \(q\bmod N\). Changing the forward sign exchanges frequency orientation. Either convention works if inverse, twiddles, and frequency labels are changed consistently.`},
  {chapter:'factor',question:'Why are coprime factors unnecessary?',answer:String.raw`The proof uses the bijections \(n=a+N_1b\), \(k=c+N_2d\) and \(\omega_N^{N_1}=\omega_{N_2}\). These hold for every product \(N=N_1N_2\). The coupling term \(\omega_N^{ac}\) remains as a twiddle. No Chinese-remainder theorem is used.`},
  {chapter:'factor',question:'Does the FFT require a power-of-two length?',answer:'Recursive radix-2 does. Cooley–Tukey handles other composite lengths. General-purpose libraries combine mixed-radix factorizations with additional algorithms for prime factors. The radix-2 recurrence should not be used as a proof for arbitrary unsupported lengths.'},
  {chapter:'factor',question:'What is the actual source of the speedup?',answer:'The inner short transforms are independent of one output index and can be reused. Merely rewriting a double sum without caching those shared results does not produce the algorithmic speedup.'},
  {chapter:'butterfly',question:'Why does bit reversal appear?',answer:'A recursive DIT split reads the least significant input bit first, then the next bit. Reversing the input-index bits places those recursive leaves next to the partners that a bottom-up iterative algorithm combines. Other FFT organizations handle permutations differently.'},
  {chapter:'butterfly',question:'Is one butterfly one arithmetic operation?',answer:'It is one unit of the computation graph. The standard formula contains one complex product and two complex additions, before special-twiddle simplifications. Comparing real instruction counts requires a further implementation-specific model.'},
  {chapter:'butterfly',question:'Does the animation show the speed of the FFT?',answer:'No. It deliberately slows and records the computation to make dependencies visible. The numerical trace and animation overhead belong to the visualization; benchmark timings are measured separately.'},
  {chapter:'aliasing',question:'Can higher precision eliminate aliasing?',answer:'No. Identical sample vectors remain identical inputs, regardless of arithmetic precision. Distinguishing their continuous origins requires extra samples or prior information about the signal class.'},
  {chapter:'aliasing',question:'Does zero padding improve frequency resolution?',answer:'It samples the finite record’s transform on a denser frequency grid, which can improve interpolation of its plotted spectrum. It does not lengthen the observation or add information. Distinguishing nearby physical tones is still limited by the original window and signal model.'},
  {chapter:'evidence',question:'Why is FFT followed by IFFT not sufficient validation?',answer:'The two routines can share a wrong convention or mutually cancelling errors. Round trips are useful alongside exact test signals, independent direct references, Parseval, and checks of individual butterfly stages.'},
  {chapter:'evidence',question:String.raw`What assumptions hide inside \(O(u\log N)\)?`,answer:'A controlled local stage error, sufficiently accurate twiddle factors, a specified norm, and exclusion of overflow and significant underflow. A rigorous constant must come from the actual arithmetic implementation. The atlas proves a conditional theorem and reports observations separately.'},
  {chapter:'evidence',question:'Why can a longer padded transform be faster?',answer:'Its prime factorization may permit more efficient kernels and memory access in the selected library. To compare fairly, every padding length must compute the same linear convolution after cropping. An individual measurement is not a universal ordering of lengths.'},
  {chapter:'evidence',question:'Why compare to the stored input rather than the ideal real-valued formula?',answer:'The ideal input may already have changed when represented in single or double precision. A high-precision direct DFT of the stored values isolates arithmetic error in the transform. A reference to ideal values mixes input representation and algorithmic errors unless that is explicitly intended.'},
  {chapter:'poisson',question:'Why is the zero mode a solvability condition?',answer:'Periodic derivatives integrate to zero and the Laplacian annihilates constants. The source must have zero mean. Fixing the solution’s mean removes nonuniqueness; it cannot repair an incompatible source.'},
  {chapter:'poisson',question:'What does subtracting the source mean change?',answer:'It replaces the right-hand side with its orthogonal projection onto the mean-zero subspace. The new problem is compatible, but its solution does not solve the original equation when the original mean was nonzero.'},
  {chapter:'poisson',question:'Why does a small residual not establish PDE accuracy?',answer:'It says the chosen discrete system has been solved accurately. That system may still differ from the continuous PDE. A manufactured solution or a justified refinement study is needed to assess discretization error.'},
  {chapter:'poisson',question:'Does a trigonometric manufactured solution prove spectral convergence?',answer:'It checks modes that are already exactly represented on a sufficiently fine grid. General convergence requires regularity and control of truncation and aliasing. The infinite-spectrum analytic example is a more informative refinement experiment, while still not replacing a theorem.'},
  {chapter:'limits',question:'Does the entropy bound prove every FFT algorithm is optimal?',answer:'It proves a lower bound for exact unitary two-coordinate gates on a fixed number of registers without auxiliary storage. The normalized FFT matches the asymptotic order in that model. Different gates, approximation criteria, or resources require a new argument.'},
  {chapter:'limits',question:'Can hardware still improve a quasilinear algorithm?',answer:'Yes. Arithmetic order does not determine cache behavior, vectorization, memory transfers, planning overhead, or parallel execution. Those mechanisms can substantially change elapsed time without changing the asymptotic operation count.'}
];
