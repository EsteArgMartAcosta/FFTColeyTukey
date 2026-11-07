import test from 'node:test';
import assert from 'node:assert/strict';
import { complex, add, sub, mul, abs, dft, fft, fftTrace, mixedRadix, poisson2D, relativeError } from '../src/math.ts';
import type { Complex } from '../src/math.ts';

const TAU = 2 * Math.PI;
const signal = (n: number) => Array.from({ length: n }, (_, j) => complex(Math.sin(1.731 * j) + .2 * Math.cos(.713 * j), .3 * Math.cos(2.17 * j)));
function close(actual: number, expected: number, tolerance = 1e-12) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}; tolerance ${tolerance}`);
}
function closeVector(actual: Complex[], expected: Complex[], tolerance = 2e-13) {
  const e = relativeError(actual, expected);
  assert.ok(e <= tolerance, `relative error ${e} > ${tolerance}`);
}

test('complex arithmetic is consistent with elementary exact identities', () => {
  assert.deepEqual(mul(complex(2, 3), complex(4, -5)), complex(23, 2));
  assert.deepEqual(add(complex(2, 3), complex(4, -5)), complex(6, -2));
  assert.deepEqual(sub(complex(2, 3), complex(4, -5)), complex(-2, 8));
  assert.equal(abs(complex(3, 4)), 5);
});

test('forward sign, frequency order, normalization and special signals', () => {
  for (const n of [1, 2, 4, 8, 16, 32]) {
    const impulse = Array.from({ length: n }, (_, j) => complex(j === 0 ? 1 : 0));
    closeVector(fft(impulse), Array.from({ length: n }, () => complex(1)));
    const constant = Array.from({ length: n }, () => complex(1));
    const transformed = fft(constant);
    transformed.forEach((z, k) => { close(z.re, k === 0 ? n : 0); close(z.im, 0); });
  }
  const n = 16, mode = 3;
  const tone = Array.from({ length: n }, (_, j) => complex(Math.cos(TAU * mode * j / n), Math.sin(TAU * mode * j / n)));
  fft(tone).forEach((z, k) => { close(z.re, k === mode ? n : 0, 2e-14); close(z.im, 0, 2e-14); });
  const delayed = Array.from({ length: 4 }, (_, j) => complex(j === 1 ? 1 : 0));
  closeVector(fft(delayed), [complex(1), complex(0, -1), complex(-1), complex(0, 1)]);
});

test('radix-2 agrees with independently evaluated direct sums', () => {
  for (const n of [1, 2, 4, 8, 16, 32, 64, 128, 256]) {
    const x = signal(n), saved = x.map(z => ({ ...z }));
    closeVector(fft(x), dft(x));
    closeVector(fft(x, true), dft(x, true));
    assert.deepEqual(x, saved, 'The algorithm must not mutate its input.');
  }
});

test('inverse and Parseval agree with the chosen nonunitary convention', () => {
  for (const n of [1, 2, 8, 32, 128]) {
    const x = signal(n), output = fft(x);
    closeVector(fft(output, true), x);
    const inputEnergy = x.reduce((s, z) => s + abs(z) ** 2, 0);
    const outputEnergy = output.reduce((s, z) => s + abs(z) ** 2, 0);
    close(outputEnergy / n, inputEnergy, 2e-12);
  }
});

test('linearity holds and complex data are not silently made real', () => {
  const x = signal(32), y = x.map(z => complex(z.im, -z.re)), a = complex(.7, -.2);
  closeVector(fft(x.map((z, j) => add(z, mul(a, y[j])))), fft(x).map((z, j) => add(z, mul(a, fft(y)[j]))));
});

test('trace is exactly the FFT kernel and every displayed butterfly matches its stage', () => {
  for (const n of [1, 2, 8, 16, 32]) {
    const x = signal(n), t = fftTrace(x), bits = Math.log2(n);
    assert.equal(t.stages.length, bits + 1);
    assert.equal(t.butterflies.length, n * bits / 2);
    assert.deepEqual(t.stages[0], t.permutation.map(i => x[i]));
    closeVector(t.stages.at(-1)!, fft(x), 0);
    assert.deepEqual([...t.permutation].sort((a, b) => a - b), Array.from({ length: n }, (_, i) => i));
    for (const butterfly of t.butterflies) {
      assert.deepEqual(butterfly.inputA, t.stages[butterfly.stage - 1][butterfly.a]);
      assert.deepEqual(butterfly.inputB, t.stages[butterfly.stage - 1][butterfly.b]);
      assert.deepEqual(butterfly.outputA, t.stages[butterfly.stage][butterfly.a]);
      assert.deepEqual(butterfly.outputB, t.stages[butterfly.stage][butterfly.b]);
      assert.deepEqual(butterfly.outputA, add(butterfly.inputA, mul(butterfly.twiddle, butterfly.inputB)));
      assert.deepEqual(butterfly.outputB, sub(butterfly.inputA, mul(butterfly.twiddle, butterfly.inputB)));
      close(abs(butterfly.twiddle), 1, 3e-16);
    }
    // Stage snapshots are independent data structures.
    if (n > 1) {
      const before = t.stages[1][0].re;
      t.stages[0][0].re = 999;
      assert.equal(t.stages[1][0].re, before);
      assert.notEqual(x[t.permutation[0]].re, 999);
    }
  }
  assert.deepEqual(fftTrace(signal(8)).permutation, [0, 4, 2, 6, 1, 5, 3, 7]);
});

test('general Cooley–Tukey handles nonsquare and non-power-of-two factors', () => {
  for (const [n1, n2] of [[1, 7], [7, 1], [3, 4], [4, 3], [3, 5], [5, 3], [3, 6], [2, 9], [4, 4], [6, 6]]) {
    const x = signal(n1 * n2), result = mixedRadix(x, n1, n2);
    closeVector(result.output, dft(x), 3e-14);
    assert.equal(result.first.length, n1);
    result.first.forEach((row, a) => {
      assert.equal(row.length, n2);
      closeVector(row, dft(Array.from({ length: n2 }, (_, b) => x[a + n1 * b])), 0);
      row.forEach((value, c) => {
        const angle = -TAU * a * c / x.length;
        assert.deepEqual(result.twiddled[a][c], mul(value, complex(Math.cos(angle), Math.sin(angle))));
      });
    });
  }
});

test('empty, unsupported, nonfinite and incompatible transform inputs fail explicitly', () => {
  assert.throws(() => fft([]), RangeError);
  assert.throws(() => dft([]), RangeError);
  assert.throws(() => fft(signal(3)), RangeError);
  assert.throws(() => fft([complex(Infinity)]), RangeError);
  assert.throws(() => dft([complex(0, NaN)]), RangeError);
  assert.throws(() => mixedRadix(signal(12), 2, 5), RangeError);
  assert.throws(() => mixedRadix(signal(12), 1.5, 8), RangeError);
});

test('relative error has explicit, meaningful behavior at a zero reference', () => {
  assert.equal(relativeError([0, 0], [0, 0]), 0);
  assert.equal(relativeError([complex(0)], [complex(0)]), 0);
  assert.equal(relativeError([1, 0], [0, 0]), Infinity);
  assert.equal(relativeError([complex(0, 1)], [complex(0)]), Infinity);
  assert.equal(relativeError([3, 4], [3, 4]), 0);
  assert.throws(() => relativeError([0], []), RangeError);
  close(relativeError([complex(6, 8)], [complex(3, 4)]), 1);
});

test('spectral Poisson resolves the manufactured trigonometric polynomial', () => {
  for (const n of [16, 32, 64]) {
    const out = poisson2D(n, 'spectral', 'manufactured');
    assert.ok(out.compatible);
    assert.equal(out.solution.length, n * n);
    assert.equal(out.spectrum.length, n * n);
    assert.ok(out.error! < 2e-14, `N=${n}: error=${out.error}`);
    assert.ok(out.residual! < 2e-13, `N=${n}: residual=${out.residual}`);
    close(out.solution.reduce((a, b) => a + b, 0) / (n * n), 0, 2e-16);
    assert.ok(out.imaginaryLeakage < 2e-15);
  }
});

test('finite-difference Poisson has a small discrete residual and second-order solution error', () => {
  const errors = [16, 32, 64, 128].map(n => {
    const out = poisson2D(n, 'fd', 'manufactured');
    assert.ok(out.residual! < 5e-13, `N=${n}: residual=${out.residual}`);
    assert.ok(out.error! > 1e-4, 'Residual and continuous solution error must not be conflated.');
    return out.error!;
  });
  for (let j = 1; j < errors.length; j++) {
    const ratio = errors[j - 1] / errors[j];
    assert.ok(ratio > 3.8 && ratio < 5, `Observed refinement ratio ${ratio}`);
  }
});

test('periodic Poisson refuses incompatible means unless projection is explicit', () => {
  const failed = poisson2D(32, 'spectral', 'manufactured', .5, false);
  assert.equal(failed.compatible, false);
  assert.equal(failed.residual, null);
  assert.equal(failed.error, null);
  assert.deepEqual(failed.solution, []);
  close(failed.mean, .5, 1e-14);
  const projected = poisson2D(32, 'spectral', 'manufactured', .5, true);
  const baseline = poisson2D(32, 'spectral', 'manufactured', 0, true);
  assert.equal(projected.compatible, true);
  assert.ok(relativeError(projected.solution, baseline.solution) < 5e-15);
  close(projected.forcing.reduce((a, b) => a + b, 0) / projected.forcing.length, 0, 2e-15);
  assert.ok(poisson2D(32, 'spectral', 'manufactured', 0, false).compatible);
});

test('smooth source supplies nontrivial spectral convergence and dipole never invents exact error', () => {
  const coarse = poisson2D(16, 'spectral', 'smooth'), fine = poisson2D(32, 'spectral', 'smooth');
  assert.ok(coarse.error! > fine.error! * 100, `${coarse.error} -> ${fine.error}`);
  assert.ok(fine.error! < 2e-13);
  const dipole = poisson2D(32, 'spectral', 'dipole');
  assert.equal(dipole.exact, null);
  assert.equal(dipole.error, null);
  assert.ok(dipole.residual! < 2e-13);
  assert.throws(() => poisson2D(8, 'spectral', 'manufactured'), RangeError);
  assert.throws(() => poisson2D(24, 'spectral', 'manufactured'), RangeError);
});
