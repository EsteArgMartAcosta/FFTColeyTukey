// Each prompt targets one move that can be defended aloud at the board.
const practice = [
{
 name:"Convergencia de un paso", tag:"Ecuaciones diferenciales", formula:"Eₙ₊₁ ≤ (1 + hL)Eₙ + Chᵖ⁺¹", lab:"Acumulación del defecto",
 cards:[
 ["¿Qué comparas para medir el defecto de un solo paso?","La solución exacta en tₙ₊₁ y el paso numérico iniciado en y(tₙ). Si se inicia en Yₙ, entra también el error heredado."],
 ["¿Qué término sumas y restas en la demostración?","El paso numérico iniciado en y(tₙ). Así aparecen el defecto y una diferencia de pasos a la que puedes aplicar estabilidad."],
 ["¿Dónde se pierde una potencia de h?","En tiempo T hay T/h pasos. Cada defecto O(hᵖ⁺¹) se amplifica a lo sumo por exp(LT), de modo que la suma es O(hᵖ)."],
 ["¿Qué cambia si L = 0?","La suma geométrica tiene n términos iguales a uno. La cota directa es Eₙ ≤ E₀ + nChᵖ⁺¹ ≤ E₀ + CThᵖ."]]},
{
 name:"Runge–Kutta de orden dos", tag:"Ecuaciones diferenciales", formula:"b₁ + b₂ = 1 · b₂c = ½",lab:"Ver el orden de Heun",
 cards:[
 ["¿De dónde salen las dos condiciones de orden?","Iguala los coeficientes de hf y h²(fₜ + fᵧf) con los del Taylor exacto. Resulta b₁ + b₂ = 1 y b₂c = 1/2."],
 ["¿Qué cambia al derivar dos veces sobre la recta de Euler?","La dirección v = f(t,y) se mantiene fija. Aparece B, mientras que la trayectoria exacta tiene tercera derivada B + fᵧA, con A = fₜ + fᵧf."],
 ["¿Cómo distingues Heun y punto medio en esta familia?","Heun toma c = 1 y promedia ambas pendientes. Punto medio toma c = 1/2 y usa solo la pendiente intermedia. Ambos tienen orden global dos."],
 ["Calcula el primer término de exacta menos Heun para y′ = λy.","Con z = hλ, resta 1 + z + z²/2 a exp(z). El primer término del defecto es yz³/6."]]},
{
 name:"Adjunto algebraico",tag:"Sensibilidad",formula:"Fₓᵀz = Jₓ",lab:"Sensibilidad de una raíz",
 cards:[
 ["¿Qué hipótesis permite diferenciar F(x(p),p) = 0?","F es C¹ y Fₓ es invertible en la solución. El teorema de la función implícita da una rama diferenciable del estado."],
 ["¿Por qué un solo adjunto sirve para muchos parámetros?","Fₓᵀz = Jₓ depende del estado y del objetivo escalar. Tras resolverlo una vez, cada componente es Jₚⱼ − zᵀFₚⱼ."],
 ["¿Qué función cumple el autovector izquierdo?","Multiplicar por wᵀ cancela los términos con la derivada del autovector derecho, porque wᵀA = λwᵀ."],
 ["Si wᵀv ≠ 1, ¿cómo escribes la derivada de un autovalor simple?","La derivada es (wᵀA′v)/(wᵀv). Para una matriz real simétrica puedes tomar w = v y normalizar v."]]},
{
 name:"Adjunto de una EDO",tag:"Sensibilidad",formula:"−q′ = fₓᵀq + Wₓ",lab:"Un parámetro en el dato inicial",
 cards:[
 ["¿Qué operación hace aparecer los dos extremos del intervalo?","Integrar por partes el término con δẋ. El borde es b(T)ᵀδx(T) − b(0)ᵀδx(0), con b = Hẋᵀλ."],
 ["¿Por qué resuelves el adjunto hacia atrás?","La variación del costo terminal fija q(T) = Φₓ. Los coeficientes dependen de la trayectoria del estado, que se obtiene hacia adelante."],
 ["¿Dónde entra un dato inicial dependiente del parámetro?","Aporta x₀,ₚᵀ q(0) al gradiente. Omitirlo pierde el efecto del parámetro que entra antes del primer paso."],
 ["Para x′ = ax, x(0) = b, J = x(T), ¿cuánto vale Jₐ?","q(t) = exp(a(T−t)) y x(t) = b exp(at). Como qx es constante, Jₐ = ∫ qx dt = Tb exp(aT)."]]},
{
 name:"Integración exponencial",tag:"Ecuaciones diferenciales",formula:"a = exp(hC)Yₙ + hφ₁(hC)Fₙ",lab:"El peso de la fuerza",
 cards:[
 ["¿Cómo obtienes la identidad de variación de constantes?","Multiplica por exp(−tC), deriva el producto e integra. Al despejar, la fuerza queda ponderada por exp((h−s)C)."],
 ["¿Qué extrapola el predictor a?","Congela la fuerza no lineal en Fₙ e integra ese valor con el peso exponencial. Desde el estado exacto, el error del predictor es O(h²)."],
 ["¿Por qué aparece φ₂ y cuál es su valor en cero?","La pendiente de la interpolación lineal de la fuerza pesa s/h. Tras cambiar a θ = s/h, φ₂(z) = ∫₀¹ exp((1−θ)z)θ dθ, y φ₂(0) = 1/2."],
 ["¿Qué método recuperas con C = 0? ¿Y con F = 0?","Con C = 0, φ₁ = 1 y φ₂ = 1/2, luego se obtiene Heun. Con F = 0 se aplica exactamente exp(hC)."]]},
{
 name:"Estabilidad de Dahlquist",tag:"Ecuaciones diferenciales",formula:"Rᴱ(z) = 1 + z",lab:"Cruzar el borde de estabilidad",
 cards:[
 ["¿Qué significan los tres casos del módulo de R?","Para datos iniciales no nulos, |R| < 1 da decaimiento, |R| = 1 conserva amplitud y |R| > 1 produce crecimiento por paso."],
 ["¿Qué región describe |1 + z| ≤ 1?","El disco cerrado de radio uno centrado en −1 del plano complejo. Para λ real negativa, la amplitud queda acotada cuando h ≤ 2/|λ|."],
 ["¿Por qué Euler hacia atrás es A-estable?","Si Re z ≤ 0, entonces |1−z| ≥ 1 y |1/(1−z)| ≤ 1. El argumento incluye el semiplano izquierdo entero."],
 ["Con λ = −10 y h = 0,2, ¿Euler explícito decae?","z = −2 y el factor es −1. Los valores alternan de signo y mantienen la amplitud aunque la solución exacta decae."]]},
{
 name:"Discretización de Fourier",tag:"Métodos espectrales",formula:"cₖ′ = −νκₖ²cₖ",lab:"Descomponer el calor en modos",
 cards:[
 ["¿Por qué proyectar sobre un modo elimina los demás?","En un período completo, la integral normalizada de eₘ por el conjugado de eₖ es δₘₖ. Es la ortogonalidad de Fourier."],
 ["¿Qué ocurre con el modo cero en la ecuación del calor?","κ₀ = 0 y c₀′ = 0. El promedio se conserva y los modos no constantes se amortiguan para ν > 0."],
 ["¿Por qué un producto en x acopla los modos?","El producto de las ondas de índices m y ℓ tiene índice m + ℓ. El coeficiente k del producto suma todos los pares con m + ℓ = k."],
 ["En Kuramoto–Sivashinsky, ¿cuándo evalúas N(a) en ETD–RK2?","Una vez calculados todos los predictores aₖ. La convolución Nₖ(a) depende de varios de ellos."]]},
{
 name:"Iteración de Rayleigh",tag:"Álgebra lineal",formula:"tan θ⁺ = O(tan³ θ)",lab:"Observar una iteración cúbica",
 cards:[
 ["¿Por qué el cociente de Rayleigh da error cuadrático en el ángulo?","En una base ortonormal propia, μ−λⱼ es la suma de (λᵢ−λⱼ)|cᵢ|² para i ≠ j. Los pesos transversales suman sen²θ."],
 ["¿Qué aporta el paso de iteración inversa?","Divide cada componente por λᵢ−μ. Cerca de la dirección objetivo la componente j se amplifica mucho más que las restantes."],
 ["¿Qué hipótesis sostienen la cota cúbica local?","Matriz hermitiana, autovalor simple y separado, vector ya próximo y pasos desplazados bien definidos. Si el residuo ya es cero se termina."],
 ["Para A = diag(5,2), ¿cómo cambia el cociente de componentes?","Si el cociente inicial es t = v₂/v₁, tras el paso es −t³. La normalización conserva el cociente y el error angular usa su módulo."]]},
{
 name:"Sucesiones de Sturm",tag:"Raíces de polinomios",formula:"Pⱼ₊₁ = −resto(Pⱼ₋₁, Pⱼ)",lab:"Inspeccionar los signos vecinos",
 cards:[
 ["¿Por qué se guarda el resto con signo opuesto?","La identidad Pⱼ₋₁ = QⱼPⱼ − Pⱼ₊₁ obliga a signos opuestos en los vecinos de un cero intermedio."],
 ["¿Qué impide que dos miembros consecutivos se anulen juntos?","La recurrencia propagaría el cero hasta la última constante no nula. Para un polinomio libre de cuadrados eso es imposible."],
 ["¿Qué haces si el último resto no nulo tiene grado positivo?","Es proporcional a gcd(P,P′). Forma S = P/gcd(P,P′) y construye la cadena para S y S′ para contar raíces distintas."],
 ["Para P = x³−x, ¿cuáles son los dos restos con signo cambiado?","Primero 2x/3, porque el resto ordinario es −2x/3. Después 1, porque el siguiente resto es −1. El resto cero final se descarta."]]},
{
 name:"Localización de raíces",tag:"Raíces de polinomios",formula:"N(a,b) = V(a) − V(b)",lab:"Mover el extremo de un intervalo",
 cards:[
 ["¿Cómo defines V(x) cuando hay ceros en la lista?","Borra las entradas cero y cuenta los cambios de signo entre las entradas restantes. En la versión del teorema usada, los extremos no son raíces de P."],
 ["¿Cuánto cambia V al cruzar una raíz simple de P?","Baja en uno. El par (P,P′) tiene signos contrarios a la izquierda y coincidentes a la derecha."],
 ["¿Por qué un cero intermedio no cambia V?","Sus vecinos no nulos tienen signos opuestos. En ese bloque hay un cambio tanto si la entrada central es positiva como si es negativa."],
 ["Si V(a) = 3, V(m) = 2 y V(b) = 0 sin raíces en los cortes, ¿dónde están las raíces?","Hay una en (a,m) y dos en (m,b). El segundo intervalo aún requiere subdivisión para aislar ambas."]]},
{
 name:"Máximo discreto y unicidad",tag:"Diferencias finitas",formula:"LₕU ≤ 0 ⇒ máx U = máx∂ U",lab:"Propagar un máximo",
 cards:[
 ["Con Lₕ = −Δₕ y LₕU ≤ 0, ¿qué se acota en la frontera?","El máximo. En la estrella usual el centro es a lo sumo el promedio de sus cuatro vecinos."],
 ["¿Cómo obligas a que todos los vecinos repitan el máximo interior?","Cada peso es positivo y cada diferencia máximo menos vecino es no negativa. Su suma es a la vez ≤ 0, por lo que cada diferencia es cero."],
 ["¿Por qué importa la conexión de la malla con la frontera?","Permite propagar el valor máximo de vecino en vecino hasta un nodo de frontera. Una componente aislada perdería ese control."],
 ["¿Cómo pasas del principio del máximo a unicidad?","Resta dos soluciones con los mismos datos. La diferencia y su opuesta tienen operador cero y frontera cero. Ambas son ≤ 0, de modo que la diferencia es cero."]]},
{
 name:"Poisson en cinco puntos",tag:"Diferencias finitas",formula:"‖e‖∞ ≤ ⅛ ‖r‖∞",lab:"Medir el orden de la malla",
 cards:[
 ["¿Qué términos de Taylor se cancelan al sumar vecinos simétricos?","Los de grados uno y tres. Tras restar 2u y dividir por h² queda una aproximación a la segunda derivada con residuo O(h²) para u de clase C⁴."],
 ["¿Qué propiedades debe cumplir la barrera?","Lₕw = 1 dentro, w ≥ 0 en la frontera y una cota uniforme independiente de h. En el cuadrado unidad sirve [x(1−x)+y(1−y)]/4."],
 ["¿Por qué comparas tanto e−γw como −e−γw?","Para γ = ‖r‖∞, ambas tienen operador ≤ 0 y frontera ≤ 0. El principio del máximo da las dos caras de |e| ≤ γw."],
 ["Para u = x⁴, ¿qué residuo da la convención r = Lₕuʰ − f?","La diferencia segunda centrada vale 12x² + 2h², y f = −12x². Al aplicar el signo de Lₕ queda r = −2h²."]]}
];
