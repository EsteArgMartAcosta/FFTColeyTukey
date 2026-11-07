/** Shared mathematical source for the chapter text and proof explorer.
 * Forward DFT: negative exponent; inverse: 1/N. All claims state their model.
 */
export type ProofEntry = {
  id: string;
  title: string;
  chapter: string;
  summary: string;
  statement: string;
  body: string;
  refs: string[];
};

export const proofEntries: ProofEntry[] = [
  {
    id: 'orthogonality', title: 'Roots of unity and discrete orthogonality', chapter: 'roots',
    summary: 'A geometric sum turns rotational symmetry into an orthogonal basis.',
    statement: String.raw`For \(N\geq1\), \(q\in\mathbb Z\), and \(\omega_N=e^{-2\pi i/N}\),
      \[\sum_{n=0}^{N-1}\omega_N^{qn}=N\,\mathbf 1_{N\mid q}.\]`,
    body: String.raw`
      <h4>1. State the objects precisely</h4>
      <p>The number \(\omega_N\) is a primitive \(N\)-th root of unity: \(\omega_N^N=1\), and \(\omega_N^q=1\) if and only if \(N\mid q\). Indices of a finite sequence are always \(0,\ldots,N-1\). No primality assumption is made.</p>
      <h4>2. Prove the cancellation</h4>
      <p>If \(N\mid q\), every summand is one, and the sum is \(N\). Otherwise put \(r=\omega_N^q\), so \(r\neq1\) and \(r^N=1\). Multiplying the finite sum by \(1-r\) telescopes:</p>
      \[(1-r)(1+r+\cdots+r^{N-1})=1-r^N=0.\]
      <p>Division by the nonzero number \(1-r\) proves that the sum is zero. This also covers repeated visits to roots when \(\gcd(q,N)>1\).</p>
      <h4>3. Interpret this as orthogonality</h4>
      <p>For \(v_k=(\omega_N^{nk})_{n=0}^{N-1}\), use the Hermitian inner product \(\langle a,b\rangle=\sum_n\overline{a_n}b_n\):</p>
      \[\langle v_j,v_k\rangle=\sum_{n=0}^{N-1}\omega_N^{n(k-j)}=N\delta_{jk},\qquad 0\leq j,k\lt N.\]
      <p>Consequently \(N^{-1/2}v_0,\ldots,N^{-1/2}v_{N-1}\) is an orthonormal basis of \(\mathbb C^N\). Orthogonality implies linear independence, and there are exactly \(N\) vectors.</p>
      <h4>4. A small exact example</h4>
      \[N=4:\quad \omega_4=-i,\qquad 1+(-i)+(-1)+i=0.\]
      \[q=2:\quad 1+(-1)+1+(-1)=0.\]
      <p><strong>Intuition.</strong> The arrows cancel by symmetry. <strong>Numerical distinction.</strong> A displayed sum near machine precision is an approximation to the exact value zero; it is not a weakened version of the theorem.</p>`,
    refs: ['cooley-tukey','fftw-definition']
  },
  {
    id: 'inverse-parseval', title: 'The inverse, Parseval, and unitary normalization', chapter: 'roots',
    summary: 'One matrix identity yields reconstruction, energy conservation, and an orthonormal coordinate change.',
    statement: String.raw`Let \(F_N=(\omega_N^{kn})_{k,n=0}^{N-1}\). Then
      \[F_N^*F_N=NI,\qquad F_N^{-1}=N^{-1}F_N^*,\qquad \|F_Nx\|_2^2=N\|x\|_2^2.\]`,
    body: String.raw`
      <h4>1. Compute one entry, rather than multiplying symbolically</h4>
      \[(F_N^*F_N)_{j,k}=\sum_{n=0}^{N-1}\overline{\omega_N^{nj}}\omega_N^{nk}=\sum_{n=0}^{N-1}\omega_N^{n(k-j)}=N\delta_{jk}.\]
      <p>The last equality is discrete orthogonality. Since \(F_N\) is square, this identity shows that it is invertible and identifies its inverse.</p>
      <h4>2. Recover every input coordinate</h4>
      <p>For \(X=F_Nx\), multiply by \(F_N^*/N\):</p>
      \[x_n=\frac1N\sum_{k=0}^{N-1}X_k\overline{\omega_N^{nk}}=\frac1N\sum_{k=0}^{N-1}X_ke^{2\pi i nk/N}.\]
      <p>The opposite sign and the factor \(1/N\) belong together. A forward transform followed by an unscaled positive-sign transform gives \(Nx\), not \(x\).</p>
      <h4>3. Derive Parseval and its bilinear form</h4>
      \[\langle F_Nx,F_Ny\rangle=x^*F_N^*F_Ny=N\langle x,y\rangle.\]
      \[\sum_{k=0}^{N-1}|X_k|^2=N\sum_{n=0}^{N-1}|x_n|^2.\]
      <p>Taking \(y=x\) gives the energy identity. Defining \(U_N=N^{-1/2}F_N\) removes the scale:</p>
      \[U_N^*U_N=I,\qquad U_N^{-1}=U_N^*,\qquad \|U_Nx\|_2=\|x\|_2.\]
      <h4>4. Separate convention from meaning</h4>
      <p>For a sampled Fourier series, the coefficients are often \(X_k/N\); for an orthonormal coordinate change they are \(X_k/\sqrt N\). Neither convention changes which frequencies are present. In two dimensions, the inverse on an \(N\times N\) grid contains \(1/N^2\), one factor for each axis.</p>
      \[X_{k,\ell}=\sum_{j,r=0}^{N-1}x_{j,r}\omega_N^{jk+r\ell},\qquad \|X\|_F^2=N^2\|x\|_F^2.\]`,
    refs: ['fftw-definition']
  },
  {
    id: 'polynomial-view', title: 'The DFT as simultaneous polynomial evaluation', chapter: 'roots',
    summary: 'Evaluating at roots of unity reveals the reuse that a dense matrix view can hide.',
    statement: String.raw`For \(p(z)=\sum_{n=0}^{N-1}x_nz^n\), the DFT satisfies
      \[X_k=p(\omega_N^k),\qquad p(z)=p_{\rm even}(z^2)+zp_{\rm odd}(z^2).\]`,
    body: String.raw`
      <h4>1. Identify the evaluation problem</h4>
      <p>Substituting \(z=\omega_N^k\) into the polynomial gives exactly the DFT definition. The \(N\) evaluation points are distinct. A polynomial of degree less than \(N\) that vanishes at all of them must be zero, giving another argument for invertibility.</p>
      \[p(\omega_N^k)=\sum_{n=0}^{N-1}x_n(\omega_N^k)^n=X_k.\]
      <h4>2. Split by parity</h4>
      <p>When \(N\) is even, define</p>
      \[p_{\rm even}(w)=\sum_{j=0}^{N/2-1}x_{2j}w^j,\qquad p_{\rm odd}(w)=\sum_{j=0}^{N/2-1}x_{2j+1}w^j.\]
      <p>The even and odd powers reconstruct \(p\) exactly. Evaluations at opposite points share the same square:</p>
      \[p(z)=p_{\rm even}(z^2)+zp_{\rm odd}(z^2),\]
      \[p(-z)=p_{\rm even}(z^2)-zp_{\rm odd}(z^2).\]
      <h4>3. Count distinct smaller evaluation points</h4>
      \[(\omega_N^k)^2=\omega_{N/2}^k,\qquad \omega_N^{k+N/2}=-\omega_N^k.\]
      <p>Thus \(N\) roots become only \(N/2\) distinct squares. Each evaluation of the smaller polynomials serves two outputs. Repeating this reduction when \(N=2^m\) gives the recursive FFT.</p>
      <h4>4. Understand the computational claim</h4>
      <p>Evaluating each polynomial independently by Horner's rule still costs quadratic work over all points. The gain comes from the special evaluation set and reuse across outputs. No input samples are discarded, no coefficient is compressed, and no approximation has been introduced.</p>`,
    refs: ['cooley-tukey']
  },
  {
    id: 'cooley-tukey', title: 'The complete mixed-radix Cooley–Tukey factorization', chapter: 'factor',
    summary: 'Track both index bijections, every exponential factor, and the output permutation.',
    statement: String.raw`For \(N=N_1N_2\), \(0\leq a,d\lt N_1\), and \(0\leq b,c\lt N_2\),
      \[X_{c+N_2d}=\sum_{a=0}^{N_1-1}\omega_{N_1}^{ad}\omega_N^{ac}\sum_{b=0}^{N_2-1}x_{a+N_1b}\omega_{N_2}^{bc}.\]`,
    body: String.raw`
      <h4>1. Establish two different index bijections</h4>
      \[n=a+N_1b,\quad a=n\bmod N_1,\quad b=\lfloor n/N_1\rfloor,\]
      \[k=c+N_2d,\quad c=k\bmod N_2,\quad d=\lfloor k/N_2\rfloor.\]
      <p>Euclidean division proves that these representations are unique over the stated ranges. Notice that input and output use different strides. Confusing them permutes the answer.</p>
      <h4>2. Expand the exponent before rearranging anything</h4>
      \[nk=(a+N_1b)(c+N_2d)=ac+aN_2d+N_1bc+Nbd.\]
      \[\omega_N^{Nbd}=1,\qquad \omega_N^{N_2}=\omega_{N_1},\qquad \omega_N^{N_1}=\omega_{N_2}.\]
      <p>Therefore the kernel separates into three nontrivial factors:</p>
      \[\omega_N^{nk}=\omega_N^{ac}\omega_{N_1}^{ad}\omega_{N_2}^{bc}.\]
      <h4>3. Substitute and reuse the inner sums</h4>
      \[X_{c+N_2d}=\sum_{a=0}^{N_1-1}\sum_{b=0}^{N_2-1}x_{a+N_1b}\omega_N^{ac}\omega_{N_1}^{ad}\omega_{N_2}^{bc}.\]
      \[A_{a,c}=\sum_{b=0}^{N_2-1}x_{a+N_1b}\omega_{N_2}^{bc},\qquad B_{a,c}=\omega_N^{ac}A_{a,c}.\]
      \[C_{d,c}=\sum_{a=0}^{N_1-1}B_{a,c}\omega_{N_1}^{ad},\qquad X_{c+N_2d}=C_{d,c}.\]
      <p>The first pass computes \(N_1\) transforms of length \(N_2\); the diagonal twiddle pass couples the scales; the second pass computes \(N_2\) transforms of length \(N_1\). The final line is an explicit output-index map.</p>
      <h4>4. Read the matrix factorization without hiding permutations</h4>
      <p>Define the reordered input \(z_{aN_2+b}=x_{a+N_1b}\), so \(z=Px\). Store intermediate arrays with \(a\) first and \(c\) second. Let \(D_{aN_2+c,aN_2+c}=\omega_N^{ac}\). Then</p>
      \[F_N=(F_{N_1}\otimes I_{N_2})\,D\,(I_{N_1}\otimes F_{N_2})\,P.\]
      <p>The output coordinate of this product is \(dN_2+c=k\), so no additional output permutation is hidden in this particular convention.</p>
      <h4>5. Work through the nonsquare case</h4>
      <p>For \(12=3\cdot4\), the first pass transforms</p>
      \[(x_0,x_3,x_6,x_9),\quad(x_1,x_4,x_7,x_{10}),\quad(x_2,x_5,x_8,x_{11}).\]
      <p>For each \(c=0,1,2,3\), multiply the three outputs by \(1,\omega_{12}^c,\omega_{12}^{2c}\), then apply a length-three DFT. Its outputs occupy \(c,c+4,c+8\).</p>
      <p><strong>Scope.</strong> Coprimality was never used: \(16=4\cdot4\) is equally valid. Coprime-factor algorithms using a Chinese-remainder reindexing are different factorizations. A single split saves reuse; an asymptotic bound also requires control of the smaller transforms.</p>`,
    refs: ['cooley-tukey']
  },
  {
    id: 'radix-two', title: 'Radix-2 butterflies and sparse matrix factors', chapter: 'factor',
    summary: 'The second output is not an extra transform: it is a change of sign.',
    statement: String.raw`For even \(N\) and \(0\leq k\lt N/2\),
      \[X_k=E_k+\omega_N^kO_k,\qquad X_{k+N/2}=E_k-\omega_N^kO_k.\]`,
    body: String.raw`
      <h4>1. Define the two smaller transforms</h4>
      \[E_k=\sum_{j=0}^{N/2-1}x_{2j}\omega_{N/2}^{jk},\qquad O_k=\sum_{j=0}^{N/2-1}x_{2j+1}\omega_{N/2}^{jk}.\]
      <p>Separating even and odd indices in the original sum and using \(\omega_N^2=\omega_{N/2}\) gives</p>
      \[X_k=\sum_jx_{2j}\omega_N^{2jk}+\omega_N^k\sum_jx_{2j+1}\omega_N^{2jk}=E_k+\omega_N^kO_k.\]
      <h4>2. Derive the second half explicitly</h4>
      \[E_{k+N/2}=E_k,\quad O_{k+N/2}=O_k,\quad \omega_N^{k+N/2}=-\omega_N^k.\]
      <p>The first two identities are periodicity of the smaller DFT. The third follows from \(e^{-\pi i}=-1\). Substitution gives the second output. Compute \(t=\omega_N^kO_k\) once and form \(E_k+t\) and \(E_k-t\).</p>
      <h4>3. Identify the local linear map</h4>
      \[\begin{bmatrix}a\!+\!wb\\a\!-\!wb\end{bmatrix}=B(w)\begin{bmatrix}a\\b\end{bmatrix},\qquad B(w)=\begin{bmatrix}1&w\\1&-w\end{bmatrix}.\]
      \[|w|=1\quad\Longrightarrow\quad B(w)^*B(w)=2I.\]
      <p>Thus \(B(w)/\sqrt2\) is unitary. This fact connects the algebraic factorization to the normwise stability proof.</p>
      <h4>4. Assemble one complete recursion level</h4>
      <p>Let \(P_{\rm eo}\) send \(x\) to its even entries followed by its odd entries, and \(D=\operatorname{diag}(1,\omega_N,\ldots,\omega_N^{N/2-1})\). Then</p>
      \[F_N=\begin{bmatrix}I&D\\I&-D\end{bmatrix}(F_{N/2}\oplus F_{N/2})P_{\rm eo}.\]
      <p>For \(N=2^m\), recurse to length one. The product of the \(m\) stage normalizations is \(2^{-m/2}=N^{-1/2}\), giving a factorization of \(U_N\) into unitary stages and a permutation.</p>
      <h4>5. Verify a length-four transform by hand</h4>
      \[E_0=x_0+x_2,\ E_1=x_0-x_2,\quad O_0=x_1+x_3,\ O_1=x_1-x_3.\]
      \[X_0=E_0+O_0,\ X_2=E_0-O_0,\quad X_1=E_1-iO_1,\ X_3=E_1+iO_1.\]
      <p>This worked case checks the sign of the twiddle, the placement of the outputs, and the absence of forward normalization.</p>`,
    refs: ['cooley-tukey']
  },
  {
    id: 'bit-reversal', title: 'Why iterative DIT starts with bit reversal', chapter: 'butterfly',
    summary: 'A permutation converts the recursive leaf order into contiguous bottom-up subproblems.',
    statement: String.raw`For \(N=2^m\), reverse the \(m\) input-index bits, then apply butterfly stages of length \(2,4,\ldots,N\). The final array equals \(F_Nx\) in natural frequency order.`,
    body: String.raw`
      <h4>1. Follow which bit each recursion level tests</h4>
      \[n=\sum_{r=0}^{m-1}b_r2^r,\qquad b_r\in\{0,1\}.\]
      <p>The first even/odd split tests \(b_0\). Within either subsequence the next split tests \(b_1\), then \(b_2\), until \(b_{m-1}\). Visiting the even branch first orders the leaves lexicographically by \(b_0,b_1,\ldots,b_{m-1}\).</p>
      \[\operatorname{rev}_m(n)=\sum_{r=0}^{m-1}b_r2^{m-1-r},\qquad \operatorname{rev}_m(\operatorname{rev}_m(n))=n.\]
      <h4>2. Recognize the smallest subproblems</h4>
      \[N=8:\qquad (0,1,2,3,4,5,6,7)\mapsto(0,4,2,6,1,5,3,7).\]
      <p>The first length-two transforms act on \((x_0,x_4)\), \((x_2,x_6)\), \((x_1,x_5)\), and \((x_3,x_7)\). They are precisely the deepest nontrivial calls of the recursive algorithm.</p>
      <h4>3. State and prove the induction invariant</h4>
      <p>After stage \(s\), each contiguous block of length \(2^s\) contains, in natural output order, the DFT of the corresponding recursive subproblem. The claim holds for stage zero because each length-one DFT is the identity. At stage \(s+1\), two adjacent blocks hold the even and odd child transforms of their parent. The radix-2 identities combine them into that parent's DFT, proving the induction step.</p>
      <p>At stage \(m\), the sole block is the original length-\(N\) problem. Therefore its output is the full DFT in natural frequency order.</p>
      <h4>4. Write the executable indexing rule</h4>
      <p>For \(L=2^s\), block start \(p\in\{0,L,2L,\ldots,N-L\}\), and \(0\leq j\lt L/2\):</p>
      \[a=v_{p+j},\quad b=v_{p+j+L/2},\quad t=\omega_L^j b,\]
      \[v_{p+j}\leftarrow a+t,\qquad v_{p+j+L/2}\leftarrow a-t.\]
      <p>Read both original inputs before either write. Reusing an overwritten input is a common implementation error.</p>
      <p><strong>Boundary.</strong> Explicit bit reversal belongs to this iterative DIT arrangement. DIF and Stockham variants place or absorb permutations differently. The one-level even/odd permutation is not the full bit-reversal permutation.</p>`,
    refs: ['cooley-tukey','fftw3']
  },
  {
    id: 'operation-count', title: 'Exact operation counts, recurrence, and memory', chapter: 'butterfly',
    summary: 'Specify what is counted before comparing quadratic and quasilinear work.',
    statement: String.raw`For \(N=2^m\), the standard radix-2 network has
      \[B(N)=\frac N2\log_2N,\quad M(N)=\frac N2\log_2N,\quad A(N)=N\log_2N.\]
      Here \(M\) counts complex products and \(A\) complex additions, before simplifying special twiddles.`,
    body: String.raw`
      <h4>1. Count the direct formula</h4>
      <p>There are \(N\) output sums, each containing \(N\) products and \(N-1\) additions:</p>
      \[M_{\rm DFT}=N^2,\qquad A_{\rm DFT}=N(N-1).\]
      <p>These are literal complex-operation counts with the roots already available. Computing exponentials, exploiting trivial factors, and reusing a precomputed dense matrix lead to different implementation costs.</p>
      <h4>2. Count one FFT stage and the number of stages</h4>
      <p>A stage partitions the \(N\) entries into \(N/2\) disjoint butterflies. Each butterfly calculates one product \(t=wb\) and two additions \(a\pm t\). Block length doubles at each stage, so there are \(m=\log_2N\) stages.</p>
      \[B_s=N/2,\qquad \sum_{s=1}^mB_s=Nm/2.\]
      <h4>3. Solve the recurrence directly</h4>
      \[T(N)=2T(N/2)+cN,\qquad T(1)=c_0.\]
      \[\frac{T(N)}N=\frac{T(N/2)}{N/2}+c=c_0+c\log_2N.\]
      <p>For this model, \(T(N)=\Theta(N\log N)\). Bounded-radix recursions yield the analogous estimate. An isolated factorization \(N=N_1N_2\) does not by itself establish that rate for every family of integers.</p>
      <h4>4. Distinguish depth, work, and storage</h4>
      <p>The dependency depth is \(m\); sequential work includes every butterfly. Each stage contains parallel operations but real parallel speed depends on synchronization and memory. Storing one evolving array uses \(O(N)\) total storage; storing every stage for this educational trace uses \(O(N\log N)\). A dense DFT matrix requires \(O(N^2)\) storage, although a direct summation can generate its entries on demand.</p>
      <h4>5. A concrete scale</h4>
      \[N=1024:\quad M_{\rm DFT}=1{,}048{,}576,\quad M_{\rm FFT}=5120,\quad A_{\rm FFT}=10{,}240.\]
      <p>The product-count ratio is \(204.8\). It is not a measured speedup: wall-clock time also includes memory access, instructions, compilation, planning, and overhead.</p>`,
    refs: ['cooley-tukey','fftw3']
  },
  {
    id: 'conditioning', title: 'Perfect normwise conditioning is not componentwise accuracy', chapter: 'evidence',
    summary: 'The DFT preserves relative Euclidean perturbations, while an individual nearly zero coefficient can be fragile.',
    statement: String.raw`For \(x\neq0\), \(X=F_Nx\), and \(\delta X=F_N\delta x\),
      \[\frac{\|\delta X\|_2}{\|X\|_2}=\frac{\|\delta x\|_2}{\|x\|_2},\qquad \kappa_2(F_N)=1.\]`,
    body: String.raw`
      <h4>1. Compute the singular values</h4>
      <p>The eigenvalues of \(F_N^*F_N=NI\) are all \(N\). Therefore every singular value is \(\sqrt N\), and</p>
      \[\|F_N\|_2=\sqrt N,\qquad \|F_N^{-1}\|_2=N^{-1/2},\qquad \kappa_2(F_N)=1.\]
      <h4>2. Obtain an equality for perturbations</h4>
      \[\|\delta X\|_2=\sqrt N\|\delta x\|_2,\qquad \|X\|_2=\sqrt N\|x\|_2.\]
      <p>Dividing proves the statement. This concerns the exact map on perturbed data. It does not yet say how accurately a particular program evaluates the map.</p>
      <h4>3. Examine a single output coefficient</h4>
      <p>Cauchy–Schwarz gives</p>
      \[|\delta X_k|\leq\sqrt N\|\delta x\|_2.\]
      <p>If \(X_k\neq0\), its normwise-input relative sensitivity is</p>
      \[\kappa_k(x)=\frac{\sqrt N\|x\|_2}{|X_k|}.\]
      <p>This becomes large when cancellation makes \(X_k\) small. At \(X_k=0\), relative error in that coefficient is undefined; absolute error or a global norm is the meaningful quantity.</p>
      <h4>4. Separate the errors in an experiment</h4>
      <p>Let \(x^{\rm ideal}\) be the intended mathematical data, \(x\) their stored representation, and \(\widetilde X\) the computed result:</p>
      \[\widetilde X-F_Nx^{\rm ideal}=(\widetilde X-F_Nx)+F_N(x-x^{\rm ideal}).\]
      <p>The first term is algorithmic error, the second input-representation error. A high-precision DFT evaluated on the exactly represented stored input isolates the first term. Comparing against a reference built from a different input can mix the two.</p>
      <p><strong>Experimental interpretation.</strong> Round-trip checks, Parseval checks, and direct comparisons answer different questions. Two wrong conventions may cancel in a round trip; a unitary but wrong permutation may preserve energy.</p>`,
    refs: ['higham','fftw-accuracy']
  },
  {
    id: 'stability', title: 'A complete conditional forward and backward stability argument', chapter: 'evidence',
    summary: 'Local normwise stage errors accumulate with the number of stages, provided twiddles and arithmetic are controlled.',
    statement: String.raw`Suppose \(U_N=Q_m\cdots Q_1P\), each \(Q_s\) is unitary, and
      \[\|\operatorname{fl}(Q_sv)-Q_sv\|_2\leq\eta\|v\|_2.\]
      Then \(\|\widetilde y-U_Nx\|_2\leq((1+\eta)^m-1)\|x\|_2\).`,
    body: String.raw`
      <h4>1. State the computational assumptions</h4>
      <p>The permutation \(P\) only copies exactly represented data. The same local bound applies to every computed intermediate vector. It includes errors in the stored twiddles and complex arithmetic. Overflow and significant underflow are excluded. This is a conditional normwise theorem, not a browser-specific certified constant.</p>
      <h4>2. Write exact and computed recurrences</h4>
      \[v_0=\widetilde v_0=Px,\quad v_s=Q_sv_{s-1},\quad \widetilde v_s=Q_s\widetilde v_{s-1}+e_s,\]
      \[\|e_s\|_2\leq\eta\|\widetilde v_{s-1}\|_2.\]
      <p>Unitarity gives \(\|v_s\|_2=\|x\|_2\). The triangle inequality gives a bound for the computed intermediates:</p>
      \[\|\widetilde v_s\|_2\leq(1+\eta)\|\widetilde v_{s-1}\|_2\leq(1+\eta)^s\|x\|_2.\]
      <h4>3. Unroll the global error</h4>
      \[\widetilde v_m-v_m=\sum_{s=1}^mQ_m\cdots Q_{s+1}e_s.\]
      <p>The empty product for \(s=m\) is the identity. Each remaining product is unitary, so it does not amplify the Euclidean norm:</p>
      \[\|\widetilde v_m-v_m\|_2\leq\sum_{s=1}^m\|e_s\|_2\leq\eta\sum_{s=1}^m(1+\eta)^{s-1}\|x\|_2.\]
      \[\frac{\|\widetilde y-U_Nx\|_2}{\|U_Nx\|_2}\leq(1+\eta)^m-1.\]
      <h4>4. Relate the bound to unit roundoff</h4>
      <p>If a separate local analysis establishes \(\eta\leq\gamma_c=cu/(1-cu)\), and \(cmu\lt 1\), Bernoulli's inequality gives</p>
      \[(1+\eta)^m-1\leq(1-cu)^{-m}-1\leq(1-cmu)^{-1}-1=\gamma_{cm}.\]
      <p>For \(cmu\ll1\), this is \(O(u\log N)\) because \(m=\log_2N\). The constant \(c\) depends on the implementation. Repeated multiplication of approximate twiddles can introduce additional drift, so accurate butterflies alone do not establish the local hypothesis.</p>
      <h4>5. Convert forward error into backward error</h4>
      \[\delta x=U_N^*(\widetilde y-U_Nx),\qquad \widetilde y=U_N(x+\delta x).\]
      \[\frac{\|\delta x\|_2}{\|x\|_2}=\frac{\|\widetilde y-U_Nx\|_2}{\|U_Nx\|_2}.\]
      <p>Thus the same relative normwise bound has a backward interpretation. For the unnormalized transform, take \(\delta x=F_N^{-1}(\widetilde X-F_Nx)\); the factors \(\sqrt N\) cancel in the relative norms. Implementation-specific scaling errors still belong in the arithmetic analysis.</p>
      <p><strong>What this does not prove.</strong> It does not promise relative accuracy of every coefficient, certify a particular trigonometric library, or make empirical error curves into worst-case bounds.</p>`,
    refs: ['higham','fftw-accuracy','fftw-twiddles']
  },
  {
    id: 'aliasing', title: 'The sampling identity and the exact aliasing formula', chapter: 'aliasing',
    summary: 'Sampling identifies frequency classes before an FFT algorithm is ever chosen.',
    statement: String.raw`On \(t_n=2\pi n/N\), integer frequencies satisfy \(e^{i(k+qN)t_n}=e^{ikt_n}\). If \(\sum_j|\widehat f_j|\lt \infty\), then
      \[\widetilde f_k:=\frac1N\sum_{n=0}^{N-1}f(t_n)e^{-ikt_n}=\sum_{q\in\mathbb Z}\widehat f_{k+qN}.\]`,
    body: String.raw`
      <h4>1. Prove indistinguishability point by point</h4>
      \[e^{i(k+qN)t_n}=e^{ikt_n}e^{2\pi iqn}=e^{ikt_n},\qquad k,q,n\in\mathbb Z.\]
      <p>Two continuous waves can therefore produce exactly the same sampled vector. More arithmetic precision cannot distinguish identical inputs.</p>
      <h4>2. State enough regularity for the coefficient calculation</h4>
      <p>Assume \(f(t)=\sum_{j\in\mathbb Z}\widehat f_je^{ijt}\) with absolutely summable coefficients. The series converges absolutely at the sample points, allowing the finite sample sum to be interchanged with the series:</p>
      \[\widetilde f_k=\sum_{j\in\mathbb Z}\widehat f_j\left(\frac1N\sum_{n=0}^{N-1}e^{i(j-k)t_n}\right).\]
      <p>Discrete orthogonality makes the inner term one for \(j-k\in N\mathbb Z\), and zero otherwise. Precisely the modes \(j=k+qN\) remain.</p>
      <h4>3. Explain the Nyquist representatives</h4>
      <p>For even \(N\), one convenient set is \(K_N=\{-N/2,\ldots,N/2-1\}\). The frequencies \(N/2\) and \(-N/2\) generate the same sequence:</p>
      \[e^{i\pi n}=e^{-i\pi n}=(-1)^n.\]
      <p>There is one Nyquist degree of freedom, not two independent signs. For real data,</p>
      \[X_{(-k)\bmod N}=\overline{X_k}.\]
      <p>This follows by conjugating the DFT sum and using that the samples are real.</p>
      <h4>4. Say when exact reconstruction is possible</h4>
      <p>If the continuous signal is a trigonometric polynomial whose frequencies lie in a chosen set of \(N\) representatives, sampling is injective on that space and the normalized DFT recovers those coefficients. Without such prior restrictions, infinitely many functions agree on the same sample points.</p>
      <p><strong>Distinction.</strong> Aliasing is non-identifiability under sampling. Leakage concerns a finite observation window and non-bin-centered frequencies. They can coexist but are not the same phenomenon.</p>`,
    refs: ['trefethen','fftw-definition']
  },
  {
    id: 'leakage', title: 'Finite windows, leakage, and what zero padding actually changes', chapter: 'aliasing',
    summary: 'A noninteger number of cycles produces a geometric sum rather than a single occupied DFT bin.',
    statement: String.raw`For \(x_n=e^{2\pi i\alpha n/N}\), define \(\delta=\alpha-k\). If \(\delta\notin N\mathbb Z\),
      \[X_k=e^{\pi i(N-1)\delta/N}\frac{\sin(\pi\delta)}{\sin(\pi\delta/N)}.\]`,
    body: String.raw`
      <h4>1. Evaluate the finite-window transform</h4>
      \[X_k=\sum_{n=0}^{N-1}e^{2\pi i(\alpha-k)n/N}=\frac{1-e^{2\pi i\delta}}{1-e^{2\pi i\delta/N}}.\]
      <p>Use \(1-e^{i\theta}=-2ie^{i\theta/2}\sin(\theta/2)\) in numerator and denominator. Their phase ratio produces the displayed formula. At \(\delta\in N\mathbb Z\), the original sum is \(N\); use this limiting value rather than dividing by zero.</p>
      <h4>2. Compare integer and noninteger frequencies</h4>
      <p>If \(\alpha\) is an integer, every bin except its residue modulo \(N\) vanishes by orthogonality. If \(\alpha\) is noninteger, generally many bins are nonzero. The DFT is accurately describing the finite vector; leakage is not evidence of an inaccurate FFT.</p>
      \[\alpha\in\mathbb Z:\quad X_k=N\,\mathbf1_{k\equiv\alpha\pmod N}.\]
      <h4>3. Interpret a window as a multiplication</h4>
      <p>For weights \(w_n\), replace the observations by \(w_nx_n\). Their continuous-frequency transform is</p>
      \[\mathcal X_w(\theta)=\sum_{n=0}^{N-1}w_nx_ne^{-in\theta}.\]
      <p>Tapering the endpoints changes the spectral response. Reducing sidelobes generally widens the main lobe: window choice expresses a resolution/leakage tradeoff, not free recovery of missing information.</p>
      <h4>4. Prove the zero-padding statement</h4>
      <p>Append zeros to make a length-\(L\) vector, \(L\geq N\). Its DFT is</p>
      \[Y_j=\sum_{n=0}^{N-1}x_ne^{-2\pi i nj/L}=\mathcal X(2\pi j/L),\qquad \mathcal X(\theta)=\sum_{n=0}^{N-1}x_ne^{-in\theta}.\]
      <p>The same finite-data trigonometric polynomial is sampled on a denser frequency grid. The observation duration and original information are unchanged. A smoother-looking spectral plot is not, by itself, improved ability to separate two nearby physical frequencies.</p>`,
    refs: ['trefethen','fftw-definition']
  },
  {
    id: 'convolution', title: 'Circular convolution, polynomial multiplication, and safe padding', chapter: 'evidence',
    summary: 'Transform–multiply–invert computes linear convolution only when the circular wraparound is controlled.',
    statement: String.raw`For \((a*_Lb)_r=\sum_{n=0}^{L-1}a_nb_{(r-n)\bmod L}\),
      \[F_L(a*_Lb)=(F_La)\odot(F_Lb).\]
      Zero padding with \(L\geq n_a+n_b-1\) recovers the full linear convolution.`,
    body: String.raw`
      <h4>1. Prove the convolution theorem by reindexing</h4>
      \[\sum_{r=0}^{L-1}\sum_{n=0}^{L-1}a_nb_{(r-n)\bmod L}\omega_L^{kr}.\]
      <p>For each fixed \(n\), set \(s=(r-n)\bmod L\). This is a bijection over all residues, and \(\omega_L^{kr}=\omega_L^{k(s+n)}\), because adding a multiple of \(L\) does not change the root.</p>
      \[\widehat{a*_Lb}_k=\left(\sum_na_n\omega_L^{kn}\right)\left(\sum_sb_s\omega_L^{ks}\right)=\widehat a_k\widehat b_k.\]
      <p>Applying the inverse DFT proves the transform–multiply–invert algorithm.</p>
      <h4>2. Relate circular and linear outputs</h4>
      <p>Let \(a\) and \(b\) have finite supports \(0\leq n\lt n_a\) and \(0\leq n\lt n_b\), and let \(c=a*b\) be the ordinary linear convolution. Then</p>
      \[c_j=\sum_na_nb_{j-n},\qquad 0\leq j\leq n_a+n_b-2,\]
      \[(a*_Lb)_r=\sum_{q\in\mathbb Z}c_{r+qL}.\]
      <p>The circular result folds every linear coefficient into its residue class. If \(L\geq n_a+n_b-1\), no two nonzero coefficients overlap, so the first \(n_a+n_b-1\) outputs equal the linear result.</p>
      <h4>3. A visible wraparound example</h4>
      \[a=b=(1,1,1),\qquad a*b=(1,2,3,2,1).\]
      <p>A length-three circular convolution gives \((3,3,3)\), because coefficients at indices three and four wrap back. A length-five transform, or any longer sufficient padding, gives the linear convolution after cropping.</p>
      <h4>4. Connect the algebra to a fair benchmark</h4>
      <p>Compare different internal lengths only when all lengths are sufficient and all outputs are cropped to the same linear convolution. A larger transform length may run faster if its factorization suits the library. This is an implementation observation, not a contradiction of asymptotic complexity.</p>
      <p>The algorithm uses two forward FFTs, one pointwise product, and one inverse FFT. Its work is \(O(L\log L)\) for the relevant FFT size family. Planning, allocation, and repeated reuse of a transformed kernel should be documented separately.</p>`,
    refs: ['cooley-tukey','scipy-length']
  },
  {
    id: 'poisson-zero', title: 'Periodic Poisson: compatibility, existence, and uniqueness', chapter: 'poisson',
    summary: 'The zero Fourier mode is an equation of existence, not a numerical denominator to regularize away.',
    statement: String.raw`For smooth periodic \(f\) on \(\mathbb T^2=[0,2\pi)^2\), the problem
      \[-\Delta u=f,\qquad \int_{\mathbb T^2}u=0\]
      has a unique smooth periodic solution exactly when \(\int_{\mathbb T^2}f=0\).`,
    body: String.raw`
      <h4>1. Prove necessity by integration</h4>
      <p>The integral of each second derivative over a period is zero: periodic first derivatives agree at the endpoints. Therefore</p>
      \[\int_{\mathbb T^2}f=-\int_{\mathbb T^2}\Delta u=0.\]
      <h4>2. Diagonalize the differential operator</h4>
      \[u(x,y)=\sum_{k,\ell\in\mathbb Z}\widehat u_{k,\ell}e^{i(kx+\ell y)},\qquad -\Delta e^{i(kx+\ell y)}=(k^2+\ell^2)e^{i(kx+\ell y)}.\]
      \[(k^2+\ell^2)\widehat u_{k,\ell}=\widehat f_{k,\ell}.\]
      <p>For every nonzero pair, define the solution coefficient by division. Set the constant coefficient to zero:</p>
      \[\widehat u_{k,\ell}=\frac{\widehat f_{k,\ell}}{k^2+\ell^2}\ ((k,\ell)\neq(0,0)),\qquad \widehat u_{0,0}=0.\]
      <p>For smooth \(f\), its coefficients decay faster than every inverse power. The defined coefficients and their differentiated series therefore converge as needed, establishing a smooth solution. The same construction extends in Sobolev spaces: for zero-mean \(f\in H^s\), one obtains zero-mean \(u\in H^{s+2}\).</p>
      <h4>3. Prove uniqueness with energy</h4>
      <p>If \(u_1,u_2\) are two solutions, \(v=u_1-u_2\) satisfies \(-\Delta v=0\). Periodic integration by parts gives</p>
      \[0=\int_{\mathbb T^2}\overline v(-\Delta v)=\int_{\mathbb T^2}|\nabla v|^2.\]
      <p>Hence \(v\) is constant, and the zero-mean constraint forces \(v=0\).</p>
      <h4>4. Treat incompatibility honestly</h4>
      \[0\cdot\widehat u_{0,0}=\widehat f_{0,0}.\]
      <p>If the right side is nonzero, no periodic solution exists. Replacing the zero denominator by a small number does not solve this equation. Projecting \(f\) to \(f-\overline f\) is valid only if explicitly acknowledged as a changed right-hand side.</p>
      <h4>5. Distinguish continuous and sampled means</h4>
      <p>A continuously mean-zero smooth function may have nonzero sampled mean because unresolved Fourier modes alias into the constant bin. The grid solver checks its discrete compatibility condition. The laboratory displays the measured mean and whether a projection has been applied.</p>`,
    refs: ['trefethen','fftw-definition']
  },
  {
    id: 'poisson-symbols', title: 'Spectral and finite-difference Laplacians have different symbols', chapter: 'poisson',
    summary: 'The same FFT diagonalizes two distinct operators; the denominator determines which equation is solved.',
    statement: String.raw`On a periodic grid with \(h=2\pi/N\),
      \[\lambda_{\rm sp}(k,\ell)=k^2+\ell^2,\qquad \lambda_h(k,\ell)=\frac4{h^2}\left(\sin^2\frac{kh}{2}+\sin^2\frac{\ell h}{2}\right).\]`,
    body: String.raw`
      <h4>1. Fix the grid and the basis</h4>
      <p>Use \(x_j=jh\), \(y_r=rh\), with grid indices modulo \(N\). For even \(N\), use signed frequency representatives \(k,\ell\in\{-N/2,\ldots,N/2-1\}\). The sampled modes are</p>
      \[\varphi_{k,\ell}(j,r)=e^{i(kjh+\ell rh)}.\]
      <h4>2. Define the spectral operator</h4>
      <p>Differentiate the resolved trigonometric interpolant. Its negative Laplacian multiplies each coefficient by \(k^2+\ell^2\). Applying the inverse DFT evaluates the differentiated interpolant at grid points.</p>
      \[A_{\rm sp}=\mathcal F^{-1}\operatorname{diag}(\lambda_{\rm sp})\mathcal F.\]
      <h4>3. Apply the five-point stencil to a mode</h4>
      \[(A_hv)_{j,r}=\frac{4v_{j,r}-v_{j+1,r}-v_{j-1,r}-v_{j,r+1}-v_{j,r-1}}{h^2}.\]
      <p>Shifts in the first coordinate multiply a Fourier mode by \(e^{\pm ikh}\); shifts in the second multiply it by \(e^{\pm i\ell h}\). Thus</p>
      \[A_h\varphi_{k,\ell}=\frac{4-e^{ikh}-e^{-ikh}-e^{i\ell h}-e^{-i\ell h}}{h^2}\varphi_{k,\ell}.\]
      \[\lambda_h=h^{-2}(4-2\cos kh-2\cos\ell h)=4h^{-2}\left(\sin^2(kh/2)+\sin^2(\ell h/2)\right).\]
      <h4>4. Derive consistency for fixed frequencies</h4>
      \[\sin^2 z=z^2-\frac{z^4}{3}+O(z^6).\]
      \[\lambda_h(k,\ell)=k^2+\ell^2-\frac{h^2}{12}(k^4+\ell^4)+O\!\left(h^4(k^6+\ell^6)\right).\]
      <p>For fixed \(k,\ell\) and \(h\to0\), this gives second-order consistency. It is not a uniform relative approximation for frequencies that approach Nyquist as the grid changes.</p>
      <h4>5. Solve each chosen discrete problem</h4>
      \[\widehat u_h(k,\ell)=\widehat f_h(k,\ell)/\lambda(k,\ell)\quad\text{for }(k,\ell)\neq(0,0).\]
      <p>Both denominators vanish only at the constant mode on the representative set. Two-dimensional transforms use row and column FFTs, costing \(O(N^2\log N)\), or \(O(M\log M)\) for \(M=N^2\) grid points. Uniform periodic grids and constant coefficients are essential to this diagonalization.</p>`,
    refs: ['trefethen','fftw-definition']
  },
  {
    id: 'poisson-error', title: 'Residual, discretization error, and a manufactured convergence test', chapter: 'poisson',
    summary: 'An accurately solved discrete system can still approximate the continuous PDE poorly.',
    statement: String.raw`Let \(u_h\) solve \(A_hu_h=f_h\) and \(\widetilde u_h\) be computed. Then
      \[\widetilde u_h-u_*|_h=(\widetilde u_h-u_h)+(u_h-u_*|_h).\]
      The two terms are algebraic and discretization errors.`,
    body: String.raw`
      <h4>1. Relate residual to algebraic error only</h4>
      <p>Work on the mean-zero subspace, where \(A_h\) is invertible. For \(r_h=A_h\widetilde u_h-f_h\):</p>
      \[\widetilde u_h-u_h=A_h^{-1}r_h,\qquad \|\widetilde u_h-u_h\|_2\leq\|A_h^{-1}\|_2\|r_h\|_2.\]
      <p>This inequality refers to the exact solution of the chosen discrete system. It contains no estimate of \(u_h-u_*|_h\).</p>
      <h4>2. Choose a known continuous answer</h4>
      \[u_*(x,y)=\sin(3x)\cos(2y)+\tfrac14\cos(5x),\]
      \[f_*(x,y)=-\Delta u_*=13\sin(3x)\cos(2y)+\tfrac{25}{4}\cos(5x).\]
      <p>For \(N>10\), these frequencies lie strictly below Nyquist. The spectral method reproduces their grid values in exact arithmetic. This is a check of the finite-dimensional solver, not a general convergence theorem.</p>
      <h4>3. Derive the finite-difference error on each mode</h4>
      <p>A continuous eigenmode with \(\lambda=k^2+\ell^2\) produces sampled source amplitude \(\lambda\). The finite-difference inverse returns amplitude \(\lambda/\lambda_h\), hence</p>
      \[\frac{\lambda}{\lambda_h}-1=\frac{h^2(k^4+\ell^4)}{12(k^2+\ell^2)}+O(h^4).\]
      <p>For this fixed finite combination of modes, orthogonality therefore yields an \(O(h^2)\) solution error while the residual of an exact discrete solve is zero.</p>
      <h4>4. Add an infinite-spectrum manufactured solution</h4>
      <p>Set \(v=e^{\cos x+\sin y}\), and subtract its mean from the solution. Differentiation gives</p>
      \[v_{xx}=(-\cos x+\sin^2x)v,\qquad v_{yy}=(-\sin y+\cos^2y)v,\]
      \[f=-\Delta v=(\cos x+\sin y-\sin^2x-\cos^2y)e^{\cos x+\sin y}.\]
      <p>This analytic function contains infinitely many Fourier modes. Grid refinement now probes truncation and aliasing as well as arithmetic. Use the same discrete mean convention for the reference and computed solutions, and record any source projection.</p>
      <h4>5. State the regularity dependence</h4>
      <p>For a periodic function whose coefficients satisfy \(|\widehat u_{k,\ell}|\leq Ce^{-\rho(|k|+|\ell|)}\), the Fourier truncation tail decreases exponentially in the cutoff, up to constants. For finitely smooth functions, coefficient decay is algebraic instead. A general PDE convergence claim must also control source sampling and aliasing; a graph alone does not supply these assumptions.</p>
      <p><strong>Reporting rule.</strong> Show residual and exact-reference error separately. If a source has no known solution, report a residual or a properly qualified grid-refinement comparison, not an invented exact error.</p>`,
    refs: ['trefethen','higham']
  },
  {
    id: 'entropy-bound', title: 'An entropy lower bound in the unitary two-coordinate model', chapter: 'limits',
    summary: 'The amount of mixing imposes a quasilinear lower bound, but only within a stated circuit model.',
    statement: String.raw`With \(N\) complex registers, exact arithmetic, and unitary \(2\times2\) gates acting on pairs of coordinates, computing \(U_N\) requires at least \(\tfrac N2\log_2N\) gates.`,
    body: String.raw`
      <h4>1. Fix the model and potential</h4>
      <p>No auxiliary registers are allowed. The partial transformation \(M\) is unitary. Define \(0\log_2 0=0\) and</p>
      \[\Phi(M)=-\sum_{i,j}|M_{ij}|^2\log_2|M_{ij}|^2.\]
      \[\Phi(I)=0,\qquad |(U_N)_{ij}|^2=1/N,\qquad \Phi(U_N)=N\log_2N.\]
      <h4>2. Bound one gate</h4>
      <p>Only two rows change. In column \(j\), their total squared magnitude \(s_j=|a_j|^2+|b_j|^2\) is preserved. For \(s_j>0\), put \(p_j=|a_j|^2/s_j\). Their contribution is</p>
      \[-s_j\log_2s_j+s_jh_2(p_j),\qquad h_2(p)=-p\log_2p-(1-p)\log_2(1-p).\]
      <p>Since \(0\leq h_2\leq1\), its change has absolute value at most \(s_j\). The two rows have unit norm, so \(\sum_js_j=2\). Thus \(|\Delta\Phi|\leq2\).</p>
      <h4>3. Telescope</h4>
      \[N\log_2N=\Phi(U_N)-\Phi(I)\leq\sum_{t=1}^T|\Delta\Phi_t|\leq2T.\]
      <p>For power-of-two sizes, normalized radix-2 butterflies meet the same asymptotic order. If permutations cost gates, include their swaps; the butterfly count alone assumes its stated input arrangement.</p>
      <h4>4. Keep the boundary visible</h4>
      <p>This is a matrix potential, not entropy of one input signal. The conclusion concerns this exact, no-extra-register, unitary-gate model. It is not a universal lower bound across all computational models or a wall-clock prediction.</p>`,
    refs: ['ailon']
  }
];
