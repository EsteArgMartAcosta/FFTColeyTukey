"""Independent invariants behind the extended data asset."""
import numpy as np
import pytest
from scipy import fft
from extended_study import plan, direct_dft, radix2, high_precision_dft, mp_metrics, linear_convolution, smooth_poisson


@pytest.mark.parametrize('n', [2, 16, 128])
def test_independent_direct_sum_and_radix2_agree(n):
    rng = np.random.default_rng(27)
    x = rng.normal(size=n) + 1j*rng.normal(size=n)
    reverse, roots = plan(n)
    np.testing.assert_allclose(direct_dft(x, roots), fft.fft(x), rtol=2e-13, atol=2e-13)
    np.testing.assert_allclose(radix2(x, reverse, roots), fft.fft(x), rtol=2e-13, atol=2e-13)


def test_single_precision_is_preserved_and_measured_against_cast_input():
    rng = np.random.default_rng(2)
    x = (rng.normal(size=32) + 1j*rng.normal(size=32)).astype(np.complex64)
    reverse, roots = plan(32, np.complex64)
    got = radix2(x, reverse, roots)
    assert got.dtype == np.complex64
    error, weak = mp_metrics(got, high_precision_dft(x))
    assert error < 3e-7
    assert weak is None


def test_padding_preserves_full_linear_support_and_rejects_aliasing():
    a = np.array([1., -3., 2., .5])
    b = np.array([-.4, 2., 1.])
    reference = np.convolve(a, b)
    for length in (6, 7, 8, 16):
        np.testing.assert_allclose(linear_convolution(a, b, length), reference, atol=2e-14)
    with pytest.raises(ValueError):
        linear_convolution(a, b, 5)


def test_nonpolynomial_spectral_convergence_and_fd_second_order():
    spectral = [smooth_poisson(n, 'spectral') for n in (8, 16, 32)]
    assert spectral[2]['relative_solution_l2'] < 2e-13
    assert spectral[0]['relative_solution_l2'] > 100*spectral[1]['relative_solution_l2']
    fd = [smooth_poisson(n, 'fd') for n in (32, 64, 128)]
    ratio = fd[1]['relative_solution_l2'] / fd[2]['relative_solution_l2']
    assert 3.8 < ratio < 4.2
    assert max(r['relative_residual_l2'] for r in spectral+fd) < 5e-13
    assert max(r['solution_mean_abs'] for r in spectral+fd) < 1e-13


def test_high_precision_reference_resolves_roundoff():
    import mpmath as mp
    x = np.array([1+2j, -.5+3j, 4-1j, .125-.25j])
    a, b = high_precision_dft(x, 80), high_precision_dft(x, 110)
    with mp.workdps(110):
        assert max(abs(x-y) for x,y in zip(a,b)) < mp.mpf('1e-75')
