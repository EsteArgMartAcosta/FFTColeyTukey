"""Run in experiments/: python -m pytest -q"""
import numpy as np
import pytest
from scipy import fft as sfft
from experiments import radix2, radix2_plan, dense_matrix, mp_dft, relative_mp_error, poisson

@pytest.mark.parametrize('n',[1,2,4,8,16,32,64,128,256,512,1024])
def test_matches_scipy(n):
    rng=np.random.default_rng(20260926+n)
    x=rng.standard_normal(n)+1j*rng.standard_normal(n)
    np.testing.assert_allclose(radix2(x),sfft.fft(x),rtol=1e-12,atol=1e-12)

@pytest.mark.parametrize('n',[0,3,7,12,-1])
def test_rejects_invalid_plan(n):
    with pytest.raises(ValueError): radix2_plan(n)

def test_rejects_multidimensional_input():
    with pytest.raises(ValueError): radix2(np.ones((2,2)))

def test_impulse_constant_and_parseval():
    n=64
    impulse=np.zeros(n);impulse[0]=1
    np.testing.assert_allclose(radix2(impulse),np.ones(n),atol=1e-14)
    out=radix2(np.ones(n))
    np.testing.assert_allclose(out[0],n)
    np.testing.assert_allclose(out[1:],0,atol=1e-14)
    x=np.sin(np.arange(n)*1.32)+.1j*np.cos(np.arange(n)*.72)
    np.testing.assert_allclose(np.linalg.norm(radix2(x))**2,n*np.linalg.norm(x)**2,rtol=1e-13)

def test_inverse_round_trip():
    rng=np.random.default_rng(42)
    x=rng.normal(size=128)+1j*rng.normal(size=128)
    inverse=radix2(np.conj(radix2(x))).conj()/len(x)
    np.testing.assert_allclose(inverse,x,rtol=1e-12,atol=1e-12)

def test_independent_high_precision():
    rng=np.random.default_rng(7)
    x=rng.normal(size=32)+1j*rng.normal(size=32)
    ref=mp_dft(x)
    assert relative_mp_error(radix2(x),ref)<2e-15
    assert relative_mp_error(dense_matrix(32)@x,ref)<3e-15

def test_padding_preserves_small_linear_convolution():
    rng=np.random.default_rng(42)
    a=rng.normal(size=7);b=rng.normal(size=11)
    reference=np.convolve(a,b)
    for length in [17,18,32,64]:
        got=sfft.ifft(sfft.fft(a,length)*sfft.fft(b,length))[:len(reference)].real
        np.testing.assert_allclose(got,reference,rtol=1e-12,atol=1e-12)

@pytest.mark.parametrize('n',[16,32,64,128])
def test_poisson_spectral_manufactured(n):
    d=poisson(n,'spectral')
    assert d['relative_solution_l2']<1e-12
    assert d['relative_residual_l2']<1e-10
    assert d['solution_mean_abs']<1e-13

def test_poisson_fd_order_and_residual():
    a=poisson(32,'fd');b=poisson(64,'fd');c=poisson(128,'fd')
    assert 3.5<a['relative_solution_l2']/b['relative_solution_l2']<4.5
    assert 3.5<b['relative_solution_l2']/c['relative_solution_l2']<4.5
    assert max(x['relative_residual_l2'] for x in [a,b,c])<1e-10

def test_shift_theorem_and_single_complex_mode():
    n=32
    j=np.arange(n)
    mode=np.exp(2j*np.pi*7*j/n)
    expected=np.zeros(n,dtype=complex);expected[7]=n
    np.testing.assert_allclose(radix2(mode),expected,atol=2e-13)
    x=np.sin(j*.77)+1j*np.cos(j*.13)
    shift=5
    expected_shift=radix2(x)*np.exp(-2j*np.pi*j*shift/n)
    np.testing.assert_allclose(radix2(np.roll(x,shift)),expected_shift,atol=3e-13)

def test_high_precision_reference_has_resolved_accuracy():
    x=np.array([1+2j, -3+.25j, .125-1j, 2-.75j])
    ref80=mp_dft(x,80)
    ref110=mp_dft(x,110)
    import mpmath as mp
    with mp.workdps(110):
        assert max(abs(a-b) for a,b in zip(ref80,ref110))<mp.mpf('1e-75')

def test_scipy_preserves_single_precision():
    x=np.asarray([1+2j,3+4j,5+6j,7+8j],dtype=np.complex64)
    assert sfft.fft(x).dtype==np.complex64

def test_zero_reference_convention():
    x=np.zeros(8,dtype=np.complex128)
    assert relative_mp_error(radix2(x),mp_dft(x))==0
