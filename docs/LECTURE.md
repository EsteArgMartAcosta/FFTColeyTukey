# Guía del expositor · 55 minutos + 5 de preguntas

| Capítulo | Minutos | Acción que sostiene el argumento |
|---|---:|---|
| Panorama | 2 | Distinguir objeto matemático y algoritmo; formular la pregunta sobre estructura. |
| Raíces & DFT | 5 | Probar la suma geométrica y obtener la inversa. Usar el laboratorio con k=ℓ y k≠ℓ. |
| Cooley–Tukey | 17 | Derivar la reindexación general, ejecutar 12=3×4 y después las dos identidades radix-2. |
| Butterflies | 8 | Explicar bit reversal; recorrer N=8 y seleccionar un nodo. Derivar la recurrencia. |
| Aliasing | 2 | Mostrar dos ondas que coinciden en las muestras y separar aliasing de fuga espectral. |
| Coste & precisión | 9 | Contrastar conteos con tiempos, referencia de alta precisión y dependencia de longitud. |
| Poisson | 9 | Probar compatibilidad; comparar símbolos; refinar FD y activar una fuente incompatible. |
| Límites | 3 | Enunciar el modelo, presentar el potencial y conectar con memoria y precisión. |

El mapa es un índice de apoyo, sin tiempo adicional obligatorio. La prueba completa de la cota entrópica queda disponible en el modo Estudiar para preguntas. Si el profesor prefiere un cierre teórico más largo, reasignar tiempo tras ensayar sin ampliar silenciosamente el recorrido.

## Tres derivaciones para el tablero

1. Suma geométrica y F*F=NI: precisar la conjugación y el factor de normalización.
2. Cooley–Tukey: declarar los rangos de a,b,c,d antes de expandir el producto de índices. En radix-2, justificar también la salida k+N/2.
3. Poisson: integrar la ecuación periódica antes de dividir por los autovalores. Explicar por qué el modo cero es una condición de existencia y unicidad.

## Ensayo con la web

- Cambiar a Exponer para mostrar los laboratorios sin la extensión escrita.
- Flechas izquierda/derecha cambian capítulos cuando el foco no está en un control. F activa pantalla completa.
- Pausar las animaciones antes de explicar una identidad. Los controles se reinician al cambiar de capítulo o modo.
- La FFT de entrada personalizada acepta exactamente N números reales separados por comas. Los modos predefinidos también incluyen datos complejos.
- En Poisson, elegir fuente trigonométrica, N=64 y operador espectral. Cambiar a FD, luego N=128. Señalar residual y error por separado.
- Añadir constante y desactivar la proyección: la fuente incompatible debe bloquear la resolución. Reactivar la proyección y declarar el cambio del segundo miembro.
- En precisión, la referencia recibe el dato ya representable en cada formato. No confundir este error con cuantización inicial.
- En longitudes, se preserva la convolución lineal recortada; no se preserva una DFT de diferente longitud.

## Respaldo local

Antes de la charla, ejecutar `npm ci`, `npm run build` y `npm run preview` en el equipo que se llevará. Comprobar el recorrido completo y los tamaños en el proyector. El paquete contiene tipografía, fórmulas y datos; el servidor local puede mantenerse sin Internet. Abrir los artículos externos antes o guardar copias permitidas por sus licencias.

## Límites que conviene poder explicar

La DFT está bien condicionada en norma euclídea, pero un coeficiente casi nulo puede tener gran error relativo. Los tiempos dependen de la implementación y la máquina. La FFT radix-2 requiere potencias de dos; otras factorizaciones amplían los tamaños. El resultado entrópico tiene un modelo restringido. El residual mide el sistema discreto escogido, mientras que el error de discretización depende de la aproximación de la PDE.
