const catalog=[
 {
  "id": 1,
  "group": "EDO",
  "title": "Del error local a la convergencia global",
  "en": "Convergence theorem for numerical methods for ODEs (easy version, without bootstrapping).",
  "idea": "Imagina dos pasos que arrancan de puntos distintos. La estabilidad controla cuánto se separan. La consistencia mide el error nuevo que aparece incluso al arrancar del punto exacto."
 },
 {
  "id": 2,
  "group": "EDO",
  "title": "Cómo se obtiene RK2 y su error local",
  "en": "Derivation of the 2nd order Runge–Kutta method, derivation of the local error term.",
  "idea": "Una pendiente describe la velocidad inicial. Una segunda pendiente, evaluada tras un avance de Euler, permite recuperar la curvatura que aparece en Taylor."
 },
 {
  "id": 3,
  "group": "Sensibilidad",
  "title": "Adjunto algebraico y derivada de un autovalor",
  "en": "Adjoint method for non-linear algebraic equations and for eigenvalue problems.",
  "idea": "Un cambio de parámetro mueve el estado y, con él, el objetivo. El adjunto calcula ese efecto sobre un objetivo escalar mediante un solo sistema transpuesto."
 },
 {
  "id": 4,
  "group": "Sensibilidad",
  "title": "Adjunto de un problema de valor inicial",
  "en": "Adjoint method for a general ODE initial-value problem.",
  "idea": "El estado avanza desde el dato inicial. El adjunto recorre esa trayectoria hacia atrás para medir cuánto pesa una perturbación en cada instante sobre el objetivo final."
 },
 {
  "id": 5,
  "group": "EDO",
  "title": "ETD–RK2 por variación de constantes",
  "en": "Exponential time differencing. Derivation of ETD-RK2 numerical scheme.",
  "idea": "Si conocemos el efecto exacto de la parte lineal, podemos incorporarlo en cada paso. Para la parte no lineal basta aproximar cómo cambia entre el inicio y el final del paso."
 },
 {
  "id": 6,
  "group": "Estabilidad",
  "title": "Dahlquist, Euler y Euler hacia atrás",
  "en": "Dahlquist equation, stability analysis for Euler and backward Euler methods.",
  "idea": "Cuando la solución exacta decae, ¿qué pasos hacen que la aproximación también decaiga? En la ecuación de Dahlquist basta mirar el módulo de un único número."
 },
 {
  "id": 7,
  "group": "Métodos espectrales",
  "title": "De una EDP periódica a un sistema de EDO",
  "en": "Spectral discretization of PDEs via Fourier series. Solution of the resulting ODE.",
  "idea": "Una onda de Fourier conserva su forma al derivarla. Por eso las derivadas espaciales se convierten en multiplicaciones y las incógnitas que evolucionan son las amplitudes de las ondas."
 },
 {
  "id": 8,
  "group": "Autovalores",
  "title": "Rayleigh e iteración inversa",
  "en": "Rayleigh quotient iterations combined with inverse iteration and their convergence rate.",
  "idea": "Un vector cercano al autovector da un desplazamiento muy preciso. Al resolver el sistema desplazado, la componente en la dirección buscada se amplifica mucho más que las demás."
 },
 {
  "id": 9,
  "group": "Raíces de polinomios",
  "title": "Construir una sucesión de Sturm",
  "en": "Sturm sequences. Construction of a Sturm sequence by the modified Euclidean algorithm.",
  "idea": "Al dividir dos polinomios, guardamos el opuesto del resto. Ese signo obliga a que los vecinos de un término que vale cero tengan signos contrarios. De ahí sale el conteo de Sturm."
 },
 {
  "id": 10,
  "group": "Raíces de polinomios",
  "title": "Localizar raíces con el teorema de Sturm",
  "en": "Sturm's theorem on polynomial root localization.",
  "idea": "Al mover un punto de izquierda a derecha, los ceros de los polinomios intermedios conservan el número de cambios de signo. Cada raíz del polinomio inicial hace desaparecer exactamente uno."
 },
 {
  "id": 11,
  "group": "Diferencias finitas",
  "title": "Principio del máximo discreto y unicidad",
  "en": "Discrete maximum principle for elliptic equations. Uniqueness of the finite-difference solution.",
  "idea": "En un nodo interior de valor máximo, cada diferencia «centro menos vecino» es no negativa. Si su suma ponderada tiene que ser menor o igual que cero, todas deben ser cero."
 },
 {
  "id": 12,
  "group": "Diferencias finitas",
  "title": "Poisson con cinco puntos converge en orden dos",
  "en": "Convergence of the finite-difference method for Poisson with a five-point stencil and Dirichlet data.",
  "idea": "Taylor mide cuánto falla la EDP al sustituir la solución exacta en la malla. Una función cuadrática convierte ese defecto local en una cota del error válida a la vez en todos los nodos."
 }
];
