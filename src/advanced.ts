import katex from 'katex';
import { fftTrace, poisson2D } from './math';

const ink = '#c6d9ed', coral = '#6cb8ff', teal = '#55e0ce', gold = '#ffbd73';
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
    <div class="lab-header"><div><span class="lab-index">THEORETICAL COUNT / COMPLEX ARITHMETIC</span><h3 class="lab-title">The same transform. Fewer operations.</h3></div><span class="chip">Exact identities</span></div>
    <div class="lab-controls"><label class="control" style="flex:1">Exponent m <input data-count-m type="range" min="3" max="20" value="10" aria-label="Exponent m for N equal to two to the power m" style="min-width:120px;flex:1"><output data-count-m-value>10</output></label><span class="chip" data-count-n>N = 1,024</span></div>
    <div class="metrics" data-count-metrics></div>
    <div class="plot-card" style="background:#081726;color:${ink}"><h4 class="plot-title">Complex multiplication counts</h4><div data-count-chart></div></div>
    <p class="status-note" data-count-ratio aria-live="polite"></p>
    <p class="lab-caption">Counts before simplifying products by trivial roots: direct DFT, ${math('N^2')} products and ${math('N(N-1)')} additions; radix-2, ${math('(N/2)\\log_2 N')} butterflies, each with one complex product and two complex additions or subtractions. Twiddle construction and data movement are excluded. The ratio compares multiplication counts; it is not a measured speedup.</p>
  </div><div class="lab-shell evidence-lab" style="margin-top:28px">
    <div class="lab-header"><div><span class="lab-index">EXPERIMENT / CPU</span><h3 class="lab-title">Structure can be measured.</h3></div><span class="chip" data-state>Loading data…</span></div>
    <div class="lab-controls"><div class="segmented" role="group" aria-label="Select experiment">
      <button class="active" data-mode="time" aria-pressed="true">Time</button><button data-mode="error64" aria-pressed="false">Error · 64 bits</button><button data-mode="error32" aria-pressed="false">Error · 32 bits</button><button data-mode="convolution" aria-pressed="false">Lengths</button>
    </div><button class="button" data-download disabled>Download data ↗</button></div>
    <p class="status-note" data-provenance>Loading measurements from the reproducible run.</p>
    <div class="plot-card" style="background:#081726;color:${ink};"><h4 class="plot-title" data-title>Documented measurements</h4><div data-chart></div><div class="legend" data-legend></div><div class="lab-caption" data-point aria-live="polite">Select a chart point to inspect its values.</div></div>
    <p class="lab-caption" data-note></p><div class="metrics" data-metrics></div>
    <details><summary>Inspect the table and protocol</summary><div data-table></div><div data-protocol></div></details>
    <details><summary>Full environment and provenance</summary><pre data-metadata style="white-space:pre-wrap;max-height:380px;overflow:auto"></pre></details>
  </div>`;
  const renderCounts = () => {
    const m=Number(qs<HTMLInputElement>(host,'[data-count-m]').value),n=2**m,directProducts=n*n,directSums=n*(n-1),butterflies=n*m/2,fftSums=n*m;
    const count=(v:number)=>v.toLocaleString('en-US');
    const countValue=(main:number,detail:string)=>`<span style="font-size:clamp(18px,2vw,30px);overflow-wrap:anywhere">${count(main)}</span><small style="display:block;font-size:12px;font-weight:400;margin-top:8px">${detail}</small>`;
    qs<HTMLOutputElement>(host,'[data-count-m-value]').value=String(m);
    qs(host,'[data-count-n]').innerHTML=math(`N=2^{${m}}=${n}`);
    qs(host,'[data-count-metrics]').innerHTML=metric('DFT · complex products',countValue(directProducts,`${count(directSums)} complex additions`))+metric('FFT · complex products',countValue(butterflies,`${count(fftSums)} complex additions or subtractions`))+metric('FFT · butterflies',countValue(butterflies,`${m} stages · ${count(n/2)} per stage`));
    const x=(v:number)=>160+Math.log2(v)/40*580;
    let svg='';
    for(let k=0;k<=40;k+=10){const px=160+k/40*580;svg+=`<line x1="${px}" x2="${px}" y1="20" y2="133" stroke="#234156"/><text x="${px}" y="157" text-anchor="middle" fill="${ink}" font-size="12">2<tspan baseline-shift="super" font-size="9">${k}</tspan></text>`;}
    [[directProducts,'Direct DFT',coral],[butterflies,'FFT radix-2',teal]].forEach(([v,label,color],i)=>{const y=34+i*57,w=x(Number(v))-160;svg+=`<text x="18" y="${y+21}" fill="${ink}" font-size="15">${label}</text><rect x="160" y="${y}" width="${w}" height="30" rx="4" fill="${color}"/><text x="${Math.min(748,168+w)}" y="${y+21}" fill="${ink}" font-size="12">${Number(v).toExponential(2)}</text>`;});
    qs(host,'[data-count-chart]').innerHTML=`<svg viewBox="0 0 860 185" role="img" aria-label="DFT and FFT complex multiplication counts, base-two logarithmic horizontal axis" style="width:100%;display:block">${svg}<text x="450" y="180" text-anchor="middle" fill="${ink}" font-size="12">Complex products · base-2 logarithmic scale</text></svg>`;
    qs(host,'[data-count-ratio]').textContent=`Ratio of multiplication counts: ${count(directProducts)} / ${count(butterflies)} = ${(directProducts/butterflies).toLocaleString('en-US',{maximumFractionDigits:2})}. This number is not a timing ratio. The bars use a logarithmic scale.`;
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
      qs(host,'[data-title]').textContent='The same convolution. Three internal lengths.';
      qs(host,'[data-legend]').innerHTML=`<span>${math(`L\\geq n_a+n_b-1=${conv.linear_output_length}`)}</span>`;
      chart.innerHTML=`<svg viewBox="0 0 860 300" role="img" aria-label="Median convolution times for three internal lengths" style="width:100%;display:block;background:#081726">${conv.rows.map((r,i)=>{
        const y=45+i*80,w=r.median_seconds/maximum*535;
        return `<text x="30" y="${y+22}" fill="${ink}" font-size="18" font-family="monospace">${r.length.toLocaleString('en-US')}</text><rect x="155" y="${y}" width="${w}" height="34" rx="4" fill="${i===1?teal:coral}"/><line x1="${155+r.q25_seconds/maximum*535}" x2="${155+r.q75_seconds/maximum*535}" y1="${y+17}" y2="${y+17}" stroke="${ink}" stroke-width="2"/><text x="${165+w}" y="${y+23}" fill="${ink}" font-size="16">${(r.median_seconds*1000).toFixed(3)} ms</text>`;
      }).join('')}</svg>`;
      setPoint('Bars: median. Segments: 25th–75th percentiles of batch averages.');
      qs(host,'[data-note]').innerHTML=`The same linear convolution is computed for two vectors with ${conv.input_lengths[0].toLocaleString('en-US')} entries; the output is cropped to ${conv.linear_output_length.toLocaleString('en-US')} samples. Zero padding changes the DFT grid; here it preserves the intended linear convolution.`;
      const fastest=conv.rows.reduce((a,b)=>a.median_seconds<b.median_seconds?a:b), first=conv.rows[0];
      qs(host,'[data-metrics]').innerHTML=metric('Fastest length in this run',fastest.length.toLocaleString('en-US'))+metric('Observed ratio against minimum L',`${(first.median_seconds/fastest.median_seconds).toFixed(2)}×`)+metric('Compared output','Same convolution');
      qs(host,'[data-table]').innerHTML=table(['L','Median (ms)','Q25 (ms)','Q75 (ms)','Agreement with fast length'],conv.rows.map(r=>[r.length,(r.median_seconds*1e3).toFixed(5),(r.q25_seconds*1e3).toFixed(5),(r.q75_seconds*1e3).toFixed(5),sci(r.agreement_with_fast_length)]));
      qs(host,'[data-protocol]').innerHTML='<p>Agreement between two binary64 results is not the error against exact arithmetic. These timings describe this implementation and machine; they do not establish performance in another environment.</p>';
      return;
    }
    const isTime=mode==='time';
    const defs: [string,string,string][] = isTime ? [['dense_precomputed','Dense DFT',gold],['radix2_numba','Radix-2 · Numba',coral],['scipy_fft','SciPy FFT',teal]] : mode==='error64' ? [['dense_c128','Dense DFT · 64 bits',gold],['radix2_c128','Radix-2 · 64 bits',coral],['scipy_c128','SciPy · 64 bits',teal]] : [['radix2_c64','Radix-2 · 32 bits',coral],['scipy_c64','SciPy · 32 bits',teal]];
    const series:Series[]=defs.map(([key,label,color])=>({label,color,points:isTime?data!.timings.map(r=>({x:r.n,y:r.methods[key].median_seconds*1e6,low:r.methods[key].q25_seconds*1e6,high:r.methods[key].q75_seconds*1e6})):data!.accuracy.map(r=>({x:r.n,y:r.methods[key].median_relative_l2,low:r.methods[key].min_relative_l2,high:r.methods[key].max_relative_l2}))}));
    qs(host,'[data-title]').textContent=isTime?'Timing depends on the algorithm and environment.':'Error against an independent reference.';
    qs(host,'[data-legend]').innerHTML=series.map(s=>`<span><i style="display:inline-block;width:18px;height:3px;background:${s.color};margin-right:8px;vertical-align:middle"></i>${s.label}</span>`).join('');
    drawLogChart(chart,series,isTime?'Time per call (µs)':'Relative ℓ₂ error',isTime?'µs':'',setPoint,abort.signal);
    qs(host,'[data-note]').innerHTML=isTime?'Logarithmic scales. Each point is the median of mean timings from nine batches; bars show the descriptive interquartile range. The dense matrix is precomputed and kernels are already compiled.':'Logarithmic scales. Median and range across three complex Gaussian signals per size. Reference: an independent 80-digit direct DFT applied exactly to the representable input at each precision. These points are not a worst-case bound.';
    if(isTime) {
      qs(host,'[data-table]').innerHTML=table(['N',...defs.map(d=>`${d[1]} (µs)`)],data.timings.map(r=>[r.n,...defs.map(d=>(r.methods[d[0]].median_seconds*1e6).toFixed(4))]));
      qs(host,'[data-protocol]').innerHTML='<p>One thread; warm-up; nine batches in randomized order; median and interquartile range. Matrix construction, radix-2 planning, and compilation are excluded. Output allocation is included. Construction and planning costs are stored as individual observations in the JSON. These are not confidence intervals.</p>';
      qs(host,'[data-metrics]').innerHTML=metric('Batches per measurement','9')+metric('FFT threads',String(data.metadata.fft_workers))+metric('Measured sizes',`${data.timings[0].n}–${data.timings.at(-1)!.n}`);
    }else {
      qs(host,'[data-table]').innerHTML=table(['N',...defs.map(d=>d[1])],data.accuracy.map(r=>[r.n,...defs.map(d=>sci(r.methods[d[0]].median_relative_l2,4))]));
      qs(host,'[data-protocol]').innerHTML=`<div class="math-display">${math('\\varepsilon_{\\mathrm{rel}}=\\frac{\\|\\widetilde X-X_{\\mathrm{ref}}\\|_2}{\\|X_{\\mathrm{ref}}\\|_2}',true)}</div><p>Input rounding and algorithmic error are separated: the reference transforms the same representable input supplied to each method. An FFT–IFFT round trip does not replace this independent reference. ${math('\\kappa_2(F_N)=1')} is a normwise statement; it does not guarantee relative accuracy in a nearly zero coefficient.</p>`;
      qs(host,'[data-metrics]').innerHTML=metric('Reference precision','80 digits')+metric('Signals per size','3')+metric('Metric','Relative ℓ₂ error');
    }
  }
  host.querySelectorAll<HTMLButtonElement>('[data-mode]').forEach(b=>b.addEventListener('click',()=>render(b.dataset.mode!),{signal:abort.signal}));
  qs(host,'[data-download]').addEventListener('click',()=>{if(data)downloadJson(data);},{signal:abort.signal});
  fetch(`${import.meta.env.BASE_URL}data/results.json`,{signal:abort.signal}).then(r=>{if(!r.ok)throw new Error(`HTTP ${r.status}`);return r.json();}).then((d:Results)=>{
    if(!active)return; data=d;
    qs(host,'[data-state]').textContent='Reproduced data · Python';
    qs<HTMLButtonElement>(host,'[data-download]').disabled=false;
    const date=new Date(d.metadata.created_utc).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric',timeZone:'UTC'});
    qs(host,'[data-provenance]').textContent=`Documented run: ${date} (UTC) · ${d.metadata.cpu} · seed ${d.metadata.seed}. The charts show stored measurements; opening this page does not run Python.`;
    qs(host,'[data-metadata]').textContent=JSON.stringify(d.metadata,null,2);
    render(currentMode);
  }).catch(e=>{if(active&&e.name!=='AbortError'){qs(host,'[data-state]').textContent='Data unavailable';qs(host,'[data-provenance]').textContent='The results file could not be loaded. Check the connection and reopen this chapter.';chart.innerHTML='<p>No example data are substituted for missing results.</p>';}});
  return ()=>{active=false;abort.abort();};
}

function drawLogChart(host:HTMLElement,series:Series[],ylabel:string,unit:string,select:(s:string)=>void,signal:AbortSignal) {
  const W=860,H=420,L=80,R=28,T=30,B=58, pts=series.flatMap(s=>s.points);
  const xs=[...new Set(pts.map(p=>p.x))].sort((a,b)=>a-b), xmin=Math.log2(xs[0]),xmax=Math.log2(xs.at(-1)!);
  let ymin=Math.floor(Math.log10(Math.min(...pts.map(p=>Math.max(p.low,Number.MIN_VALUE))))),ymax=Math.ceil(Math.log10(Math.max(...pts.map(p=>p.high))));if(ymin===ymax)ymax++;
  const X=(v:number)=>L+(Math.log2(v)-xmin)/(xmax-xmin)*(W-L-R),Y=(v:number)=>T+(ymax-Math.log10(Math.max(v,Number.MIN_VALUE)))/(ymax-ymin)*(H-T-B);
  let inner='';
  for(let k=ymin;k<=ymax;k++){let y=Y(10**k);inner+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="#234156"/><text x="${L-14}" y="${y+5}" text-anchor="end" font-size="13" fill="${ink}">10<tspan baseline-shift="super" font-size="10">${k}</tspan></text>`;}
  for(const x of xs)inner+=`<line x1="${X(x)}" x2="${X(x)}" y1="${T}" y2="${H-B}" stroke="#1a354a"/><text x="${X(x)}" y="${H-B+25}" text-anchor="middle" fill="${ink}" font-size="13">${x}</text>`;
  inner+=`<text x="${L}" y="16" fill="${ink}" font-size="13">${esc(ylabel)}</text><text x="${(L+W-R)/2}" y="${H-10}" text-anchor="middle" fill="${ink}" font-size="13">Number of inputs N</text>`;
  series.forEach((s,si)=>{
    inner+=`<path d="${s.points.map((p,i)=>`${i?'L':'M'}${X(p.x)},${Y(p.y)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5"/>`;
    s.points.forEach((p,pi)=>{const x=X(p.x),y=Y(p.y),hi=Y(p.high),lo=Y(p.low);inner+=`<g><line x1="${x}" x2="${x}" y1="${hi}" y2="${lo}" stroke="${s.color}" stroke-width="1.7"/><line x1="${x-4}" x2="${x+4}" y1="${hi}" y2="${hi}" stroke="${s.color}"/><line x1="${x-4}" x2="${x+4}" y1="${lo}" y2="${lo}" stroke="${s.color}"/><circle data-si="${si}" data-pi="${pi}" tabindex="0" role="button" aria-label="${esc(`${s.label}, N=${p.x}, ${p.y.toPrecision(4)} ${unit}`)}" cx="${x}" cy="${y}" r="6" fill="${s.color}" stroke="#081726" stroke-width="2" style="cursor:pointer"/></g>`;});
  });
  host.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(ylabel)} against input size, logarithmic scales" style="width:100%;display:block;background:#081726">${inner}</svg>`;
  host.querySelectorAll<SVGCircleElement>('[data-si]').forEach(c=>{const action=()=>{const s=series[Number(c.dataset.si)],p=s.points[Number(c.dataset.pi)];select(`${s.label} · N = ${p.x} · median ${p.y.toPrecision(5)} ${unit} · displayed interval [${p.low.toPrecision(4)}, ${p.high.toPrecision(4)}] ${unit}`);};c.addEventListener('mouseenter',action,{signal});c.addEventListener('focus',action,{signal});c.addEventListener('click',action,{signal});c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}},{signal});});
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
  host.innerHTML=`<div class="lab-shell poisson-lab"><div class="lab-header"><div><span class="lab-index">APPLICATION / ELLIPTIC EQUATION</span><h3 class="lab-title">From frequencies to a solution.</h3></div><span class="chip">Computed in your browser</span></div>
    <div class="lab-controls">
      <label class="control">Grid<select data-n aria-label="Grid size"><option>16</option><option>32</option><option selected>64</option><option>128</option></select></label>
      <label class="control">Operator<select data-operator aria-label="Poisson operator"><option value="spectral">Spectral</option><option value="fd">Finite differences</option></select></label>
      <label class="control">Source<select data-kind aria-label="Poisson source"><option value="manufactured">Trigonometric solution</option><option value="smooth">Smooth solution</option><option value="dipole">Dipole</option></select></label>
      <label class="control"><span>Add constant</span><input type="checkbox" data-offset aria-label="Add a constant of 0.5 to the source"></label>
      <label class="control"><span>Project to zero mean</span><input type="checkbox" data-project checked aria-label="Subtract the mean of the source"></label>
    </div>
    <div class="math-display" data-formula></div><p class="status-note" data-status aria-live="polite"></p>
    <div class="plot-grid poisson-fields" style="display:grid;gap:18px">
      <figure class="plot-card" style="margin:0"><figcaption class="plot-title">01 · Source used</figcaption><canvas data-source role="img" aria-label="Poisson source field" style="width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;border-radius:8px"></canvas><p class="lab-caption" data-source-scale></p></figure>
      <figure class="plot-card" style="margin:0"><figcaption class="plot-title">02 · Source spectrum</figcaption><canvas data-spectrum role="img" aria-label="Logarithmic spectrum magnitude, zero mode centered" style="width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;border-radius:8px"></canvas><p class="lab-caption">Magnitude log(1 + |f̂|), zero frequency centered.</p></figure>
      <figure class="plot-card" style="margin:0"><figcaption class="plot-title">03 · Zero-mean solution</figcaption><canvas data-solution role="img" aria-label="Computed Poisson solution field" style="width:100%;height:auto;aspect-ratio:1;image-rendering:pixelated;border-radius:8px"></canvas><p class="lab-caption" data-solution-scale></p></figure>
    </div>
    <div class="metrics">${metric('Relative operator residual','—','p-residual')}${metric('Error against the known solution','—','p-error')}${metric('Local solve time','—','p-time')}</div>
    <p class="lab-caption" data-explanation></p>
    <details><summary>What is computed and what the error means</summary><div data-exact></div><p>The residual measures satisfaction of the <em>chosen discrete operator</em>. The error compares values with a known continuous solution after matching its discrete mean. No exact solution is available for the dipole, so no solution error is reported.</p><p>For finite differences, the periodic five-point stencil is applied in physical space to check the residual. The spectral case reapplies its multiplier to the solution. Colors are normalized independently for each field; the scales appear below.</p><p data-leak></p></details>
  </div>`;
  const draw=()=>{
    if(!alive)return;
    const n=Number(qs<HTMLSelectElement>(host,'[data-n]').value),operator=qs<HTMLSelectElement>(host,'[data-operator]').value as 'spectral'|'fd',kind=qs<HTMLSelectElement>(host,'[data-kind]').value as 'manufactured'|'smooth'|'dipole',offset=qs<HTMLInputElement>(host,'[data-offset]').checked?.5:0,project=qs<HTMLInputElement>(host,'[data-project]').checked;
    const start=performance.now(),r=poisson2D(n,operator,kind,offset,project),elapsed=performance.now()-start;
    qs(host,'[data-formula]').innerHTML=math(operator==='spectral'?'\\widehat u_{k,\\ell}=\\frac{\\widehat f_{k,\\ell}}{k^2+\\ell^2},\\qquad(k,\\ell)\\ne(0,0)':'\\lambda_h(k,\\ell)=\\frac4{h^2}\\!\\left(\\sin^2\\frac{\\pi k}{N}+\\sin^2\\frac{\\pi\\ell}{N}\\right),\\quad h=\\frac{2\\pi}{N}',true);
    const status=qs(host,'[data-status]');status.classList.toggle('incompatible',!r.compatible);
    if(!r.compatible) {
      status.innerHTML=`Incompatible source: mean ${sci(r.mean)}. A periodic Laplacian has zero integral. Enable projection to explicitly solve for a different right-hand side, ${math('f-\\overline f')}.`;
      paintHeatmap(qs<HTMLCanvasElement>(host,'[data-source]'),r.forcing,n);paintHeatmap(qs<HTMLCanvasElement>(host,'[data-spectrum]'),Array(n*n).fill(0),n,true);paintHeatmap(qs<HTMLCanvasElement>(host,'[data-solution]'),Array(n*n).fill(0),n);
      qs(host,'#p-residual').textContent='No solution';qs(host,'#p-error').textContent='—';qs(host,'#p-time').textContent='—';qs(host,'[data-source-scale]').textContent='Original source is incompatible';qs(host,'[data-solution-scale]').textContent='No solution has been computed';qs(host,'[data-explanation]').textContent='The solver stops: dividing the zero mode does not define a periodic solution.';qs(host,'[data-exact]').innerHTML='';qs(host,'[data-leak]').textContent='';return;
    }
    status.innerHTML=`Original mean: ${sci(r.mean)}. ${project?`Solving ${math('f-\\overline f')}.`:'Source is compatible with zero mean within computational tolerance.'} Fixing ${math('\\widehat u_{0,0}=0')}.`;
    const sourceMax=paintHeatmap(qs<HTMLCanvasElement>(host,'[data-source]'),r.forcing,n),solutionMax=paintHeatmap(qs<HTMLCanvasElement>(host,'[data-solution]'),r.solution,n);
    const shifted=Array.from({length:n*n},(_,i)=>{const y=Math.floor(i/n),x=i%n;return Math.log1p(r.spectrum[((y+n/2)%n)*n+(x+n/2)%n]);});
    paintHeatmap(qs<HTMLCanvasElement>(host,'[data-spectrum]'),shifted,n,true);
    qs(host,'[data-source-scale]').textContent=`Independent scale: −${sourceMax.toPrecision(3)} to +${sourceMax.toPrecision(3)} · coral positive, green negative.`;
    qs(host,'[data-solution-scale]').textContent=`Independent scale: −${solutionMax.toPrecision(3)} to +${solutionMax.toPrecision(3)}.`;
    qs(host,'#p-residual').textContent=sci(r.residual);qs(host,'#p-error').textContent=sci(r.error);qs(host,'#p-time').textContent=`${elapsed.toFixed(1)} ms`;
    qs(host,'[data-explanation]').innerHTML=kind==='manufactured'?'This grid resolves the trigonometric polynomial. Its spectral error near roundoff verifies this case, but does not establish general spectral convergence. Switch to finite differences and refine the grid to separate residual from discretization error.':kind==='smooth'?'The smooth solution has infinitely many modes. The sampled source is projected when zero-mean projection is enabled; the continuous reference has its discrete mean removed. The error reflects sampling, discretization, and roundoff.':'The dipole reveals how the inverse Laplacian attenuates high frequencies. Only the residual is reported; no exact solution is available for this source.';
    qs(host,'[data-exact]').innerHTML=kind==='manufactured'?math('u(x,y)=\\sin(3x)\\cos(2y)+\\tfrac14\\cos(5x),\\quad f=13\\sin(3x)\\cos(2y)+\\tfrac{25}{4}\\cos(5x)',true):kind==='smooth'?math('u(x,y)=e^{\\cos x+\\sin y}-\\operatorname{mean}(e^{\\cos x+\\sin y})',true):'<p>Periodic dipole source. Opposite boundaries are identified.</p>';
    qs(host,'[data-leak]').textContent=`Residual imaginary component: ${sci(r.imaginaryLeakage)}. Local time for a single solve, excluding chart rendering; this is not a statistical benchmark.`;
  };
  const schedule=()=>{cancelAnimationFrame(scheduled);scheduled=requestAnimationFrame(draw);};
  host.querySelectorAll('select,input').forEach(el=>el.addEventListener('change',schedule,{signal:abort.signal}));draw();
  return()=>{alive=false;cancelAnimationFrame(scheduled);abort.abort();};
}

export function mountLimits(host:HTMLElement):()=>void {
  const abort=new AbortController();let timer:ReturnType<typeof setInterval>|undefined;
  host.innerHTML=`<div class="lab-shell entropy-lab"><div class="lab-header"><div><span class="lab-index">LOWER BOUND / UNITARY MODEL</span><h3 class="lab-title">How much mixing a butterfly creates.</h3></div><span class="chip">Matrix entropy</span></div>
    <div class="lab-controls"><label class="control">Dimension<select data-n aria-label="Entropy matrix dimension"><option>8</option><option selected>16</option><option>32</option></select></label><label class="control" style="flex:1">Stage <input data-stage type="range" min="0" max="4" value="2" aria-label="Matrix FFT stage" style="min-width:120px;flex:1"><output data-stage-value>2 / 4</output></label><button class="button" data-play>Play stages</button></div>
    <div class="plot-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:26px;align-items:center">
      <figure class="plot-card"><figcaption class="plot-title">Distribution of |Mᵢⱼ|²</figcaption><canvas data-matrix width="512" height="512" role="img" aria-label="Squared moduli of the normalized partial transform matrix" style="width:100%;max-width:440px;aspect-ratio:1;display:block;margin:auto"></canvas><p class="lab-caption">Rows: partial outputs. Columns: original inputs. Brightness encodes probability 0 → 1.</p></figure>
      <div><div class="math-display">${math('\\Phi(M)=-\\sum_{i,j}|M_{ij}|^2\\log_2|M_{ij}|^2',true)}</div><div class="metrics" style="grid-template-columns:1fr">${metric('Computed entropy','—','e-phi')}${metric('Entropy at the Fourier transform','—','e-target')}${metric('Butterflies executed','—','e-count')}</div><p class="status-note" data-status aria-live="polite"></p></div>
    </div>
    <div class="math-display">${math('|\\Delta\\Phi|\\le2\\quad\\Longrightarrow\\quad \\#\\text{ gates}\\ge\\frac{N\\log_2 N}{2}',true)}</div>
    <p class="lab-caption">Model: exact arithmetic, N complex registers, and unitary 2 × 2 gates. The bound does not apply to every computational model and does not predict wall-clock time. The initial permutation has zero entropy; the counter counts butterflies, not possible implementation swaps.</p>
    <details><summary>How this matrix is constructed</summary><p>Each canonical basis vector is transformed using the same FFT trace as the laboratory. At stage s, the partial matrix is divided by ${math('\\sqrt{2^s}')} to normalize its butterflies. Cell intensity is the squared modulus of the resulting entry; it is not a probability of the input signal.</p><p>At each stage, the rows have ${math('2^s')} nonzero entries of modulus ${math('2^{-s/2}')}. Therefore ${math('\\Phi(M_s)=Ns')}. The interface computes the potential from the entries and also displays the theoretical value for comparison.</p></details>
  </div>`;
  const stop=()=>{if(timer!==undefined){clearInterval(timer);timer=undefined;}qs(host,'[data-play]').textContent='Play stages';};
  const draw=()=>{
    const n=Number(qs<HTMLSelectElement>(host,'[data-n]').value),m=Math.log2(n),range=qs<HTMLInputElement>(host,'[data-stage]');range.max=String(m);if(+range.value>m)range.value=String(m);const s=+range.value;
    qs<HTMLOutputElement>(host,'[data-stage-value]').value=`${s} / ${m}`;
    const probs=Array(n*n).fill(0) as number[];let phi=0,rowError=0;
    for(let col=0;col<n;col++) {const basis=Array.from({length:n},(_,i)=>({re:i===col?1:0,im:0}));const v=fftTrace(basis).stages[s];for(let row=0;row<n;row++){const p=(v[row].re**2+v[row].im**2)/2**s;probs[row*n+col]=p;if(p>0)phi-=p*Math.log2(p);}}
    const canvas=qs<HTMLCanvasElement>(host,'[data-matrix]'),ctx=canvas.getContext('2d');
    if(ctx) {const w=512,cell=w/n;ctx.fillStyle='#13272f';ctx.fillRect(0,0,w,w);for(let y=0;y<n;y++){rowError=Math.max(rowError,Math.abs(probs.slice(y*n,(y+1)*n).reduce((a,b)=>a+b,0)-1));for(let x=0;x<n;x++){const p=probs[y*n+x],t=Math.sqrt(p);ctx.fillStyle=`rgb(${Math.round(19+167*t)},${Math.round(39+188*t)},${Math.round(47+144*t)})`;ctx.fillRect(x*cell+1,y*cell+1,Math.max(0,cell-2),Math.max(0,cell-2));}}}
    qs(host,'#e-phi').textContent=`${phi.toFixed(3)} bits`;qs(host,'#e-target').textContent=`${n*m} bits`;qs(host,'#e-count').textContent=`${n*s/2} / ${n*m/2}`;
    qs(host,'[data-status]').innerHTML=`Theoretical value ${math(`Ns=${n*s}`)}. Numerical deviation ${sci(Math.abs(phi-n*s))}. Maximum row-sum error ${sci(rowError)}.`;
  };
  qs(host,'[data-n]').addEventListener('change',()=>{stop();draw();},{signal:abort.signal});qs(host,'[data-stage]').addEventListener('input',()=>{stop();draw();},{signal:abort.signal});
  qs(host,'[data-play]').addEventListener('click',()=>{if(timer!==undefined){stop();return;}const r=qs<HTMLInputElement>(host,'[data-stage]');r.value='0';draw();qs(host,'[data-play]').textContent='Pause';timer=setInterval(()=>{if(+r.value>=+r.max){stop();return;}r.value=String(+r.value+1);draw();},850);},{signal:abort.signal});draw();
  return()=>{stop();abort.abort();};
}
