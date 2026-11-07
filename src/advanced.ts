import katex from 'katex';
import { fftTrace, poisson2D } from './math';

const ink = '#192d35', coral = '#ee6246', teal = '#2b8c84', gold = '#b48a32';
const esc = (v: unknown) => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const math = (s: string, display = false) => katex.renderToString(s, {displayMode: display, throwOnError: true, output: 'htmlAndMathml'});
const sci = (v: number | null, digits = 2) => v === null ? '—' : !Number.isFinite(v) ? '∞' : v === 0 ? '0' : v.toExponential(digits);
const metric = (label: string, value: string, id = '') => `<div class="metric"><span class="metric-label">${label}</span><strong class="metric-value" ${id ? `id="${id}"` : ''}>${value}</strong></div>`;
const qs = <T extends Element = HTMLElement>(host: HTMLElement, sel: string) => {const el = host.querySelector<T>(sel); if(!el) throw new Error(`Missing lab control ${sel}`); return el;};
const table = (head: string[], rows: (string | number)[][]) => `<div class="table-wrap"><table><thead><tr>${head.map(x=>`<th scope="col">${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
function downloadJson(data: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = 'fft-atlas-results.json'; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
}

interface Timing { median_seconds:number; q25_seconds:number; q75_seconds:number; calls_per_batch:number; batches:number; batch_average_seconds:number[]; }
interface Accuracy { median_relative_l2:number; min_relative_l2:number; max_relative_l2:number; relative_l2_samples:number[]; }
interface Results {
  metadata: {created_utc:string;seed:number;cpu:string;platform:string;python:string;numpy:string;scipy:string;numba:string;mpmath:string;fft_workers:number;timing_scope:string;accuracy_reference:string;[key:string]:unknown};
  timings:{n:number;methods:Record<string,Timing>;matrix_build_seconds_single_observation:number;radix2_plan_seconds_single_observation:number}[];
  accuracy:{n:number;replicates:number;methods:Record<string,Accuracy>}[];
  convolution:{input_lengths:number[];linear_output_length:number;next_fast_len:number;note:string;rows:(Timing&{length:number;agreement_with_fast_length:number})[]};
  poisson:{n:number;method:string;relative_solution_l2:number;relative_residual_l2:number}[];
}
interface Series {label:string;color:string;points:{x:number;y:number;low:number;high:number}[];}

/** Python measurements stay separate from the browser's live simulations. */
export function mountEvidence(host: HTMLElement): () => void {
  const abort = new AbortController(); let active = true; let data:Results|undefined;
  host.innerHTML = `<div class="lab-shell count-lab">
    <div class="lab-header"><div><span class="lab-index">CONTEO TEÓRICO / ARITMÉTICA COMPLEJA</span><h3 class="lab-title">La misma transformación, menos operaciones.</h3></div><span class="chip">Identidades exactas</span></div>
    <div class="lab-controls"><label class="control" style="flex:1">Exponente m <input data-count-m type="range" min="3" max="20" value="10" aria-label="Exponente m para N igual a dos elevado a m" style="min-width:120px;flex:1"><output data-count-m-value>10</output></label><span class="chip" data-count-n>N = 1.024</span></div>
    <div class="metrics" data-count-metrics></div>
    <div class="plot-card" style="background:#fffdf7;color:${ink}"><h4 class="plot-title">Comparación de productos complejos</h4><div data-count-chart></div></div>
    <p class="status-note" data-count-ratio aria-live="polite"></p>
    <p class="lab-caption">Conteo sin simplificar multiplicaciones por raíces triviales: DFT directa, ${math('N^2')} productos y ${math('N(N-1)')} sumas; radix-2, ${math('(N/2)\\log_2 N')} mariposas, cada una con un producto y dos sumas o restas complejas. Se excluye construir los factores de giro y mover los datos. El cociente compara productos contados; no es una aceleración medida.</p>
  </div><div class="lab-shell evidence-lab" style="margin-top:28px">
    <div class="lab-header"><div><span class="lab-index">EXPERIMENTO / CPU</span><h3 class="lab-title">La estructura también se mide.</h3></div><span class="chip" data-state>Cargando datos…</span></div>
    <div class="lab-controls"><div class="segmented" role="group" aria-label="Seleccionar experimento">
      <button class="active" data-mode="time" aria-pressed="true">Tiempo</button><button data-mode="error64" aria-pressed="false">Error · 64 bits</button><button data-mode="error32" aria-pressed="false">Error · 32 bits</button><button data-mode="convolution" aria-pressed="false">Longitudes</button>
    </div><button class="button" data-download disabled>Descargar datos ↗</button></div>
    <p class="status-note" data-provenance>Recuperando los datos de la ejecución reproducible.</p>
    <div class="plot-card" style="background:#fffdf7;color:${ink};"><h4 class="plot-title" data-title>Datos documentados</h4><div data-chart></div><div class="legend" data-legend></div><div class="lab-caption" data-point aria-live="polite">Selecciona un punto del gráfico para inspeccionarlo.</div></div>
    <p class="lab-caption" data-note></p><div class="metrics" data-metrics></div>
    <details><summary>Inspeccionar la tabla y el protocolo</summary><div data-table></div><div data-protocol></div></details>
    <details><summary>Entorno completo y trazabilidad</summary><pre data-metadata style="white-space:pre-wrap;max-height:380px;overflow:auto"></pre></details>
  </div>`;
  const renderCounts = () => {
    const m=Number(qs<HTMLInputElement>(host,'[data-count-m]').value),n=2**m,directProducts=n*n,directSums=n*(n-1),butterflies=n*m/2,fftSums=n*m;
    const count=(v:number)=>v.toLocaleString('es-ES');
    const countValue=(main:number,detail:string)=>`<span style="font-size:clamp(18px,2vw,30px);overflow-wrap:anywhere">${count(main)}</span><small style="display:block;font-size:12px;font-weight:400;margin-top:8px">${detail}</small>`;
    qs<HTMLOutputElement>(host,'[data-count-m-value]').value=String(m);
    qs(host,'[data-count-n]').innerHTML=math(`N=2^{${m}}=${n}`);
    qs(host,'[data-count-metrics]').innerHTML=metric('DFT · productos complejos',countValue(directProducts,`${count(directSums)} sumas complejas`))+metric('FFT · productos complejos',countValue(butterflies,`${count(fftSums)} sumas o restas complejas`))+metric('FFT · mariposas',countValue(butterflies,`${m} etapas · ${count(n/2)} por etapa`));
    const x=(v:number)=>160+Math.log2(v)/40*580;
    let svg='';
    for(let k=0;k<=40;k+=10){const px=160+k/40*580;svg+=`<line x1="${px}" x2="${px}" y1="20" y2="133" stroke="#e3e8df"/><text x="${px}" y="157" text-anchor="middle" fill="${ink}" font-size="12">2<tspan baseline-shift="super" font-size="9">${k}</tspan></text>`;}
    [[directProducts,'DFT directa',coral],[butterflies,'FFT radix-2',teal]].forEach(([v,label,color],i)=>{const y=34+i*57,w=x(Number(v))-160;svg+=`<text x="18" y="${y+21}" fill="${ink}" font-size="15">${label}</text><rect x="160" y="${y}" width="${w}" height="30" rx="4" fill="${color}"/><text x="${Math.min(748,168+w)}" y="${y+21}" fill="${ink}" font-size="12">${Number(v).toExponential(2)}</text>`;});
    qs(host,'[data-count-chart]').innerHTML=`<svg viewBox="0 0 860 185" role="img" aria-label="Conteos de productos complejos DFT y FFT, eje horizontal logarítmico en base dos" style="width:100%;display:block">${svg}<text x="450" y="180" text-anchor="middle" fill="${ink}" font-size="12">Productos complejos · escala logarítmica en base 2</text></svg>`;
    qs(host,'[data-count-ratio]').textContent=`Cociente de productos contados: ${count(directProducts)} / ${count(butterflies)} = ${(directProducts/butterflies).toLocaleString('es-ES',{maximumFractionDigits:2})}. Este número no representa un cociente de tiempos. Las barras usan una escala logarítmica.`;
  };
  qs(host,'[data-count-m]').addEventListener('input',renderCounts,{signal:abort.signal});
  renderCounts();
  const chart=qs(host,'[data-chart]'), point=qs(host,'[data-point]');
  let currentMode = 'time';
  const setPoint = (text:string) => point.textContent = text;
  function render(mode:string) {
    if(!data || !active)return; currentMode=mode;
    host.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>{const on=b.dataset.mode===mode;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
    qs(host,'[data-metrics]').innerHTML='';
    if(mode === 'convolution') {
      const conv=data.convolution, maximum=Math.max(...conv.rows.map(r=>r.q75_seconds));
      qs(host,'[data-title]').textContent='La misma convolución. Tres tamaños internos.';
      qs(host,'[data-legend]').innerHTML=`<span>${math(`L\\geq n_a+n_b-1=${conv.linear_output_length}`)}</span>`;
      chart.innerHTML=`<svg viewBox="0 0 860 300" role="img" aria-label="Medianas de tiempo de convolución para tres longitudes internas" style="width:100%;display:block;background:#fffdf7">${conv.rows.map((r,i)=>{
        const y=45+i*80,w=r.median_seconds/maximum*535;
        return `<text x="30" y="${y+22}" fill="${ink}" font-size="18" font-family="monospace">${r.length.toLocaleString('es')}</text><rect x="155" y="${y}" width="${w}" height="34" rx="4" fill="${i===1?teal:coral}"/><line x1="${155+r.q25_seconds/maximum*535}" x2="${155+r.q75_seconds/maximum*535}" y1="${y+17}" y2="${y+17}" stroke="${ink}" stroke-width="2"/><text x="${165+w}" y="${y+23}" fill="${ink}" font-size="16">${(r.median_seconds*1000).toFixed(3)} ms</text>`;
      }).join('')}</svg>`;
      setPoint('Barras: mediana. Segmentos: cuartiles 25–75 de los promedios de lote.');
      qs(host,'[data-note]').innerHTML=`Se calcula la misma convolución lineal de dos vectores de ${conv.input_lengths[0].toLocaleString('es')} entradas y se recortan las ${conv.linear_output_length.toLocaleString('es')} salidas. Rellenar con ceros cambia la malla de una DFT; aquí preserva la convolución lineal que queremos obtener.`;
      const fastest=conv.rows.reduce((a,b)=>a.median_seconds<b.median_seconds?a:b), first=conv.rows[0];
      qs(host,'[data-metrics]').innerHTML=metric('Longitud más rápida en esta ejecución',fastest.length.toLocaleString('es'))+metric('Cociente observado frente a L mínimo',`${(first.median_seconds/fastest.median_seconds).toFixed(2)}×`)+metric('Señal que se compara','Misma convolución');
      qs(host,'[data-table]').innerHTML=table(['L','Mediana (ms)','Q25 (ms)','Q75 (ms)','Acuerdo con L conveniente'],conv.rows.map(r=>[r.length,(r.median_seconds*1e3).toFixed(5),(r.q25_seconds*1e3).toFixed(5),(r.q75_seconds*1e3).toFixed(5),sci(r.agreement_with_fast_length)]));
      qs(host,'[data-protocol]').innerHTML='<p>El acuerdo entre dos resultados en aritmética binaria64 no es el error frente a aritmética exacta. Los tiempos son observaciones de esta implementación y máquina; no se extrapolan a otro entorno.</p>';
      return;
    }
    const isTime=mode==='time';
    const defs: [string,string,string][] = isTime ? [['dense_precomputed','DFT densa',gold],['radix2_numba','Radix-2 · Numba',coral],['scipy_fft','SciPy FFT',teal]] : mode==='error64' ? [['dense_c128','DFT densa · 64 bits',gold],['radix2_c128','Radix-2 · 64 bits',coral],['scipy_c128','SciPy · 64 bits',teal]] : [['radix2_c64','Radix-2 · 32 bits',coral],['scipy_c64','SciPy · 32 bits',teal]];
    const series:Series[]=defs.map(([key,label,color])=>({label,color,points:isTime?data!.timings.map(r=>({x:r.n,y:r.methods[key].median_seconds*1e6,low:r.methods[key].q25_seconds*1e6,high:r.methods[key].q75_seconds*1e6})):data!.accuracy.map(r=>({x:r.n,y:r.methods[key].median_relative_l2,low:r.methods[key].min_relative_l2,high:r.methods[key].max_relative_l2}))}));
    qs(host,'[data-title]').textContent=isTime?'El tiempo depende del algoritmo y del entorno.':'Error frente a una referencia independiente.';
    qs(host,'[data-legend]').innerHTML=series.map(s=>`<span><i style="display:inline-block;width:18px;height:3px;background:${s.color};margin-right:8px;vertical-align:middle"></i>${s.label}</span>`).join('');
    drawLogChart(chart,series,isTime?'Tiempo por llamada (µs)':'Error relativo ℓ₂',isTime?'µs':'',setPoint,abort.signal);
    qs(host,'[data-note]').innerHTML=isTime?'Escalas logarítmicas. Cada punto es la mediana de los tiempos medios de nueve lotes; las barras muestran el intervalo intercuartílico descriptivo. La matriz densa ya está construida y los kernels ya están compilados.':'Escalas logarítmicas. Mediana y rango de tres señales gaussianas complejas por tamaño. Referencia: DFT directa independiente con 80 dígitos aplicada exactamente a la entrada representable en cada precisión. Estos puntos no son una cota de peor caso.';
    if(isTime) {
      qs(host,'[data-table]').innerHTML=table(['N',...defs.map(d=>`${d[1]} (µs)`)],data.timings.map(r=>[r.n,...defs.map(d=>(r.methods[d[0]].median_seconds*1e6).toFixed(4))]));
      qs(host,'[data-protocol]').innerHTML='<p>Un hilo; calentamiento previo; nueve lotes en orden aleatorio; mediana e intervalo intercuartílico. Se excluyen construcción de la matriz, planificación de radix-2 y compilación. La reserva de la salida sí está incluida. Los costes de construcción y planificación se guardan como observaciones individuales en el JSON. No hay intervalos de confianza.</p>';
      qs(host,'[data-metrics]').innerHTML=metric('Lotes por medición','9')+metric('Hilos FFT',String(data.metadata.fft_workers))+metric('Tamaños medidos',`${data.timings[0].n}–${data.timings.at(-1)!.n}`);
    }else {
      qs(host,'[data-table]').innerHTML=table(['N',...defs.map(d=>d[1])],data.accuracy.map(r=>[r.n,...defs.map(d=>sci(r.methods[d[0]].median_relative_l2,4))]));
      qs(host,'[data-protocol]').innerHTML=`<div class="math-display">${math('\\varepsilon_{\\mathrm{rel}}=\\frac{\\|\\widetilde X-X_{\\mathrm{ref}}\\|_2}{\\|X_{\\mathrm{ref}}\\|_2}',true)}</div><p>Se separa redondeo de la entrada y error del algoritmo: la referencia transforma el mismo dato representable que recibe cada método. Una comparación FFT–IFFT no sustituye esta referencia independiente. ${math('\\kappa_2(F_N)=1')} es una afirmación normativa; no garantiza precisión relativa en un coeficiente casi nulo.</p>`;
      qs(host,'[data-metrics]').innerHTML=metric('Precisión de la referencia','80 dígitos')+metric('Señales por tamaño','3')+metric('Métrica','Error relativo ℓ₂');
    }
  }
  host.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.mode!),{signal:abort.signal}));
  qs(host,'[data-download]').addEventListener('click',()=>{if(data)downloadJson(data);},{signal:abort.signal});
  fetch(`${import.meta.env.BASE_URL}data/results.json`,{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then((d:Results)=>{
    if(!active)return; data=d;
    qs(host,'[data-state]').textContent='Datos reproducidos · Python';
    qs<HTMLButtonElement>(host,'[data-download]').disabled=false;
    const date=new Date(d.metadata.created_utc).toLocaleDateString('es',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
    qs(host,'[data-provenance]').textContent=`Ejecución documentada: ${date} (UTC) · ${d.metadata.cpu} · semilla ${d.metadata.seed}. Las gráficas muestran los datos guardados; abrir esta página no ejecuta Python.`;
    qs(host,'[data-metadata]').textContent=JSON.stringify(d.metadata,null,2);
    render(currentMode);
  }).catch(e=>{if(active&&e.name!=='AbortError'){qs(host,'[data-state]').textContent='Datos no disponibles';qs(host,'[data-provenance]').textContent='No se pudo cargar el archivo de resultados. Comprueba la conexión y vuelve a abrir este capítulo.';chart.innerHTML='<p>Los resultados no se sustituyen por datos de ejemplo.</p>';}});
  return ()=>{active=false;abort.abort();};
}

function drawLogChart(host:HTMLElement,series:Series[],ylabel:string,unit:string,select:(s:string)=>void,signal:AbortSignal) {
  const W=860,H=420,L=80,R=28,T=30,B=58, pts=series.flatMap(s=>s.points);
  const xs=[...new Set(pts.map(p=>p.x))].sort((a,b)=>a-b), xmin=Math.log2(xs[0]),xmax=Math.log2(xs.at(-1)!);
  let ymin=Math.floor(Math.log10(Math.min(...pts.map(p=>Math.max(p.low,Number.MIN_VALUE))))),ymax=Math.ceil(Math.log10(Math.max(...pts.map(p=>p.high))));if(ymin===ymax)ymax++;
  const X=(v:number)=>L+(Math.log2(v)-xmin)/(xmax-xmin)*(W-L-R),Y=(v:number)=>T+(ymax-Math.log10(Math.max(v,Number.MIN_VALUE)))/(ymax-ymin)*(H-T-B);
  let inner='';
  for(let k=ymin;k<=ymax;k++){let y=Y(10**k);inner+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="#dde3dd"/><text x="${L-14}" y="${y+5}" text-anchor="end" font-size="13" fill="${ink}">10<tspan baseline-shift="super" font-size="10">${k}</tspan></text>`;}
  for(const x of xs)inner+=`<line x1="${X(x)}" x2="${X(x)}" y1="${T}" y2="${H-B}" stroke="#edf0e9"/><text x="${X(x)}" y="${H-B+25}" text-anchor="middle" fill="${ink}" font-size="13">${x}</text>`;
  inner+=`<text x="${L}" y="16" fill="${ink}" font-size="13">${esc(ylabel)}</text><text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" fill="${ink}" font-size="13">Número de entradas N</text>`;
  series.forEach((s,si)=>{
    inner+=`<path d="${s.points.map((p,i)=>`${i?'L':'M'}${X(p.x)},${Y(p.y)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5"/>`;
    s.points.forEach((p,pi)=>{const x=X(p.x),y=Y(p.y),hi=Y(p.high),lo=Y(p.low);inner+=`<g><line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${s.color}" stroke-width="1.7"/><line x1="${x-4}" x2="${x+4}" y1="${hi}" y2="${hi}" stroke="${s.color}"/><line x1="${x-4}" x2="${x+4}" y1="${lo}" y2="${lo}" stroke="${s.color}"/><circle data-si="${si}" data-pi="${pi}" tabindex="0" role="button" aria-label="${esc(`${s.label}, N=${p.x}, ${p.y.toPrecision(4)} ${unit}`)}" cx="${x}" cy="${y}" r="6" fill="${s.color}" stroke="#fffdf7" stroke-width="2" style="cursor:pointer"/></g>`;});
  });
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ylabel)} según el tamaño, escalas logarítmicas" style="width:100%;display:block;background:#fffdf7">${inner}</svg>`;
  host.querySelectorAll<SVGCircleElement>('[data-si]').forEach(c=>{const action=()=>{const s=series[Number(c.dataset.si)],p=s.points[Number(c.dataset.pi)];select(`${s.label} · N = ${p.x} · mediana ${p.y.toPrecision(5)} ${unit} · intervalo mostrado [${p.low.toPrecision(4)}, ${p.high.toPrecision(4)}] ${unit}`);};c.addEventListener('mouseenter',action,{signal});c.addEventListener('focus',action,{signal});c.addEventListener('click',action,{signal});c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}},{signal});});
}

function paintHeatmap(canvas:HTMLCanvasElement,values:number[],n:number,sequential=false) {
  canvas.width=n;canvas.height=n;
  const ctx=canvas.getContext('2d');if(!ctx)return 0;
  const maximum=Math.max(...values.map(Math.abs))||1,image=ctx.createImageData(n,n);
  for(let i=0;i<values.length;i++) {
    const t=Math.min(1,Math.abs(values[i])/maximum),a=sequential?Math.sqrt(t):Math.sqrt(t);
    const base=sequential?[19,39,47]:[244,242,235],end=sequential?[176,224,189]:values[i]>=0?[238,98,70]:[43,140,132];
    for(let c=0;c<3;c++)image.data[i*4+c]=Math.round(base[c]+a*(end[c]-base[c]));image.data[i*4+3]=255;
  }
  ctx.putImageData(image,0,0);return maximum;
}

export function mountPoisson(host:HTMLElement):()=>void {
  const abort=new AbortController();let scheduled=0,alive=true;
  host.innerHTML=`<div class="lab-shell poisson-lab"><div class="lab-header"><div><span class="lab-index">APLICACIÓN / ECUACIÓN ELÍPTICA</span><h3 class="lab-title">De frecuencias a una solución.</h3></div><span class="chip">Cálculo en tu navegador</span></div>
    <div class="lab-controls">
      <label class="control">Malla<select data-n aria-label="Tamaño de malla"><option>16</option><option>32</option><option selected>64</option><option>128</option></select></label>
      <label class="control">Operador<select data-operator aria-label="Operador de Poisson"><option value="spectral">Espectral</option><option value="fd">Diferencias finitas</option></select></label>
      <label class="control">Fuente<select data-kind aria-label="Fuente de Poisson"><option value="manufactured">Solución trigonométrica</option><option value="smooth">Solución suave</option><option value="dipole">Dipolo</option></select></label>
      <label class="control"><span>Añadir constante</span><input type="checkbox" data-offset aria-label="Añadir una constante de 0.5 a la fuente"></label>
      <label class="control"><span>Proyectar a media cero</span><input type="checkbox" data-project checked aria-label="Restar la media de la fuente"></label>
    </div>
    <div class="math-display" data-formula></div><p class="status-note" data-status aria-live="polite"></p>
    <div class="plot-grid poisson-fields" style="display:grid;gap:18px">
      <figure class="plot-card" style="margin:0"><figcaption class="plot-title">01 · Fuente utilizada</figcaption><canvas data-source role="img" aria-label="Mapa de la fuente de Poisson" style="width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;border-radius:8px"></canvas><p class="lab-caption" data-source-scale></p></figure>
      <figure class="plot-card" style="margin:0"><figcaption class="plot-title">02 · Espectro de la fuente</figcaption><canvas data-spectrum role="img" aria-label="Magnitud logarítmica del espectro, modo cero en el centro" style="width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;border-radius:8px"></canvas><p class="lab-caption">Magnitud log(1 + |f̂|), frecuencia cero en el centro.</p></figure>
      <figure class="plot-card" style="margin:0"><figcaption class="plot-title">03 · Solución de media cero</figcaption><canvas data-solution role="img" aria-label="Mapa de la solución calculada de Poisson" style="width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;border-radius:8px"></canvas><p class="lab-caption" data-solution-scale></p></figure>
    </div>
    <div class="metrics">${metric('Residual relativo del operador','—','p-residual')}${metric('Error frente a solución conocida','—','p-error')}${metric('Resolución local','—','p-time')}</div>
    <p class="lab-caption" data-explanation></p>
    <details><summary>Qué se calcula y qué significa el error</summary><div data-exact></div><p>El residual mide la satisfacción del <em>operador discreto elegido</em>. El error compara los valores con una solución continua conocida, después de fijar su media discreta. Para el dipolo no se conoce una solución exacta y no se presenta un error de solución.</p><p>En diferencias finitas se aplica el stencil periódico de cinco puntos en espacio físico para comprobar el residual. El caso espectral aplica de nuevo el multiplicador a la solución. Los colores se normalizan de forma independiente en cada campo; sus escalas se indican debajo.</p><p data-leak></p></details>
  </div>`;
  const draw=()=>{
    if(!alive)return;
    const n=Number(qs<HTMLSelectElement>(host,'[data-n]').value),operator=qs<HTMLSelectElement>(host,'[data-operator]').value as 'spectral'|'fd',kind=qs<HTMLSelectElement>(host,'[data-kind]').value as 'manufactured'|'smooth'|'dipole',offset=qs<HTMLInputElement>(host,'[data-offset]').checked?.5:0,project=qs<HTMLInputElement>(host,'[data-project]').checked;
    const start=performance.now(),r=poisson2D(n,operator,kind,offset,project),elapsed=performance.now()-start;
    qs(host,'[data-formula]').innerHTML=math(operator==='spectral'?'\\widehat u_{k,\\ell}=\\frac{\\widehat f_{k,\\ell}}{k^2+\\ell^2},\\qquad(k,\\ell)\\ne(0,0)':'\\lambda_h(k,\\ell)=\\frac4{h^2}\\!\\left(\\sin^2\\frac{\\pi k}{N}+\\sin^2\\frac{\\pi\\ell}{N}\\right),\\quad h=\\frac{2\\pi}{N}',true);
    const status=qs(host,'[data-status]');status.classList.toggle('incompatible',!r.compatible);
    if(!r.compatible) {
      status.innerHTML=`Fuente incompatible: media ${sci(r.mean)}. La integral de un laplaciano periódico es cero. Activa la proyección para resolver explícitamente otro segundo miembro, ${math('f-\\overline f')}.`;
      paintHeatmap(qs<HTMLCanvasElement>(host,'[data-source]'),r.forcing,n);paintHeatmap(qs<HTMLCanvasElement>(host,'[data-spectrum]'),Array(n*n).fill(0),n,true);paintHeatmap(qs<HTMLCanvasElement>(host,'[data-solution]'),Array(n*n).fill(0),n);
      qs(host,'#p-residual').textContent='Sin solución';qs(host,'#p-error').textContent='—';qs(host,'#p-time').textContent='—';qs(host,'[data-source-scale]').textContent='Fuente original incompatible';qs(host,'[data-solution-scale]').textContent='No se ha calculado una solución';qs(host,'[data-explanation]').textContent='La interfaz detiene la resolución: dividir el modo cero no define una solución periódica.';qs(host,'[data-exact]').innerHTML='';qs(host,'[data-leak]').textContent='';return;
    }
    status.innerHTML=`Media original: ${sci(r.mean)}. ${project?`Se resuelve ${math('f-\\overline f')}.`:'Fuente compatible con media cero a la tolerancia de cálculo.'} Se fija ${math('\\widehat u_{0,0}=0')}.`;
    const sourceMax=paintHeatmap(qs<HTMLCanvasElement>(host,'[data-source]'),r.forcing,n),solutionMax=paintHeatmap(qs<HTMLCanvasElement>(host,'[data-solution]'),r.solution,n);
    const shifted=Array.from({length:n*n},(_,i)=>{const y=Math.floor(i/n),x=i%n;return Math.log1p(r.spectrum[((y+n/2)%n)*n+(x+n/2)%n]);});
    paintHeatmap(qs<HTMLCanvasElement>(host,'[data-spectrum]'),shifted,n,true);
    qs(host,'[data-source-scale]').textContent=`Escala propia: −${sourceMax.toPrecision(3)} a +${sourceMax.toPrecision(3)} · coral positivo, verde negativo.`;
    qs(host,'[data-solution-scale]').textContent=`Escala propia: −${solutionMax.toPrecision(3)} a +${solutionMax.toPrecision(3)}.`;
    qs(host,'#p-residual').textContent=sci(r.residual);qs(host,'#p-error').textContent=sci(r.error);qs(host,'#p-time').textContent=`${elapsed.toFixed(1)} ms`;
    qs(host,'[data-explanation]').innerHTML=kind==='manufactured'?'El polinomio trigonométrico está resuelto por esta malla. Su error espectral cercano al redondeo verifica el caso, pero no demuestra convergencia espectral general. Cambia a diferencias finitas y refina la malla para separar residual y discretización.':kind==='smooth'?'La solución suave tiene infinitos modos. Se proyecta la fuente muestreada cuando está activada la media cero; la referencia continua se compara con su media discreta eliminada. El error refleja muestreo, discretización y redondeo.':'El dipolo permite observar cómo el inverso del laplaciano atenúa las frecuencias altas. Solo se informa el residual; no se dispone de una solución exacta para este dato.';
    qs(host,'[data-exact]').innerHTML=kind==='manufactured'?math('u(x,y)=\\sin(3x)\\cos(2y)+\\tfrac14\\cos(5x),\\quad f=13\\sin(3x)\\cos(2y)+\\tfrac{25}{4}\\cos(5x)',true):kind==='smooth'?math('u(x,y)=e^{\\cos x+\\sin y}-\\operatorname{media}(e^{\\cos x+\\sin y})',true):'<p>Fuente dipolar periódica. Los bordes opuestos se identifican.</p>';
    qs(host,'[data-leak]').textContent=`Componente imaginaria residual: ${sci(r.imaginaryLeakage)}. Tiempo local de una única resolución, sin incluir la pintura de los gráficos; no es un benchmark estadístico.`;
  };
  const schedule=()=>{cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(draw);};
  host.querySelectorAll('select,input').forEach(el=>el.addEventListener('change',schedule,{signal:abort.signal}));draw();
  return()=>{alive=false;cancelAnimationFrame(scheduled);abort.abort();};
}

export function mountLimits(host:HTMLElement):()=>void {
  const abort=new AbortController();let timer:ReturnType<typeof setInterval>|undefined;
  host.innerHTML=`<div class="lab-shell entropy-lab"><div class="lab-header"><div><span class="lab-index">LÍMITE / MODELO UNITARIO</span><h3 class="lab-title">Cuánta mezcla crea una mariposa.</h3></div><span class="chip">Entropía de la matriz</span></div>
    <div class="lab-controls"><label class="control">Dimensión<select data-n aria-label="Dimensión de matriz de entropía"><option>8</option><option selected>16</option><option>32</option></select></label><label class="control" style="flex:1">Etapa <input data-stage type="range" min="0" max="4" value="2" aria-label="Etapa FFT de la matriz" style="min-width:120px;flex:1"><output data-stage-value>2 / 4</output></label><button class="button" data-play>Recorrer etapas</button></div>
    <div class="plot-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px;align-items:center">
      <figure class="plot-card"><figcaption class="plot-title">Distribución de |Mᵢⱼ|²</figcaption><canvas data-matrix width="512" height="512" role="img" aria-label="Matriz de módulos cuadrados de la transformación parcial normalizada" style="width:100%;max-width:440px;aspect-ratio:1;display:block;margin:auto"></canvas><p class="lab-caption">Filas: salidas parciales. Columnas: entradas originales. La escala luminosa indica probabilidad 0 → 1.</p></figure>
      <div><div class="math-display">${math('\\Phi(M)=-\\sum_{i,j}|M_{ij}|^2\\log_2|M_{ij}|^2',true)}</div><div class="metrics" style="grid-template-columns:1fr">${metric('Entropía calculada','—','e-phi')}${metric('Entropía al llegar a Fourier','—','e-target')}${metric('Mariposas ejecutadas','—','e-count')}</div><p class="status-note" data-status aria-live="polite"></p></div>
    </div>
    <div class="math-display">${math('|\\Delta\\Phi|\\le2\\quad\\Longrightarrow\\quad \\#\\text{ compuertas}\\ge\\frac{N\\log_2 N}{2}',true)}</div>
    <p class="lab-caption">Modelo: aritmética exacta, N registros complejos y compuertas unitarias 2 × 2. La cota no describe todos los modelos de computación ni predice tiempos de reloj. La permutación inicial tiene entropía cero; el contador muestra mariposas, no posibles swaps de implementación.</p>
    <details><summary>Cómo se obtiene esta matriz</summary><p>Se transforma cada vector de la base canónica con la misma traza FFT del laboratorio. En la etapa s se divide la matriz parcial por ${math('\\sqrt{2^s}')} para normalizar sus mariposas. La intensidad de la celda es el módulo cuadrado de la entrada resultante; no es una probabilidad de la señal de entrada.</p><p>En cada etapa las filas tienen ${math('2^s')} entradas no nulas de módulo ${math('2^{-s/2}')}. Por ello ${math('\\Phi(M_s)=Ns')}. La interfaz calcula el potencial a partir de las entradas, y muestra también el valor teórico para comprobarlos.</p></details>
  </div>`;
  const stop=()=>{if(timer!==undefined){clearInterval(timer);timer=undefined;}qs(host,'[data-play]').textContent='Recorrer etapas';};
  const draw=()=>{
    const n=Number(qs<HTMLSelectElement>(host,'[data-n]').value),m=Math.log2(n),range=qs<HTMLInputElement>(host,'[data-stage]');range.max=String(m);if(+range.value>m)range.value=String(m);const s=+range.value;
    qs<HTMLOutputElement>(host,'[data-stage-value]').value=`${s} / ${m}`;
    const probs=Array(n*n).fill(0) as number[];let phi=0,rowError=0;
    for(let col=0;col<n;col++) {const basis=Array.from({length:n},(_,i)=>({re:i===col?1:0,im:0}));const v=fftTrace(basis).stages[s];for(let row=0;row<n;row++){const p=(v[row].re**2+v[row].im**2)/2**s;probs[row*n+col]=p;if(p>0)phi-=p*Math.log2(p);}}
    const canvas=qs<HTMLCanvasElement>(host,'[data-matrix]'),ctx=canvas.getContext('2d');
    if(ctx) {const w=512,cell=w/n;ctx.fillStyle='#13272f';ctx.fillRect(0,0,w,w);for(let y=0;y<n;y++){rowError=Math.max(rowError,Math.abs(probs.slice(y*n,(y+1)*n).reduce((a,b)=>a+b,0)-1));for(let x=0;x<n;x++){const p=probs[y*n+x],t=Math.sqrt(p);ctx.fillStyle=`rgb(${Math.round(19+167*t)},${Math.round(39+188*t)},${Math.round(47+144*t)})`;ctx.fillRect(x*cell+1,y*cell+1,Math.max(0,cell-2),Math.max(0,cell-2));}}}
    qs(host,'#e-phi').textContent=`${phi.toFixed(3)} bits`;qs(host,'#e-target').textContent=`${n*m} bits`;qs(host,'#e-count').textContent=`${n*s/2} / ${n*m/2}`;
    qs(host,'[data-status]').innerHTML=`Valor teórico ${math(`Ns=${n*s}`)}. Desviación numérica ${sci(Math.abs(phi-n*s))}. Error máximo de suma de fila ${sci(rowError)}.`;
  };
  qs(host,'[data-n]').addEventListener('change',()=>{stop();draw();},{signal:abort.signal});qs(host,'[data-stage]').addEventListener('input',()=>{stop();draw();},{signal:abort.signal});
  qs(host,'[data-play]').addEventListener('click',()=>{if(timer!==undefined){stop();return;}const r=qs<HTMLInputElement>(host,'[data-stage]');r.value='0';draw();qs(host,'[data-play]').textContent='Pausar';timer=setInterval(()=>{if(+r.value>=+r.max){stop();return;}r.value=String(+r.value+1);draw();},850);},{signal:abort.signal});draw();
  return()=>{stop();abort.abort();};
}
