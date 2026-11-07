# Auditoría numérica: ejecución del 7 de noviembre de 2026

## Alcance comprobado

Se inspeccionó el paquete del prototipo y se reutilizó su protocolo experimental. Se ejecutaron de nuevo los experimentos Python y 30 pruebas numéricas; todas las pruebas finalizaron correctamente. Esta auditoría no sustituye la validación independiente del núcleo TypeScript ni las pruebas de interfaz del sitio.

La nueva ejecución empezó a las 14:29:15 UTC y terminó a las 14:29:22 UTC. Entorno: Linux x86-64, Intel Xeon Platinum 8573C, Python 3.12.14, NumPy 2.3.5, SciPy 1.17.0, Numba 0.65.1, mpmath 1.3.0 y BLAS con un hilo. El JSON conserva el detalle completo.

## Cambios introducidos respecto del paquete histórico

- La referencia de precisión documenta la conversión exacta del dato binario ya representable; distingue error del algoritmo de redondeo de entrada.
- Se comprueba que las rutas de precisión simple mantienen `complex64` y que la radix-2 doble devuelve `complex128`.
- Se define el caso de referencia nula en la medida de error.
- Se registra el hash SHA-256 del script, versión del protocolo y fecha de finalización.
- Se añadieron pruebas de desplazamiento circular y modo complejo puro, comparación de referencias de 80 y 110 dígitos, conservación del tipo simple y dato nulo.
- El archivo de resultados de septiembre se preservó byte a byte, separado de la ejecución activa.

## Evidencia obtenida

Las pruebas incluyen acuerdo con SciPy hasta $N=1024$, impulso, señal constante, Parseval, inversión, tamaños inválidos, referencia independiente de alta precisión, convolución lineal y Poisson periódico.

En $N=256$, para las tres señales de precisión doble, la mediana del error normativo relativo de radix-2 fue $3.3433\times10^{-16}$. Para la implementación por etapas en precisión simple fue $1.0407\times10^{-7}$. Son observaciones del conjunto de prueba, no cotas universales de estabilidad.

En Poisson con $N=128$, el operador de diferencias finitas produjo error relativo de solución $2.1945\times10^{-3}$ y residual relativo $1.4868\times10^{-14}$. El descenso del error al refinar es compatible con orden dos. Esto ilustra la separación entre resolver bien el sistema discreto y aproximar bien el problema continuo.

La convolución de dos vectores de 30 000 entradas produjo estas medianas descriptivas:

| Longitud de FFT | Tiempo por convolución |
|---:|---:|
| 59 999 | 13.7939 ms |
| 60 000 | 2.7924 ms |
| 65 536 | 3.1493 ms |

Las tres rutas calculan la misma convolución lineal recortada. La razón de tiempos cambia entre ejecuciones y equipos; no debe trasladarse a otro entorno como una constante.

## Límites de la evidencia

La máquina es un contenedor compartido, sin aislamiento de frecuencia o carga. Hay nueve lotes de tiempo y tres señales por estudio de precisión. Los cuartiles no son intervalos de confianza. No se midió GPU ni precisión mixta acelerada por hardware.

El polinomio trigonométrico de Poisson está completamente resuelto por todas las mallas del experimento. El error espectral cercano al redondeo valida este caso; no establece una tasa de convergencia para toda fuente suave.

La construcción de la DFT densa y el plan radix-2 se registra como observación individual y se excluye del tiempo del kernel. El sitio debe conservar esa explicación cuando muestre las curvas.

## Procedencia y repetición

`public/data/provenance.json` identifica la ejecución activa y el archivo histórico. `public/data/results.json` contiene las muestras y metadatos; `timings.csv`, `accuracy.csv` y `poisson.csv` contienen los datos tabulares. Las instrucciones exactas están en `docs/EXPERIMENTS.md`.

El hash registrado de `experiments/experiments.py` coincide con el archivo ejecutado y con su copia descargable. El archivo histórico coincide byte a byte con el original recuperado.
