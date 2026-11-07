/**
 * Numerical kernels for FFT Atlas. Forward convention:
 * X[k] = sum_n x[n] exp(-2*pi*i*n*k/N); inverse includes 1/N.
 * Binary64 throughout. Mathematical statements about exact DFTs are distinct
 * from these floating-point implementations and their measured errors.
 */
export type Complex = { re: number; im: number };
export const complex = (re: number, im = 0): Complex => ({ re, im });
export const add = (a: Complex, b: Complex): Complex => complex(a.re + b.re, a.im + b.im);
export const sub = (a: Complex, b: Complex): Complex => complex(a.re - b.re, a.im - b.im);
export const mul = (a: Complex, b: Complex): Complex => complex(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
export const abs = (a: Complex): number => Math.hypot(a.re, a.im);
const TAU = 2 * Math.PI;
const copy = (z: Complex): Complex => complex(z.re, z.im);
const root = (angle: number): Complex => complex(Math.cos(angle), Math.sin(angle));

function validateInput(input: readonly Complex[]): void {
  if (!input.length) throw new RangeError('La transformada requiere al menos una muestra.');
  if (input.some(z => !Number.isFinite(z.re) || !Number.isFinite(z.im))) {
    throw new RangeError('Las muestras deben tener partes reales e imaginarias finitas.');
  }
}

function requirePowerOfTwo(n: number): void {
  if (!Number.isSafeInteger(n) || n < 1 || !Number.isInteger(Math.log2(n))) {
    throw new RangeError('Radix-2 requiere una longitud que sea potencia de dos.');
  }
}

function bitReversal(n: number): number[] {
  const bits = Math.log2(n);
  return Array.from({ length: n }, (_, i) => {
    let value = i, reversed = 0;
    for (let b = 0; b < bits; b++) {
      reversed = 2 * reversed + value % 2;
      value = Math.floor(value / 2);
    }
    return reversed;
  });
}

/** Direct summation, independent of the butterfly implementation. */
export function dft(input: readonly Complex[], inverse = false): Complex[] {
  validateInput(input);
  const n = input.length, sign = inverse ? 1 : -1;
  return Array.from({ length: n }, (_, k) => {
    let re = 0, im = 0;
    for (let j = 0; j < n; j++) {
      // Reduce exponents to avoid unnecessarily large trigonometric arguments.
      const angle = sign * TAU * ((j * k) % n) / n;
      const c = Math.cos(angle), s = Math.sin(angle), z = input[j];
      re += z.re * c - z.im * s;
      im += z.re * s + z.im * c;
    }
    return complex(re / (inverse ? n : 1), im / (inverse ? n : 1));
  });
}

export type Butterfly = {
  stage: number;
  a: number;
  b: number;
  twiddle: Complex;
  inputA: Complex;
  inputB: Complex;
  outputA: Complex;
  outputB: Complex;
};

export type FFTTrace = {
  permutation: number[];
  /** Stage 0 is the bit-reversed input; stage log2(N) is natural-order output. */
  stages: Complex[][];
  butterflies: Butterfly[];
};

function radix2(input: readonly Complex[], inverse: boolean, record: boolean): FFTTrace {
  validateInput(input);
  requirePowerOfTwo(input.length);
  const n = input.length, permutation = bitReversal(n);
  const out = permutation.map(i => copy(input[i]));
  const stages = record ? [out.map(copy)] : [];
  const butterflies: Butterfly[] = [];
  let stage = 0;
  for (let size = 2; size <= n; size *= 2) {
    stage++;
    const half = size / 2;
    for (let start = 0; start < n; start += size) {
      for (let j = 0; j < half; j++) {
        const a = start + j, b = a + half;
        const twiddle = root((inverse ? 1 : -1) * TAU * j / size);
        const inputA = out[a], inputB = out[b], product = mul(twiddle, inputB);
        out[a] = add(inputA, product);
        out[b] = sub(inputA, product);
        if (record) butterflies.push({ stage, a, b, twiddle, inputA: copy(inputA), inputB: copy(inputB), outputA: copy(out[a]), outputB: copy(out[b]) });
      }
    }
    if (record) stages.push(out.map(copy));
  }
  if (inverse) for (const z of out) { z.re /= n; z.im /= n; }
  // The unrecorded path keeps only the output, avoiding trace allocation in PDEs.
  if (!record) stages.push(out);
  return { permutation, stages, butterflies };
}

/** Iterative radix-2 DIT FFT. The input is never mutated. */
export function fft(input: readonly Complex[], inverse = false): Complex[] {
  return radix2(input, inverse, false).stages[0];
}

/** Actual arithmetic trace of the same kernel used by fft(). */
export function fftTrace(input: readonly Complex[]): FFTTrace {
  return radix2(input, false, true);
}

export type MixedRadixResult = {
  output: Complex[];
  first: Complex[][];
  twiddled: Complex[][];
  n1: number;
  n2: number;
};

/**
 * One general Cooley–Tukey factorization, with direct DFTs at its leaves.
 * n = a + N1*b, k = c + N2*d.
 * first[a][c] = sum_b x[a+N1*b] omega_N2^(bc)
 * twiddled[a][c] = first[a][c] omega_N^(ac)
 * X[c+N2*d] = sum_a twiddled[a][c] omega_N1^(ad).
 * This single split is NOT an O(N log N) algorithm for arbitrary factors.
 */
export function mixedRadix(input: readonly Complex[], n1: number, n2: number): MixedRadixResult {
  validateInput(input);
  if (!Number.isSafeInteger(n1) || !Number.isSafeInteger(n2) || n1 < 1 || n2 < 1 || n1 * n2 !== input.length) {
    throw new RangeError('Los factores deben ser enteros positivos cuyo producto sea N.');
  }
  const n = input.length;
  const first = Array.from({ length: n1 }, (_, a) => dft(Array.from({ length: n2 }, (_, b) => input[a + n1 * b])));
  const twiddled = first.map((row, a) => row.map((z, c) => mul(z, root(-TAU * a * c / n))));
  const output: Complex[] = Array.from({ length: n }, () => complex(0));
  for (let c = 0; c < n2; c++) {
    const column = dft(Array.from({ length: n1 }, (_, a) => twiddled[a][c]));
    for (let d = 0; d < n1; d++) output[c + n2 * d] = column[d];
  }
  return { output, first, twiddled, n1, n2 };
}

/** Relative Euclidean error. For zero reference: 0 if equal, Infinity otherwise. */
export function relativeError(actual: readonly (Complex | number)[], reference: readonly (Complex | number)[]): number {
  if (actual.length !== reference.length) throw new RangeError('Las longitudes no coinciden.');
  let numerator = 0, denominator = 0;
  for (let i = 0; i < actual.length; i++) {
    const a = typeof actual[i] === 'number' ? complex(actual[i] as number) : actual[i] as Complex;
    const b = typeof reference[i] === 'number' ? complex(reference[i] as number) : reference[i] as Complex;
    numerator = Math.hypot(numerator, a.re - b.re, a.im - b.im);
    denominator = Math.hypot(denominator, b.re, b.im);
  }
  return denominator === 0 ? (numerator === 0 ? 0 : Infinity) : numerator / denominator;
}

function fft2(input: readonly Complex[], n: number, inverse = false): Complex[] {
  const out: Complex[] = Array.from({ length: n * n }, () => complex(0));
  for (let y = 0; y < n; y++) {
    const row = fft(input.slice(y * n, (y + 1) * n), inverse);
    for (let x = 0; x < n; x++) out[y * n + x] = row[x];
  }
  for (let x = 0; x < n; x++) {
    const col = fft(Array.from({ length: n }, (_, y) => out[y * n + x]), inverse);
    for (let y = 0; y < n; y++) out[y * n + x] = col[y];
  }
  return out;
}

export type PoissonResult = {
  compatible: boolean;
  /** Mean of original forcing, before any projection. */
  mean: number;
  /** The right-hand side actually used (projected if requested). */
  forcing: number[];
  solution: number[];
  /** Samples of a known continuous solution with its sampled mean removed. */
  exact: number[] | null;
  /** Natural-order, unshifted |FFT2(forcing)|. */
  spectrum: number[];
  residual: number | null;
  error: number | null;
  imaginaryLeakage: number;
};

/**
 * Periodic -Delta u=f on [0,2*pi)^2 with zero-mean solution.
 * Index = y*n+x. Spectral and FD symbols are different discrete operators.
 * "smooth" has infinitely many Fourier modes; projecting its sampled forcing
 * corrects discrete compatibility but slightly changes the sampled RHS.
 */
export function poisson2D(
  n: number,
  operator: 'spectral' | 'fd',
  kind: 'manufactured' | 'smooth' | 'dipole',
  offset = 0,
  project = true,
): PoissonResult {
  requirePowerOfTwo(n);
  if (n < 16) throw new RangeError('La malla debe tener N >= 16 para resolver el ejemplo fabricado.');
  if (operator !== 'spectral' && operator !== 'fd') throw new RangeError('Operador desconocido.');
  if (!['manufactured', 'smooth', 'dipole'].includes(kind)) throw new RangeError('Fuente desconocida.');
  if (!Number.isFinite(offset)) throw new RangeError('El desplazamiento debe ser finito.');
  const raw: number[] = [], exact: number[] | null = kind === 'dipole' ? null : [];
  const periodicDistance = (a: number, b: number) => Math.min(Math.abs(a - b), TAU - Math.abs(a - b));
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const a = TAU * x / n, b = TAU * y / n;
    if (kind === 'manufactured') {
      exact!.push(Math.sin(3 * a) * Math.cos(2 * b) + .25 * Math.cos(5 * a));
      raw.push(13 * Math.sin(3 * a) * Math.cos(2 * b) + 6.25 * Math.cos(5 * a) + offset);
    } else if (kind === 'smooth') {
      const u = Math.exp(Math.cos(a) + Math.sin(b));
      exact!.push(u);
      raw.push((Math.cos(a) + Math.sin(b) - Math.sin(a) ** 2 - Math.cos(b) ** 2) * u + offset);
    } else {
      const dy = periodicDistance(b, Math.PI), width = .42;
      const g = (center: number) => Math.exp(-(periodicDistance(a, center) ** 2 + dy ** 2) / (2 * width ** 2));
      raw.push(20 * (g(.7 * Math.PI) - g(1.3 * Math.PI)) + offset);
    }
  }
  const count = n * n, mean = raw.reduce((a, b) => a + b, 0) / count;
  const rms = Math.sqrt(raw.reduce((a, b) => a + b * b, 0) / count);
  if (exact) {
    const meanU = exact.reduce((a, b) => a + b, 0) / count;
    for (let i = 0; i < count; i++) exact[i] -= meanU;
  }
  if (!project && Math.abs(mean) > 1e-12 * Math.max(1, rms)) {
    return { compatible: false, mean, forcing: raw, solution: [], exact, spectrum: [], residual: null, error: null, imaginaryLeakage: 0 };
  }
  const forcing = raw.map(v => v - (project ? mean : 0));
  const hat = fft2(forcing.map(v => complex(v)), n);
  const lambda = Array.from({ length: count }, (_, i) => {
    const x = i % n, y = Math.floor(i / n), k = x < n / 2 ? x : x - n, l = y < n / 2 ? y : y - n;
    return operator === 'spectral' ? k * k + l * l
      : 4 * (Math.sin(Math.PI * k / n) ** 2 + Math.sin(Math.PI * l / n) ** 2) / (TAU / n) ** 2;
  });
  const uhat = hat.map((z, i) => i === 0 ? complex(0) : complex(z.re / lambda[i], z.im / lambda[i]));
  const computed = fft2(uhat, n, true), solution = computed.map(z => z.re);
  let applied: number[];
  if (operator === 'fd') {
    const h2 = (TAU / n) ** 2;
    // Independent physical-space five-point negative Laplacian.
    applied = solution.map((u, i) => {
      const x = i % n, y = Math.floor(i / n);
      return (4 * u - solution[y * n + (x + 1) % n] - solution[y * n + (x + n - 1) % n]
        - solution[((y + 1) % n) * n + x] - solution[((y + n - 1) % n) * n + x]) / h2;
    });
  } else {
    const actualSpectrum = fft2(solution.map(v => complex(v)), n);
    applied = fft2(actualSpectrum.map((z, i) => complex(lambda[i] * z.re, lambda[i] * z.im)), n, true).map(z => z.re);
  }
  let imaginaryLeakage = 0;
  for (const z of computed) imaginaryLeakage = Math.max(imaginaryLeakage, Math.abs(z.im));
  return {
    compatible: true, mean, forcing, solution, exact,
    spectrum: hat.map(abs), residual: relativeError(applied, forcing),
    error: exact ? relativeError(solution, exact) : null,
    imaginaryLeakage,
  };
}
