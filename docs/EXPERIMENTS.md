# Experimentos reproducibles de FFT ATLAS

Los resultados de `public/data/results.json` proceden de una ejecución real del programa incluido en `experiments/experiments.py`. El archivo conserva fecha UTC, CPU, versiones, semilla, configuración de hilos, muestras de tiempo y hash SHA-256 del programa. Las cifras describen este entorno concreto.

## Reproducir desde el repositorio

En Python 3.12, preferiblemente dentro de un entorno virtual:

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r experiments/requirements.txt
(cd experiments && python -m pytest -q)
python experiments/experiments.py --output public/data
```

En Windows, activar el entorno con `.venv\Scripts\activate` y ejecutar las pruebas después de entrar en `experiments`. El archivo descargable `experiments.py` también acepta `--output data` para uso fuera del repositorio.

El JSON tiene las secciones `metadata`, `timings`, `accuracy`, `convolution` y `poisson`. Los CSV permiten consultar datos sin ejecutar la web. Los tiempos nuevos variarán con el procesador, la carga, el sistema y las bibliotecas; reproducir el protocolo no implica reproducir cada tiempo de reloj.

## Convención de Fourier

Se usa $X_k=\sum_{n=0}^{N-1}x_n e^{-2\pi i nk/N}$, sin normalizar la transformación directa. La inversa lleva el factor $1/N$. Todas las comparaciones usan esta convención.

## Tiempo: comparar implementaciones con un alcance explícito

Para $N=64,128,256,512,1024,2048$ se transforman señales gaussianas complejas de precisión doble. Se comparan:

1. Producto por una matriz DFT densa previamente construida.
2. FFT radix-2 DIT compilada con Numba y `fastmath=False`.
3. `scipy.fft.fft`, con `workers=1`.

Se fijan los grupos BLAS y OpenMP a un hilo, se calienta cada método y se realizan nueve lotes en orden aleatorio. Cada muestra es el tiempo medio por llamada dentro de un lote. Se publican todas las muestras, mediana y cuartiles; el intervalo intercuartílico es descriptivo y no constituye un intervalo de confianza.

La compilación, la creación de la matriz y la planificación radix-2 quedan fuera del tiempo de ejecución. La construcción de matriz y del plan se registra por separado como una sola observación. Se incluye la asignación de la salida. El coste de almacenamiento de la matriz es $16N^2$ bytes para `complex128`.

Las curvas de tiempo no prueban la complejidad asintótica: esa conclusión se obtiene del conteo de operaciones. Tampoco permiten atribuir toda diferencia observada al orden asintótico, porque las implementaciones tienen constantes y estrategias distintas.

## Precisión: referencia independiente

Para $N=16,32,64,128,256$ se generan tres señales gaussianas complejas por tamaño y se calcula una DFT directa con 80 dígitos decimales mediante mpmath. La señal se redondea primero a `complex64` o `complex128`; la referencia recibe exactamente los valores representables resultantes. Así se estudia el error del algoritmo sin mezclarlo con la cuantización inicial del dato.

Se mide $\|\widetilde X-X_{\rm ref}\|_2/\|X_{\rm ref}\|_2$. Para el dato nulo se define la discrepancia como cero si ambos vectores son nulos; un resultado no nulo frente a referencia nula tiene error relativo infinito.

En precisión simple, la implementación por etapas utiliza almacenamiento y factores de giro `complex64`; se comprueba explícitamente que SciPy conserva ese tipo. En precisión doble se comparan radix-2, SciPy y DFT densa. La precisión de la referencia se verifica además contra 110 dígitos en un caso pequeño.

Tres señales no caracterizan el peor caso ni establecen una ley estadística universal. La matriz $F_N/\sqrt N$ es unitaria, pero el buen condicionamiento normativo no garantiza error relativo pequeño en cada coeficiente casi nulo. La ida y vuelta FFT–IFFT se usa como comprobación adicional, no como referencia independiente.

## Longitudes: la misma convolución lineal

Dos vectores de 30 000 entradas producen 59 999 coeficientes. El programa compara la longitud mínima, `scipy.fft.next_fast_len(59999)` y la siguiente potencia de dos. Todas las salidas se recortan a la misma convolución lineal.

El acuerdo entre esas salidas es una prueba de consistencia entre cálculos en doble precisión; no es un error frente a una solución exacta. Una prueba adicional contrasta convoluciones pequeñas con la suma directa `numpy.convolve`. Rellenar con ceros una señal cambia la DFT y su malla de frecuencias: lo que aquí se preserva es la convolución lineal recortada.

## Poisson periódico: residual y discretización

Se resuelve $-\Delta u=f$ en $[0,2\pi)^2$ con media cero y solución fabricada

$$
u(x,y)=\sin(3x)\cos(2y)+\tfrac14\cos(5x),\qquad
f(x,y)=13\sin(3x)\cos(2y)+\tfrac{25}{4}\cos(5x).
$$

La comparación usa mallas $N=16,32,64,128$. El operador espectral tiene símbolo $k^2+\ell^2$; el operador de cinco puntos tiene símbolo

$$
\lambda_h(k,\ell)=\frac4{h^2}\left(\sin^2\frac{\pi k}{N}+\sin^2\frac{\pi\ell}{N}\right),\qquad h=2\pi/N.
$$

El modo cero se fija a cero. El residual de diferencias finitas se evalúa aplicando el stencil en espacio físico, de manera independiente de la división modal. El residual espectral se evalúa volviendo a transformar la solución y aplicando su multiplicador.

Se informa por separado el error frente a la solución analítica y el residual del sistema elegido. Esta solución es un polinomio trigonométrico completamente resuelto en todas las mallas: el método espectral llega a redondeo y este ejemplo no demuestra una tasa general de convergencia espectral. En diferencias finitas se espera orden dos, observable al reducir aproximadamente por cuatro el error al duplicar $N$.

## Datos históricos

`results-historical-20260926.json` conserva intactos los resultados del prototipo del 26 de septiembre de 2026. Es un archivo de procedencia histórica. El sitio principal utiliza la nueva ejecución en `results.json`; no combina silenciosamente mediciones de los dos entornos.

La web ejecuta por separado sus pequeños laboratorios JavaScript. Sus tiempos dependen del navegador y no deben mezclarse con los tiempos Python almacenados.
