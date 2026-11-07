# FFT ATLAS · convenciones y argumentos matemáticos

Este documento registra las convenciones que deben compartir el texto, el núcleo numérico y las visualizaciones. El desarrollo de lectura completo está en `src/content.ts`, con demostraciones desplegables. La exposición está pensada para 55 minutos de contenido y 5 de preguntas; aliasing se integra en fundamentos y el mapa queda disponible para consulta.

## 1. DFT e inversión

Para índices de cero a N−1:

\[
\omega_N=e^{-2\pi i/N},\qquad X_k=\sum_{n=0}^{N-1}x_n\omega_N^{nk},
\qquad x_n=\frac1N\sum_{k=0}^{N-1}X_k\omega_N^{-nk}.
\]

La matriz es F=(ω_N^{kn}); F*F=NI. La matriz U=F/√N es unitaria. Parseval toma la forma ‖X‖₂²=N‖x‖₂² y κ₂(F)=1. La transformada bidimensional aplica esta convención a cada eje; la inversa divide por N² en una malla N×N.

No confundir esta normalización con la usada en el artículo original de Cooley y Tukey, que escribe un signo positivo. Las dos convenciones son válidas si se mantienen coherentes.

## 2. Factorización general

Sean N=N₁N₂, n=a+N₁b y k=c+N₂d. Los rangos son 0≤a,d<N₁ y 0≤b,c<N₂. La identidad es

\[
X_{c+N_2d}=\sum_{a=0}^{N_1-1}\omega_{N_1}^{ad}\omega_N^{ac}
\sum_{b=0}^{N_2-1}x_{a+N_1b}\omega_{N_2}^{bc}.
\]

Se obtiene expandiendo nk=ac+aN₂d+N₁bc+Nbd. No exige coprimalidad. La primera matriz de resultados debe tener entradas A[a][c], la segunda A[a][c]ω_N^{ac}, y la salida debe colocarse en c+N₂d. Validar un caso N=12 con N₁=3, N₂=4, además de casos con factores iguales y orden invertido.

Una sola división en dos factores no basta para afirmar O(N log N) para todos los tamaños. El coste también depende de cómo se calculan las DFT pequeñas. La recurrencia radix-2 justifica Θ(N log N) para N potencia de dos; radices acotados admiten el análisis análogo.

## 3. Radix-2 e inversión de bits

La combinación es X_k=E_k+ω_N^k O_k y X_{k+N/2}=E_k−ω_N^k O_k. La segunda fórmula usa la periodicidad N/2 de E y O y ω_N^{N/2}=−1.

En iterativa DIT, la entrada se permuta por inversión de m bits para N=2^m, seguida de etapas de longitudes 2,4,…,N. La salida queda en orden natural. La permutación par/impar de un solo nivel de la identidad matricial NO es la inversión completa de bits.

Hay (N/2)log₂N mariposas. La cuenta estándar de cada una es un producto complejo más dos sumas complejas, antes de factores especiales. Guardar todas las etapas para visualización consume O(N log N), aunque solo mantener el arreglo corriente permite O(N) almacenamiento total.

## 4. Aliasing

Para t_n=2πn/N se tiene exp(i(k+qN)t_n)=exp(ikt_n), para k,q enteros. Si f tiene una serie de Fourier absolutamente sumable, sus coeficientes discretos normalizados satisfacen

\[
\widetilde f_k=\sum_{q\in\mathbb Z}\widehat f_{k+qN}.
\]

La sumabilidad permite intercambiar la suma finita y la serie, y la ortogonalidad selecciona los índices congruentes. Aliasing, fuga espectral y relleno con ceros son fenómenos distintos. El relleno aumenta la densidad de muestreo de la transformada de la secuencia finita; no añade datos observados.

## 5. Estabilidad: teorema condicional, no certificación del navegador

Para etapas unitarias Q_s y una permutación P, supóngase que

\[
\|\operatorname{fl}(Q_sv)-Q_sv\|_2\leq\eta\|v\|_2.
\]

Con m etapas, el error relativo de la transformación normalizada está acotado por (1+η)^m−1. Si η≤γ_c=cu/(1−cu) y cmu<1, la cota es a lo sumo γ_{cm}. Esto se demuestra usando (1−cu)^m≥1−mcu.

La hipótesis η=O(u) requiere precisión controlada de giros y operaciones, ausencia de desbordamiento y subdesbordamiento significativo. La constante c depende de la implementación; el atlas no inventa una certificación numérica de c para `Math.sin` o `Math.cos`.

La unitariedad transforma el error hacia delante normativo en un error hacia atrás de igual tamaño relativo. No se sigue precisión relativa componente a componente. Una referencia independiente de alta precisión, casos exactos, Parseval y la ida y vuelta comprueban propiedades complementarias.

## 6. Poisson periódico

El problema es −Δu=f en [0,2π)², con media de u igual a cero. La fuente debe tener media cero. Para (k,ℓ)≠(0,0), û=f̂/(k²+ℓ²). El modo cero se fija a cero y nunca se divide por un regularizador inventado.

El operador de cinco puntos tiene símbolo

\[
\lambda_h(k,\ell)=\frac4{h^2}\left(\sin^2\frac{kh}{2}+\sin^2\frac{\ell h}{2}\right),\qquad h=2\pi/N.
\]

La fuente fabricada corresponde a u=sin(3x)cos(2y)+(1/4)cos(5x). Por tanto f=13sin(3x)cos(2y)+(25/4)cos(5x). Debe usarse una malla que resuelva el modo 5. El redondeo dominante en el método espectral para este dato no constituye una demostración de convergencia espectral para datos generales.

El caso suave adicional usa v=exp(cos x+sin y) y f=(cos x+sin y−sin²x−cos²y)v. Restar una constante a v fija la media sin cambiar la fuente continua. En una malla finita hay que declarar la fijación de media discreta y cualquier proyección del segundo miembro.

El residual se calcula con el operador elegido. Para diferencias finitas se puede aplicar directamente el stencil periódico en espacio físico. El error contra la solución conocida usa la misma convención de media. Si no se conoce la solución, no se informa un error de solución ficticio. Residual pequeño no implica discretización precisa.

## 7. Cota entrópica y permutaciones

Modelo de Ailon: N registros complejos, aritmética exacta y compuertas unitarias 2×2 que mezclan dos coordenadas, sin registros auxiliares. Para la matriz unitaria parcial M,

\[
\Phi(M)=-\sum_{i,j}|M_{ij}|^2\log_2|M_{ij}|^2,\quad 0\log_2 0=0.
\]

Una compuerta modifica dos filas. En cada columna conserva s_j, la suma de sus dos módulos cuadrados, y la contribución entrópica puede cambiar a lo sumo s_j. La suma de los s_j es 2, por las normas de las filas. De Φ(I)=0 y Φ(U)=Nlog₂N se obtiene al menos (N/2)log₂N compuertas.

La FFT normalizada alcanza ese orden asintótico. Hay exactamente (N/2)log₂N mariposas normalizadas con la permutación de entrada apropiada. Si el modelo cuenta los swaps del ordenamiento, estos se añaden: no afirmar igualdad exacta de costo sin declarar la convención. El potencial pertenece a la matriz, no a la señal que se transforma.

## 8. Fuentes y límites de las referencias

Las fuentes primarias y enlaces están en `src/content.ts` y `docs/REFERENCES.bib`. Se verificaron las páginas de Cooley–Tukey, Higham, FFTW, Ailon y los registros de FlashFFTConv y precisión mixta MRI. Los trabajos de hardware y precisión mixta se citan como investigación externa; no se presentan como experimentos reproducidos del atlas.

Todo resultado experimental debe apuntar a datos, protocolo y metadatos reales. Los resultados históricos y las nuevas ejecuciones no se deben mezclar sin identificar su procedencia.
