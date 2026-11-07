# FFT Atlas · Cooley–Tukey

Un sitio académico interactivo para una exposición de Análisis Numérico en el IMPA. Nueve capítulos conectan la estructura algebraica de la DFT, la factorización Cooley–Tukey, la implementación, la precisión numérica y Poisson periódico.

**Sitio:** https://EsteArgMartAcosta.github.io/FFTColeyTukey/

## Explorar, estudiar, exponer

- **Explorar:** laboratorios con parámetros, valores e índices calculados en vivo.
- **Estudiar:** demostraciones completas y preguntas de defensa.
- **Exponer:** recorrido de 55 minutos con los laboratorios en primer plano; 5 minutos adicionales para preguntas.
- **Mapa:** conceptos navegables, dependencias y bibliografía primaria.

Los laboratorios incluyen raíces y ortogonalidad, una factorización general con factores no necesariamente coprimos, ejecución radix-2 por etapas, aliasing y fuga espectral, tiempos y precisión medidos, dos discretizaciones de Poisson y una cota entrópica en un modelo restringido.

## Ejecutar localmente

Requiere Node.js 24 y npm.

```bash
npm ci
npm run dev
```

Abrir la dirección que imprime Vite, con la ruta `/FFTColeyTukey/`. Para construir y comprobar la versión de producción:

```bash
npm test
npm run build
npm run preview
```

Las fuentes, KaTeX y los datos se incluyen en el paquete. Una vez instaladas las dependencias, el servidor local funciona sin conexión para la exposición; solo los enlaces externos a referencias requieren Internet. `npm run preview` requiere haber construido `dist/`.

## Convenciones y verificación

La DFT directa usa signo negativo y no se normaliza. La inversa lleva `1/N`. La traza de etapas y la FFT usan el mismo núcleo. Las pruebas incluyen referencias independientes, Parseval, cada butterfly, tamaños compuestos, modo cero y convergencia de Poisson. También se comprueba que todas las fórmulas del contenido se rendericen con KaTeX estricto.

El conteo de operaciones, las cotas matemáticas y los resultados experimentales se identifican por separado. Los tiempos guardados son mediciones reales de CPU del entorno documentado; abrir el sitio no ejecuta Python. La precisión mixta/GPU se discute mediante referencias, no como reproducción propia.

- [Desarrollo matemático](docs/MATHEMATICS.md)
- [Reproducir experimentos](docs/EXPERIMENTS.md)
- [Auditoría numérica](docs/NUMERICAL_AUDIT.md)
- [Guía para exponer](docs/LECTURE.md)
- [Bibliografía BibTeX](docs/REFERENCES.bib)

## Estructura

| Ruta | Contenido |
|---|---|
| `src/math.ts` | DFT, FFT, traza, factorización compuesta y Poisson |
| `src/content.ts` | Teoría, pruebas, preguntas y referencias |
| `src/labs.ts`, `src/advanced.ts` | Visualizaciones y simulaciones |
| `src/main.ts`, `src/style.css` | Navegación, mapa y diseño adaptable |
| `experiments/` | Experimentos y pruebas Python independientes |
| `public/data/` | Resultados, CSV y procedencia |
| `tests/` | Pruebas numéricas TypeScript y composición matemática |

## GitHub Pages

La configuración de Vite usa `base: '/FFTColeyTukey/'`. El workflow `.github/workflows/pages.yml` ejecuta pruebas y construcción antes del despliegue desde `main`; las pull requests se validan sin desplegar. En **Settings → Pages → Source** se utiliza **GitHub Actions**. El workflow independiente `numerics.yml` verifica Python cuando cambian los experimentos.

La publicación no requiere claves privadas en el código. El token temporal del workflow tiene permisos mínimos para Pages. Antes de modificar el nombre del repositorio, actualizar `base` y el enlace del sitio.

## Alcance académico

Material educativo independiente, no oficial del IMPA. Los artículos enlazados pertenecen a sus autores. Las hipótesis de las cotas de estabilidad y complejidad están explicitadas en el contenido. Un conjunto finito de pruebas no sustituye una demostración.
