export type Chapter = {
  id: string;
  kicker: string;
  title: string;
  subtitle: string;
  minutes: number;
  question: string;
  body: string;
};

const section = (label: string, title: string, body: string) =>
  `<section class="theory-block"><div class="eyebrow">${label}</div><h3>${title}</h3>${body}</section>`;
const proof = (title: string, body: string) =>
  `<details><summary>${title}</summary><div class="proof-content">${body}</div></details>`;
const note = (body: string) => `<aside class="note">${body}</aside>`;

export const chapters: Chapter[] = [
  {
    id: 'overview', kicker: 'UN ATLAS INTERACTIVO · IMPA', title: 'La estructura cambia el cálculo.',
    subtitle: 'De una matriz densa a una red de operaciones. Una exploración matemática del algoritmo Cooley–Tukey.',
    minutes: 2, question: '¿Qué estructura permite calcular exactamente la misma transformación con menos operaciones?', body: ''
  },
  {
    id: 'roots', kicker: '01 · LA GEOMETRÍA DE LA DFT', title: 'Una base hecha de giros.',
    subtitle: 'Las raíces de la unidad convierten muestras en coordenadas de frecuencia. La ortogonalidad hace posible regresar.',
    minutes: 5, question: '¿Por qué las oscilaciones discretas forman una base ortogonal?',
    body: section('DEFINICIÓN', 'Una convención, de principio a fin', String.raw`
      <p>Trabajamos con \(N\geq1\), índices \(0,\ldots,N-1\) y datos \(x\in\mathbb C^N\). El factor elemental recorre el círculo unitario en sentido horario:</p>
      \[\omega_N=e^{-2\pi i/N},\qquad X_k=\sum_{n=0}^{N-1}x_n\omega_N^{nk}.\]
      <p>La matriz \(F_N=(\omega_N^{kn})_{k,n}\) representa la DFT: \(X=F_Nx\). La transformada inversa utiliza el signo positivo y un factor \(1/N\). La FFT es una familia de algoritmos para evaluar esta transformación finita.</p>
      <p>Si \(p(z)=\sum_{n=0}^{N-1}x_nz^n\), entonces \(X_k=p(\omega_N^k)\). La DFT también es la evaluación simultánea de un polinomio en una malla muy simétrica.</p>
    `) + section('INTUICIÓN', 'Una suma de flechas puede desaparecer', String.raw`
      <p>Para un entero \(q\), los términos \(\omega_N^{qn}\) son vectores de longitud uno. Si \(q\equiv0\pmod N\), todas las flechas apuntan en la misma dirección. En otro caso completan una o varias vueltas y su suma es cero. Cuando \(q\) y \(N\) no son coprimos, algunos puntos se repiten; la cancelación sigue siendo exacta.</p>
      <p>En el laboratorio, distingue la trayectoria de las raíces de la suma acumulada. Una suma numérica del orden del redondeo representa una identidad cuyo valor matemático es exactamente cero.</p>
    `) + section('PROPOSICIÓN', 'Ortogonalidad discreta', String.raw`
      \[\sum_{n=0}^{N-1}\omega_N^{qn}=\begin{cases}N,&q\equiv0\pmod N,\\0,&q\not\equiv0\pmod N.\end{cases}\]
    ` + proof('Demostración · una serie geométrica', String.raw`
      <p>Si \(q\equiv0\pmod N\), cada término vale uno. En otro caso, \(r=\omega_N^q\neq1\) y \(r^N=1\). Por tanto,</p>
      \[(1-r)\sum_{n=0}^{N-1}r^n=1-r^N=0.\]
      <p>Podemos dividir por \(1-r\), de modo que la suma es cero. Esta prueba incluye todos los tamaños \(N\), sin ninguna hipótesis de primalidad.</p>
    `)) + section('CONSECUENCIA', 'Inversión, energía y condicionamiento', String.raw`
      <p>El producto escalar hermitiano es \(\langle x,y\rangle=\sum_n\overline{x_n}y_n\). Aplicando la identidad anterior a dos columnas de \(F_N\):</p>
      \[F_N^*F_N=NI,\qquad F_N^{-1}=\frac1N F_N^*.\]
      \[x_n=\frac1N\sum_{k=0}^{N-1}X_ke^{2\pi i nk/N},\qquad \|X\|_2^2=N\|x\|_2^2.\]
      <p>La matriz \(U_N=F_N/\sqrt N\) es unitaria. Todos los valores singulares de \(F_N\) son \(\sqrt N\), así que \(\kappa_2(F_N)=\kappa_2(U_N)=1\).</p>
    ` + proof('Demostración · calcular una entrada de la matriz producto', String.raw`
      \[(F_N^*F_N)_{j,k}=\sum_{n=0}^{N-1}\overline{\omega_N^{nj}}\omega_N^{nk}=\sum_{n=0}^{N-1}\omega_N^{n(k-j)}=N\delta_{jk}.\]
      <p>La fórmula de inversión se obtiene multiplicando por \(F_N^*/N\). Además, \(\|F_Nx\|_2^2=x^*F_N^*F_Nx=N\|x\|_2^2\), que es Parseval con nuestra normalización.</p>
    `)) + note(String.raw`<strong>Qué garantiza este resultado.</strong> El condicionamiento es excelente en norma euclídea. No garantiza precisión relativa en un coeficiente individual cuyo valor es casi cero, ni certifica por sí solo la estabilidad de cualquier implementación.`)
  },
  {
    id: 'factor', kicker: '02 · EL ARGUMENTO CENTRAL', title: 'Factorizar el tamaño. Revelar la estructura.',
    subtitle: 'La velocidad aparece al reorganizar una suma finita. Ninguna aproximación es necesaria para obtener la identidad.',
    minutes: 17, question: '¿Cómo se convierte una DFT grande en varias DFT pequeñas y factores de giro?',
    body: section('TEOREMA', 'Cooley–Tukey para un tamaño compuesto', String.raw`
      <p>Sean \(N=N_1N_2\), con \(N_1,N_2\geq2\). Reescribimos los índices de entrada y salida de maneras distintas:</p>
      \[n=a+N_1b,\quad 0\leq a<N_1,\;0\leq b<N_2,\]
      \[k=c+N_2d,\quad 0\leq c<N_2,\;0\leq d<N_1.\]
      <p>Cada índice original aparece exactamente una vez. Entonces:</p>
      \[\boxed{X_{c+N_2d}=\sum_{a=0}^{N_1-1}\omega_{N_1}^{ad}\,\omega_N^{ac}\!\sum_{b=0}^{N_2-1}x_{a+N_1b}\omega_{N_2}^{bc}.}\]
      <p>El algoritmo realiza \(N_1\) transformadas de longitud \(N_2\), multiplica por los factores \(\omega_N^{ac}\), y realiza \(N_2\) transformadas de longitud \(N_1\). Los factores <em>twiddle</em> conectan las dos escalas.</p>
    ` + proof('Demostración completa · seguir los índices', String.raw`
      <p>La expansión del exponente es</p>
      \[(a+N_1b)(c+N_2d)=ac+aN_2d+N_1bc+Nbd.\]
      <p>El último término produce \(\omega_N^{Nbd}=1\). Las identidades \(\omega_N^{N_1}=\omega_{N_2}\) y \(\omega_N^{N_2}=\omega_{N_1}\) dan</p>
      \[\omega_N^{nk}=\omega_N^{ac}\omega_{N_1}^{ad}\omega_{N_2}^{bc}.\]
      <p>Al sustituir y agrupar las sumas finitas obtenemos la fórmula. La suma interior no depende de \(d\), por lo que se calcula una vez y se reutiliza para las \(N_1\) salidas correspondientes.</p>
      <p>No se ha utilizado que \(N_1\) y \(N_2\) sean coprimos. La descomposición funciona, por ejemplo, para \(16=4\cdot4\). Otros algoritmos basados en reindexaciones por el teorema chino del resto sí introducen esa condición; son factorizaciones diferentes.</p>
    `)) + section('EJEMPLO', 'Doce entradas: tres por cuatro', String.raw`
      <p>Con \(N_1=3\) y \(N_2=4\), las primeras transformadas reciben las secuencias</p>
      \[(x_0,x_3,x_6,x_9),\quad(x_1,x_4,x_7,x_{10}),\quad(x_2,x_5,x_8,x_{11}).\]
      <p>Llamemos \(A_{a,c}\) a sus resultados. Multiplicamos cada entrada por \(\omega_{12}^{ac}\) y transformamos cada columna en la dirección \(a\). La posición \((c,d)\) se devuelve al índice \(k=c+4d\). El laboratorio permite inspeccionar estas tres matrices y compararlas con la DFT directa.</p>
    `) + section('CASO RADIX-2', 'Una separación que se repite', String.raw`
      <p>Para \(N\) par, define las DFT de las entradas pares e impares:</p>
      \[E_k=\sum_{j=0}^{N/2-1}x_{2j}\omega_{N/2}^{jk},\qquad O_k=\sum_{j=0}^{N/2-1}x_{2j+1}\omega_{N/2}^{jk}.\]
      <p>Para \(0\leq k<N/2\), una sola multiplicación \(t=\omega_N^kO_k\) produce dos salidas:</p>
      \[\boxed{X_k=E_k+\omega_N^kO_k,\qquad X_{k+N/2}=E_k-\omega_N^kO_k.}\]
    ` + proof('Demostración · por qué la segunda salida lleva un signo menos', String.raw`
      <p>Separando pares e impares en la definición de la DFT:</p>
      \[X_k=\sum_jx_{2j}\omega_N^{2jk}+\omega_N^k\sum_jx_{2j+1}\omega_N^{2jk}=E_k+\omega_N^kO_k.\]
      <p>Las dos DFT pequeñas tienen período \(N/2\). Por tanto, \(E_{k+N/2}=E_k\) y \(O_{k+N/2}=O_k\). Además, \(\omega_N^{k+N/2}=-\omega_N^k\). Sustituir estas tres identidades produce la segunda salida.</p>
      <p>En lenguaje de polinomios, la misma prueba es \(p(z)=p_e(z^2)+zp_o(z^2)\). Evaluar en \(z\) y en \(-z\) reutiliza las evaluaciones de los dos polinomios pequeños en \(z^2\).</p>
    `)) + section('ESTRUCTURA MATRICIAL', 'Una matriz densa, factores dispersos', String.raw`
      <p>Sea \(P\) la permutación que agrupa primero los índices pares y después los impares, y sea \(D=\operatorname{diag}(1,\omega_N,\ldots,\omega_N^{N/2-1})\). Entonces:</p>
      \[F_N=\begin{bmatrix}I&D\\I&-D\end{bmatrix}(F_{N/2}\oplus F_{N/2})P.\]
      <p>Esta identidad expresa un nivel de la recursión. Al iterar para \(N=2^m\), la matriz densa se descompone en factores con pocas entradas no nulas por fila. La identidad de Cooley–Tukey es exacta en aritmética exacta; los errores de una ejecución provienen de cómo se representan y operan los números.</p>
    `) + note(String.raw`<strong>Complejidad y alcance.</strong> Para \(N=2^m\), \(T(N)=2T(N/2)+\Theta(N)\) da \(\Theta(N\log N)\). Una factorización compuesta aislada no prueba ese orden para cualquier secuencia de tamaños: hay que controlar también el coste de los subproblemas. El análisis se extiende a factorizaciones con radices acotados.`)
  },
  {
    id: 'butterfly', kicker: '03 · DE LA IDENTIDAD AL ALGORITMO', title: 'Una mariposa. Dos salidas.',
    subtitle: 'Sigue una señal a través de la red. Cada valor, cada giro y cada conexión corresponde a una operación calculada.',
    minutes: 8, question: '¿Qué hace exactamente cada etapa y por qué aparece la inversión de bits?',
    body: section('ALGORITMO', 'La ejecución iterativa DIT', String.raw`
      <p>Sea \(N=2^m\). La versión de decimación en tiempo (<em>DIT</em>) utilizada aquí empieza reordenando la entrada mediante inversión de sus \(m\) bits. Después procesa bloques de longitud \(L=2,4,\ldots,N\). Dentro de cada bloque y para \(0\leq j<L/2\):</p>
      \[t=\omega_L^j b,\qquad (a,b)\longmapsto(a+t,a-t).\]
      <p>La primera columna del grafo es la entrada ya permutada. La última está en orden natural de frecuencia. Seleccionar una mariposa permite ver su entrada, su factor de giro y ambas salidas. El cambio de etapa actualiza los valores complejos, no solo el color de las conexiones.</p>
    ` + proof('Por qué invertir los bits reproduce la recursión', String.raw`
      <p>Escribe \(n=(b_{m-1}\cdots b_1b_0)_2\). El primer nivel recursivo separa según \(b_0\): par o impar. El siguiente separa según \(b_1\), y así sucesivamente. El recorrido de las hojas queda ordenado por los bits \(b_0,b_1,\ldots,b_{m-1}\), que es el índice con los bits invertidos.</p>
      <p>Para \(N=8\), el orden inicial es \(0,4,2,6,1,5,3,7\). Las parejas adyacentes son exactamente los subproblemas de longitud dos que se resuelven primero. Agruparlas en bloques cada vez mayores reconstruye las llamadas recursivas en orden inverso.</p>
      <p>Por inducción, tras la etapa \(s\), cada bloque de \(2^s\) posiciones contiene la DFT del subproblema correspondiente, en orden natural dentro del bloque. Para \(s=m\), queda la DFT de toda la entrada.</p>
    `)) + section('CONTEO EXACTO', 'Profundidad y trabajo no son lo mismo', String.raw`
      <p>Hay \(m=\log_2N\) etapas y \(N/2\) mariposas por etapa:</p>
      \[B(N)=\frac N2\log_2N.\]
      <p>Una mariposa estándar requiere un producto complejo y dos sumas complejas, antes de simplificar factores como \(1\), \(-1\) o \(\pm i\). La evaluación directa utiliza \(N^2\) productos y \(N(N-1)\) sumas si se cuentan las fórmulas literalmente. El coste de calcular o almacenar los factores de giro se debe declarar por separado.</p>
      <p>La red tiene profundidad logarítmica, pero una ejecución secuencial realiza todas las mariposas. Las operaciones independientes de una etapa ofrecen paralelismo; el tiempo real también depende de memoria, instrucciones y planificación.</p>
    `) + section('DOS IMPLEMENTACIONES', 'Recursión y recorrido por etapas', String.raw`
      <p>La implementación recursiva sigue la demostración: separar, transformar y combinar. Una versión sencilla que crea nuevos arreglos en cada llamada puede realizar asignaciones y copias adicionales. La versión iterativa puede actualizar un arreglo de trabajo <em>in-place</em> una vez fijado el orden de acceso.</p>
      <p>El atlas conserva las etapas para poder inspeccionarlas. Ese registro pedagógico consume \(O(N\log N)\) memoria, aunque una FFT iterativa que solo guarda el estado corriente puede utilizar \(O(N)\) almacenamiento total. El coste del registro no debe atribuirse al algoritmo mínimo.</p>
    `) + note(String.raw`<strong>Dos permutaciones distintas.</strong> La matriz \(P\) de una sola factorización agrupa pares e impares. La inversión completa de bits reúne todas esas decisiones recursivas. Otras variantes, como DIF o Stockham, organizan las permutaciones de otra manera; la inversión de bits explícita no es una propiedad obligatoria de toda FFT.`)
  },
  {
    id: 'aliasing', kicker: '04 · LO QUE LAS MUESTRAS NO DISTINGUEN', title: 'Distintas ondas. Los mismos puntos.',
    subtitle: 'La FFT calcula la información presente en los datos. El muestreo determina qué frecuencias pueden distinguirse.',
    minutes: 0, question: '¿Cómo pueden dos frecuencias diferentes ser exactamente la misma señal discreta?',
    body: section('IDENTIDAD', 'La frecuencia se lee módulo N', String.raw`
      <p>En la malla \(t_n=2\pi n/N\), para enteros \(k,q\):</p>
      \[e^{i(k+qN)t_n}=e^{ikt_n}e^{2\pi iqn}=e^{ikt_n}.\]
      <p>Por tanto, las frecuencias \(k\) y \(k+qN\) son indistinguibles a partir de esas \(N\) muestras. La gráfica continua cambia; los puntos muestreados coinciden. Es una pérdida de identificabilidad anterior al cálculo de la DFT.</p>
      <p>Para \(N\) par elegimos representantes \(-N/2,\ldots,N/2-1\). El modo de Nyquist satisface \(e^{i\pi n}=e^{-i\pi n}\): sus signos positivo y negativo representan la misma secuencia. Para señales reales, los coeficientes conjugados satisfacen \(X_{N-k}=\overline{X_k}\), con índices tomados módulo \(N\).</p>
    `) + section('DE MUESTRAS A COEFICIENTES', 'La fórmula de aliasing', String.raw`
      <p>Supón que \(f(t)=\sum_{j\in\mathbb Z}\widehat f_j e^{ijt}\) tiene coeficientes absolutamente sumables. Definimos</p>
      \[\widetilde f_k=\frac1N\sum_{n=0}^{N-1}f(t_n)e^{-ikt_n}.\]
      <p>Entonces los coeficientes discretos suman todos los modos continuos de la misma clase residual:</p>
      \[\boxed{\widetilde f_k=\sum_{q\in\mathbb Z}\widehat f_{k+qN}.}\]
    ` + proof('Demostración · usar ortogonalidad dentro de la serie', String.raw`
      <p>La sumabilidad absoluta permite intercambiar la serie con la suma finita. Al sustituir la expansión de \(f\):</p>
      \[\widetilde f_k=\sum_{j\in\mathbb Z}\widehat f_j\left[\frac1N\sum_{n=0}^{N-1}e^{i(j-k)t_n}\right].\]
      <p>El corchete vale uno cuando \(j-k\) es múltiplo de \(N\), y cero en otro caso. Solo sobreviven los índices \(j=k+qN\).</p>
    `)) + section('DISTINCIONES', 'Aliasing, fuga y relleno con ceros', String.raw`
      <p><strong>Aliasing:</strong> diferentes frecuencias producen las mismas muestras. Se controla mediante la elección de la frecuencia de muestreo y, cuando corresponde, filtrado previo.</p>
      <p><strong>Fuga espectral:</strong> una oscilación que no coincide con los bins de una ventana finita reparte su DFT entre varios coeficientes. Depende de la ventana y de cómo se trunca la observación. Puede aparecer aunque la frecuencia esté por debajo de Nyquist.</p>
      <p><strong>Relleno con ceros:</strong> para una secuencia finita, evaluar su DFT a una longitud mayor muestrea más densamente el mismo polinomio de Fourier. Cambia la malla de frecuencias, sin añadir observaciones de la señal original ni deshacer el aliasing.</p>
      <p>En convolución lineal, elegir una longitud \(L\geq n_a+n_b-1\) evita el solapamiento circular. Distintas longitudes suficientes producen la misma convolución al recortar la salida; esa es la comparación válida del experimento de longitudes.</p>
    `) + note(String.raw`<strong>Convención de la demostración.</strong> El control de frecuencias enteras ilustra la identidad exacta módulo \(N\). Una frecuencia no entera requiere interpretar también la ventana de observación y la fuga espectral; no se debe confundir ese efecto con un error de la FFT.`)
  },
  {
    id: 'evidence', kicker: '05 · ANÁLISIS NUMÉRICO', title: 'Medir. Comparar. Saber qué se concluye.',
    subtitle: 'Complejidad, tiempo y error responden preguntas distintas. Los experimentos tienen parámetros, referencias y una procedencia verificable.',
    minutes: 9, question: '¿Qué explica la teoría y qué depende de la implementación y del entorno?',
    body: section('CONDICIONAMIENTO', 'La transformación no amplifica el error relativo normativo', String.raw`
      <p>Si \(X=F_Nx\) y perturbamos los datos a \(x+\delta x\), entonces \(\delta X=F_N\delta x\). Para \(x\neq0\):</p>
      \[\frac{\|\delta X\|_2}{\|X\|_2}=\frac{\|\delta x\|_2}{\|x\|_2}.\]
      <p>Esta igualdad describe el problema matemático. La estabilidad describe cuánto error añade el procedimiento que lo calcula. Una implementación puede deteriorar un problema perfectamente condicionado.</p>
    `) + section('RESULTADO CONDICIONAL', 'Por qué aparece un factor logarítmico', String.raw`
      <p>Considera la factorización normalizada \(U_N=Q_m\cdots Q_1P\), con \(m=\log_2N\), \(Q_s\) unitarias y \(P\) una permutación. Supón que cada etapa calculada satisface, para todo vector intermedio \(v\),</p>
      \[\|\operatorname{fl}(Q_sv)-Q_sv\|_2\leq\eta\|v\|_2.\]
      <p>Si \(\widetilde y\) es el resultado de las \(m\) etapas, entonces:</p>
      \[\frac{\|\widetilde y-U_Nx\|_2}{\|x\|_2}\leq(1+\eta)^m-1.\]
    ` + proof('Demostración · propagar el error entre etapas unitarias', String.raw`
      <p>Escribe \(v_s=Q_sv_{s-1}\) y \(\widetilde v_s=Q_s\widetilde v_{s-1}+e_s\). Por unitariedad, \(\|v_s\|_2=\|x\|_2\), y por la hipótesis local:</p>
      \[\|\widetilde v_s\|_2\leq(1+\eta)\|\widetilde v_{s-1}\|_2\leq(1+\eta)^s\|x\|_2.\]
      <p>Restando las recurrencias y usando \(\|e_s\|_2\leq\eta(1+\eta)^{s-1}\|x\|_2\):</p>
      \[\|\widetilde v_m-v_m\|_2\leq\eta\sum_{s=1}^m(1+\eta)^{s-1}\|x\|_2=\big((1+\eta)^m-1\big)\|x\|_2.\]
      <p>Con el modelo usual de redondeo, una cota local \(\eta\leq\gamma_c=cu/(1-cu)\) conduce a \((1+\eta)^m-1\leq\gamma_{cm}\), si \(cmu<1\). Aquí \(u\) es la unidad de redondeo y \(c\) depende de la implementación y de la precisión de los factores de giro. La desigualdad usa \((1-cu)^m\geq1-mcu\).</p>
      <p>Esta prueba es condicional a la cota local. Obtener \(\eta=O(u)\) exige controlar la aritmética compleja y los giros, además de excluir desbordamiento y subdesbordamiento significativo. No asignamos una constante certificada a los navegadores a partir de esta derivación.</p>
    `)) + section('ESTABILIDAD HACIA ATRÁS', 'Una interpretación en el espacio de entrada', String.raw`
      <p>Define \(\delta x=U_N^*(\widetilde y-U_Nx)\). Entonces \(\widetilde y=U_N(x+\delta x)\) y</p>
      \[\frac{\|\delta x\|_2}{\|x\|_2}=\frac{\|\widetilde y-U_Nx\|_2}{\|U_Nx\|_2}.\]
      <p>Así, un error hacia delante pequeño en norma equivale aquí a un error hacia atrás pequeño. Esta igualdad utiliza la unitariedad; no debe extrapolarse sin cambios a otras normas o transformaciones.</p>
    `) + section('PROTOCOLO EXPERIMENTAL', 'Una referencia independiente y un tiempo bien definido', String.raw`
      <p>El error relativo se evalúa como \(\|X_{\mathrm{calc}}-X_{\mathrm{ref}}\|_2/\|X_{\mathrm{ref}}\|_2\). La referencia usa una DFT directa de alta precisión aplicada a los datos representables del tipo estudiado. Así se separa el error del algoritmo del redondeo inicial de los datos. Para una referencia nula se informa el error absoluto o se trata el caso por separado.</p>
      <p>Los tiempos comparan implementaciones concretas. Una matriz densa preconstruida, una FFT compilada y una biblioteca optimizada tienen costes de preparación distintos. Los metadatos declaran qué se incluye, los tipos numéricos, el número de hilos, las repeticiones y el entorno.</p>
      <p>Las medianas e intervalos intercuartílicos describen las ejecuciones medidas. No son cotas de peor caso ni intervalos de confianza. Las pruebas comprueban casos e invariantes; las demostraciones justifican los resultados generales bajo sus hipótesis.</p>
    `) + note(String.raw`<strong>Cómo leer una curva.</strong> Una recta de referencia \(N\log N\) muestra una escala teórica, no una predicción universal de segundos. Tampoco un error pequeño observado en señales aleatorias demuestra una cota válida para todas las entradas.`)
  },
  {
    id: 'poisson', kicker: '06 · UNA ECUACIÓN EN EL TORO', title: 'Transformar. Dividir. Reconstruir.',
    subtitle: 'La FFT diagonaliza operadores periódicos. Resolver el sistema discreto con precisión es solo una parte del problema.',
    minutes: 9, question: '¿Por qué un residual diminuto puede coexistir con error de discretización visible?',
    body: section('PROBLEMA', 'Poisson periódico y la condición de existencia', String.raw`
      <p>Buscamos una solución periódica de</p>
      \[-\Delta u=f\quad\text{en }\mathbb T^2=[0,2\pi)^2,\qquad\int_{\mathbb T^2}u=0.\]
      <p>Integrar las derivadas segundas en un período muestra que \(\int_{\mathbb T^2}f=0\) es necesario. La media de \(u\) fija la indeterminación por constantes. En series de Fourier, los modos \(e^{i(kx+\ell y)}\) son autofunciones:</p>
      \[-\Delta e^{i(kx+\ell y)}=(k^2+\ell^2)e^{i(kx+\ell y)}.\]
      \[\widehat u_{k,\ell}=\frac{\widehat f_{k,\ell}}{k^2+\ell^2}\quad((k,\ell)\neq(0,0)),\qquad\widehat u_{0,0}=0.\]
    ` + proof('Existencia y unicidad · el modo que no se puede dividir', String.raw`
      <p>Para una fuente suave y periódica de media cero, sus coeficientes decaen suficientemente rápido para que la serie definida por la fórmula produzca una solución suave. Para fuentes menos regulares, la misma construcción se interpreta en los espacios de Sobolev correspondientes.</p>
      <p>Si dos soluciones de media cero existen, su diferencia \(v\) satisface \(-\Delta v=0\). Integración por partes periódica da \(\int|\nabla v|^2=0\). Por tanto, \(v\) es constante, y su media cero implica \(v=0\).</p>
      <p>En el modo \((0,0)\), la ecuación es \(0\cdot\widehat u_{0,0}=\widehat f_{0,0}\). Dividir por un número pequeño artificial ocultaría una incompatibilidad, no resolvería el problema.</p>
    `)) + section('DOS OPERADORES', 'La misma FFT resuelve problemas discretos distintos', String.raw`
      <p>En una malla \(N\times N\), \(h=2\pi/N\), el operador espectral utiliza \(\lambda_{\mathrm{sp}}(k,\ell)=k^2+\ell^2\) sobre los representantes de frecuencia de la malla. El negativo del laplaciano periódico de cinco puntos utiliza</p>
      \[(A_hu)_{j,r}=\frac{4u_{j,r}-u_{j+1,r}-u_{j-1,r}-u_{j,r+1}-u_{j,r-1}}{h^2},\]
      <p>con índices módulo \(N\), y su símbolo es</p>
      \[\lambda_h(k,\ell)=\frac4{h^2}\left(\sin^2\frac{kh}{2}+\sin^2\frac{\ell h}{2}\right).\]
      <p>Los dos operadores son diagonalizados por la DFT bidimensional. Cambiar el denominador cambia el sistema que se resuelve.</p>
    ` + proof('Derivación del símbolo de diferencias finitas', String.raw`
      <p>Aplica el stencil al modo \(u_{j,r}=e^{i(kjh+\ell rh)}\). Los vecinos multiplican ese modo por \(e^{\pm ikh}\) y \(e^{\pm i\ell h}\). El autovalor es</p>
      \[h^{-2}(4-2\cos kh-2\cos\ell h)=4h^{-2}\left(\sin^2\frac{kh}{2}+\sin^2\frac{\ell h}{2}\right).\]
      <p>Para frecuencias \(k,\ell\) fijas y \(h\to0\), la expansión de Taylor produce</p>
      \[\lambda_h=k^2+\ell^2-\frac{h^2}{12}(k^4+\ell^4)+O(h^4).\]
      <p>La aproximación de orden dos se refiere a ese régimen; no es uniforme sobre frecuencias que crecen hasta Nyquist mientras se refina la malla.</p>
    `)) + section('SOLUCIÓN FABRICADA', 'Conocer la respuesta para medir el error', String.raw`
      \[u_*(x,y)=\sin(3x)\cos(2y)+\frac14\cos(5x),\]
      \[f_*(x,y)=13\sin(3x)\cos(2y)+\frac{25}{4}\cos(5x).\]
      <p>Al muestrear una malla que resuelve estos modos, el método espectral reproduce este polinomio trigonométrico salvo redondeo. Las diferencias finitas conservan un error de discretización que decrece al refinar.</p>
      <p>El laboratorio también incluye una solución suave con infinitos modos, obtenida de \(v(x,y)=e^{\cos x+\sin y}\), restándole una constante para fijar su media. Su fuente es</p>
      \[f=(\cos x+\sin y-\sin^2x-\cos^2y)e^{\cos x+\sin y}.\]
      <p>En la malla se fija la media discreta. Si se proyecta la fuente para hacerla compatible, se debe declarar esa proyección: la media muestral de una función de media continua cero puede no ser exactamente cero.</p>
    `) + section('DIAGNÓSTICO', 'Residual, error y costo', String.raw`
      <p>El residual relativo es \(\|A_h\widetilde u-f_h\|_2/\|f_h\|_2\). El error frente a la solución conocida es \(\|\widetilde u-u_*|_h\|_2/\|u_*|_h\|_2\), con la misma convención de media. Son cantidades diferentes: un sistema discreto se puede resolver muy bien y aproximar insuficientemente la ecuación continua.</p>
      <p>Para fuentes sin solución exacta conocida, se informa residual, pero no se inventa un error de solución. Una malla \(N\times N\) requiere \(O(N^2\log N)\) operaciones mediante transformadas por filas y columnas. Si \(M=N^2\) es el total de puntos, el coste es \(O(M\log M)\).</p>
    `) + note(String.raw`<strong>Alcance.</strong> El polinomio trigonométrico fabricado verifica signos, normalización y solver; por sí solo no demuestra convergencia espectral general. La diagonalización presentada utiliza periodicidad, coeficientes constantes y malla uniforme.`)
  },
  {
    id: 'limits', kicker: '07 · LÍMITES Y FRONTERAS', title: '¿Cuánto cálculo es inevitable?',
    subtitle: 'Una cota inferior necesita un modelo. Una implementación rápida necesita entender la máquina.',
    minutes: 5, question: '¿En qué modelo el orden cuasilineal es óptimo, y qué queda por mejorar?',
    body: section('MODELO', 'Mezclar dos coordenadas con una compuerta unitaria', String.raw`
      <p>Consideramos \(N\) registros complejos, aritmética exacta y operaciones que aplican una matriz unitaria \(2\times2\) a dos coordenadas. No se añaden registros auxiliares. La transformación parcial \(M\) permanece unitaria.</p>
      <p>Definimos, con \(0\log_2 0=0\),</p>
      \[\Phi(M)=-\sum_{i,j}|M_{ij}|^2\log_2|M_{ij}|^2.\]
      \[\Phi(I)=0,\qquad\Phi(U_N)=N\log_2N.\]
      <p>Esta entropía describe la matriz de la transformación, no la distribución de amplitudes de una señal particular.</p>
    `) + section('COTA INFERIOR', 'Una compuerta cambia el potencial como máximo dos bits', String.raw`
      <p>Si una compuerta mezcla dos filas, en cada columna conserva \(s_j=|a_j|^2+|b_j|^2\). Para \(s_j>0\), la contribución de esas entradas es</p>
      \[-s_j\log_2s_j+s_jh_2(p_j),\quad p_j=|a_j|^2/s_j,\]
      <p>donde \(0\leq h_2\leq1\). Su variación absoluta es como máximo \(s_j\). Las dos filas tienen norma uno, luego \(\sum_js_j=2\). Por tanto:</p>
      \[|\Delta\Phi|\leq2,\qquad T\geq\frac N2\log_2N.\]
      <p>Es la cota entrópica del modelo de Ailon. La FFT normalizada tiene el mismo orden asintótico. La cuenta exacta de mariposas supone el orden de entrada apropiado; si el modelo cobra las permutaciones, sus swaps también cuentan.</p>
      <p><a href="https://arxiv.org/abs/1305.4745" target="_blank" rel="noreferrer">Leer el artículo y sus hipótesis ↗</a></p>
    `) + section('FRONTERA COMPUTACIONAL', 'La organización de los datos sigue importando', String.raw`
      <p>FFTW separa planificación y ejecución, y adapta la descomposición al hardware. FlashFFTConv estudia cómo reorganizar convoluciones FFT para utilizar unidades matriciales y reducir tráfico de memoria. Estas mejoras no se deducen únicamente del número de operaciones aritméticas.</p>
      <p>La precisión mixta plantea otra pregunta: qué datos, giros y acumulaciones requieren más bits para cumplir una tolerancia de la aplicación. El trabajo de Deveshwar, Rajagopal y Larson utiliza escalamiento y factores cuantizados en experimentos de MRI; se presenta aquí como referencia, no como resultado reproducido en este atlas.</p>
      <p>Una extensión natural consiste en distribuir precisión por etapas y medir el error final de Poisson. Primero habría que controlar el error de discretización y distinguir una emulación numérica de una aceleración medida en hardware.</p>
    `) + note(String.raw`<strong>Lo que la cota no afirma.</strong> No es una cota universal para cualquier modelo computacional ni una predicción de segundos. Cambiar las operaciones permitidas, la memoria auxiliar o el criterio de aproximación requiere volver a examinar el argumento.`)
  },
  {
    id: 'map', kicker: '08 · CONECTAR LAS IDEAS', title: 'Cada resultado tiene un lugar.',
    subtitle: 'Navega por las dependencias del argumento, consulta las fuentes y prepara la defensa matemática de la exposición.',
    minutes: 0, question: '¿Qué resultados sostienen cada algoritmo y cada conclusión numérica?', body: ''
  }
];

export const references: {id: string; authors: string; title: string; year: string; url: string; note: string}[] = [
  {id:'cooley-tukey', authors:'James W. Cooley · John W. Tukey', title:'An Algorithm for the Machine Calculation of Complex Fourier Series', year:'1965', url:'https://doi.org/10.1090/S0025-5718-1965-0178586-1', note:'Artículo central. Mathematics of Computation 19(90), 297–301. Factorización de tamaños compuestos y organización del cálculo. El artículo utiliza signo positivo; el atlas fija signo negativo.'},
  {id:'higham', authors:'Nicholas J. Higham', title:'Accuracy and Stability of Numerical Algorithms, 2nd edition', year:'2002', url:'https://nhigham.com/accuracy-and-stability-of-numerical-algorithms/', note:'Marco de análisis de redondeo, condicionamiento y estabilidad. SIAM. La sección de estabilidad del atlas explicita sus hipótesis locales.'},
  {id:'fftw3', authors:'Matteo Frigo · Steven G. Johnson', title:'The Design and Implementation of FFTW3', year:'2005', url:'https://www.fftw.org/fftw-paper-ieee.pdf', note:'Proceedings of the IEEE 93(2), 216–231. Planificación, descomposición adaptativa y relación entre algoritmo y hardware.'},
  {id:'fftw-accuracy', authors:'FFTW / benchFFT', title:'FFT Accuracy Benchmark Methodology & Comments', year:'Documentación técnica', url:'https://www.fftw.org/accuracy/method.html', note:'Referencia independiente de alta precisión, errores normativos y limitaciones de las comparaciones experimentales. Los comentarios complementarios discuten el cálculo de factores de giro.'},
  {id:'ailon', authors:'Nir Ailon', title:'A Lower Bound for Fourier Transform Computation in a Linear Model Over 2×2 Unitary Gates Using Matrix Entropy', year:'2013', url:'https://arxiv.org/abs/1305.4745', note:'Cota inferior en un modelo restringido. Sustenta el potencial entrópico, con hipótesis distintas de una afirmación universal de optimalidad.'},
  {id:'flashfftconv', authors:'Daniel Y. Fu · Hermann Kumbong · Eric Nguyen · Christopher Ré', title:'FlashFFTConv: Efficient Convolutions for Long Sequences with Tensor Cores', year:'2023 · preprint', url:'https://arxiv.org/abs/2311.05908', note:'Reorganización de convoluciones FFT para unidades matriciales y menor tráfico de memoria. Referencia de investigación; sus benchmarks no se reproducen aquí.'},
  {id:'mixed-precision', authors:'Nikhil Deveshwar · Abhejit Rajagopal · Peder E. Z. Larson', title:'A Mixed Precision FFT with applications in MRI', year:'2026 · versión 2', url:'https://arxiv.org/abs/2512.04317v2', note:'Versión del 17 de febrero de 2026; el registro indica aceptación en ICASSP 2026. Precisión de mantisa, escalamiento por bloques y factores de giro cuantizados.'},
  {id:'scipy-length', authors:'SciPy', title:'scipy.fft.next_fast_len', year:'Documentación', url:'https://docs.scipy.org/doc/scipy/reference/generated/scipy.fft.next_fast_len.html', note:'Longitudes favorables para FFT. El experimento compara la misma convolución lineal usando diferentes longitudes internas suficientes.'}
];

export const defenseQuestions: {question: string; answer: string; chapter: string}[] = [
  {chapter:'roots',question:'¿La DFT aproxima la transformada continua?',answer:'La DFT es una transformación exacta de un vector finito. Su interpretación como aproximación de coeficientes continuos exige un modelo de muestreo, una normalización y condiciones de regularidad o banda limitada. El aliasing explica parte de esa relación.'},
  {chapter:'roots',question:'¿Qué significa que el número de condición sea uno?',answer:'En norma euclídea, la DFT preserva el error relativo de entrada: todos sus valores singulares son iguales. No garantiza un error relativo pequeño en cada coeficiente ni la estabilidad de cualquier código.'},
  {chapter:'factor',question:'¿Por qué Cooley–Tukey no exige factores coprimos?',answer:String.raw`La prueba usa las reindexaciones \(n=a+N_1b\) y \(k=c+N_2d\) y las identidades de raíces. Los factores de giro aparecen precisamente al separar \(ac\). Ninguno de esos pasos necesita coprimalidad.`},
  {chapter:'factor',question:'¿La FFT solo sirve para potencias de dos?',answer:'Radix-2 recursivo necesita una potencia de dos. Cooley–Tukey admite otros tamaños compuestos. Bibliotecas generales combinan varias factorizaciones y algoritmos para longitudes primas; la simple recurrencia radix-2 no demuestra todos esos casos.'},
  {chapter:'butterfly',question:'¿De dónde sale la inversión de bits?',answer:'El recorrido recursivo DIT decide primero el bit menos significativo, luego el siguiente, hasta llegar a las hojas. La implementación iterativa coloca esas hojas en ese orden para combinarlas de abajo arriba.'},
  {chapter:'butterfly',question:'¿Una mariposa cuenta como una operación?',answer:'Es una unidad del grafo. En la fórmula estándar reúne un producto complejo y dos sumas complejas, con simplificaciones posibles. Una comparación aritmética debe declarar cómo cuenta productos, sumas, giros y permutaciones.'},
  {chapter:'aliasing',question:'¿Puede una FFT más precisa eliminar el aliasing?',answer:'No. Dos señales que producen las mismas muestras entregan exactamente el mismo vector de entrada. Es imposible distinguirlas sin información adicional sobre el muestreo o sobre la clase de señales.'},
  {chapter:'aliasing',question:'¿Qué conserva el relleno con ceros?',answer:'Conserva la secuencia finita y evalúa su polinomio de Fourier en una malla más densa. No conserva la DFT como vector de longitud original. En convolución, una longitud suficiente y un recorte adecuado sí conservan la convolución lineal.'},
  {chapter:'evidence',question:'¿Por qué no basta comprobar FFT seguida de IFFT?',answer:'Dos implementaciones pueden compartir errores o convenciones que se compensan. La ida y vuelta es una prueba útil, pero una referencia de alta precisión, casos exactos e invariantes aportan comprobaciones independientes.'},
  {chapter:'evidence',question:String.raw`¿Qué hipótesis esconde la expresión \(O(u\log N)\)?`,answer:'Una cota de error local controlada por la unidad de redondeo, factores de giro suficientemente precisos, ausencia de desbordamiento o subdesbordamiento significativo y una norma especificada. La constante depende de las operaciones implementadas.'},
  {chapter:'poisson',question:'¿Por qué el modo cero es una condición de existencia?',answer:'El laplaciano periódico anula las constantes y la integral de un laplaciano es cero. El modo cero exige que la fuente tenga media cero; fijar la media de la solución elimina la falta de unicidad.'},
  {chapter:'poisson',question:'¿Qué cambia al restar la media de la fuente?',answer:'Se cambia explícitamente el segundo miembro por su proyección sobre las funciones de media cero. Se obtiene un problema compatible, pero no una solución del problema original si la media original era no nula.'},
  {chapter:'poisson',question:'¿Por qué un residual pequeño no prueba precisión respecto de la PDE?',answer:'El residual mide cuánto satisface la solución el sistema discreto elegido. Ese sistema puede tener error de discretización frente al operador continuo. Comparar con una solución fabricada permite medir esa diferencia.'},
  {chapter:'poisson',question:'¿El ejemplo trigonométrico demuestra convergencia espectral?',answer:'Comprueba que se resuelven correctamente modos ya representados por la malla. Una afirmación de convergencia para funciones generales requiere estudiar truncación y aliasing bajo hipótesis de regularidad; conviene incluir una solución con infinitos modos.'},
  {chapter:'limits',question:'¿La cota entrópica prueba que toda FFT es óptima?',answer:'Prueba una cota en un modelo de compuertas unitarias de dos coordenadas, con registros y operaciones especificados. La FFT normalizada coincide con su orden asintótico. Otros modelos, aproximaciones o recursos necesitan argumentos distintos.'},
  {chapter:'evidence',question:'¿Menos operaciones siempre implica menos tiempo?',answer:'No. El tiempo depende también de tráfico de memoria, vectorización, compilación, planificación y paralelismo. Las mediciones pertenecen a un entorno concreto y deben separar preparación de ejecución.'}
];
