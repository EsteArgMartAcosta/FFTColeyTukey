'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s)), pad=id=>String(id).padStart(2,'0');
const esc=str=>String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const route=()=>decodeURIComponent(location.hash.slice(1)||'inicio').split('/');
const urlQ=(id,mode='solucion')=>'#pregunta/'+id+'/'+mode;
const storeKey='limite-impa-examen2-v1';
const defaults={done:{},notes:{},rated:{},last:1,deck:null,exam:null,history:[],bag:[],scratch:{}};
let state=structuredClone(defaults),persistent=true;
try{state={...state,...JSON.parse(localStorage.getItem(storeKey)||'{}')};}catch{persistent=false;}
function save(){try{localStorage.setItem(storeKey,JSON.stringify(state));}catch{persistent=false;}}
const proofs={},requested=new Map();
function registerProof(id,data){proofs[id]=data;}
function fetchProof(id){
 if(proofs[id])return Promise.resolve(proofs[id]);
 if(requested.has(id))return requested.get(id);
 const load=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='preguntas/'+pad(id)+'.js';script.onload=()=>proofs[id]?resolve(proofs[id]):reject(new Error('datos'));script.onerror=()=>{requested.delete(id);script.remove();reject(new Error('red'));};document.head.append(script);});
 requested.set(id,load);return load;
}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const allIDs=catalog.map(q=>q.id);
const btn=(text,action,primary=false)=>'<button type="button" class="btn '+(primary?'primary':'')+'" data-action="'+action+'">'+text+'</button>';
const link=(label,url,primary=false)=>'<a class="btn '+(primary?'primary':'')+'" href="'+url+'">'+label+'</a>';
const kicker=text=>'<div class="kicker"><i class="rule"></i>'+text+'</div>';
function row(id){const p=practice[id-1];return '<a class="row" href="'+urlQ(id)+'"><span class="smallnum">'+pad(id)+'</span>'+stamp(id)+'<span class="topictext"><strong>'+p.name+'</strong><small>'+p.tag+'</small></span><span class="arrow">'+(state.done[id]?'<span class="checkstamp" aria-label="Dominada">✓</span>':'')+ico('arrow')+'</span></a>';}
function home(){const count=allIDs.filter(i=>state.done[i]).length,last=Number(state.last)||1;
 return '<div class="wrap"><section class="hero"><div class="hero-copy"><div class="eyebrow"><i></i> IMPA · Examen teórico 02</div><h1>Análisis<br><em>numérico.</em></h1><p>Doce preguntas para preparar tu paso al tablero.</p><div class="actions">'+link(ico('book')+' Estudiar el temario','#temario',true)+'<a class="btn ghost" href="#simulacro">'+ico('shuffle')+' Simulacro oral</a></div></div><div class="figure">'+surface()+'<a class="fig-caption" href="'+urlQ(7,'lab')+'">FIG. 07 / Difusión de Fourier ↗</a></div></section><div class="meta-strip"><span>'+ico('book')+'12 preguntas</span><span>'+ico('cards')+'48 memofichas</span><span>'+ico('clock')+'20 min<span class="opt"> de preparación</span></span></div><div class="homegrid"><section>'+kicker('Cuaderno de estudio')+'<div class="headingline"><h2>Las preguntas</h2><a class="textlink" href="#temario">Ver las 12 ↗</a></div><div class="rows">'+allIDs.slice(0,5).map(row).join('')+'</div></section><aside class="side"><section class="panel">'+kicker('Tu progreso')+'<div class="progress-title">'+count+' <b>/ 12</b></div><div class="segments" aria-hidden="true">'+allIDs.map(i=>'<i class="'+(state.done[i]?'on':'')+'"></i>').join('')+'</div><p>preguntas que puedes defender</p><div class="home-note"><a class="textlink" href="'+urlQ(last)+'">'+(state.visited?'Volver a la pregunta '+pad(last):'Abrir la primera pregunta')+' →</a></div></section><section class="darkcard">'+kicker('Recuerdo activo')+'<h3>Memofichas</h3><p>Di la respuesta en voz alta y comprueba el paso que recordaste.</p>'+link('Practicar fichas '+ico('arrow'),'#fichas')+'</section></aside></div></div>';
}
let theme='Todos',search='';
function catalogPage(){const tags=['Todos',...new Set(practice.map(p=>p.tag))];return '<div class="wrap page"><div class="pagehead">'+kicker('Temario · Examen 02')+'<h1>Las doce preguntas</h1><p class="lead">Abre una pregunta para leer la demostración, ensayarla en el tablero o explorar su laboratorio.</p></div><label class="sr" for="search">Buscar una pregunta</label><input type="search" id="search" class="search" placeholder="Buscar por tema, método o número…" value="'+esc(search)+'"><div class="filters">'+tags.map(t=>'<button class="chip '+(theme===t?'active':'')+'" data-theme="'+esc(t)+'" aria-pressed="'+(theme===t)+'">'+t+'</button>').join('')+'</div><div class="gridtopics rows" id="filtered"></div></div>';}
const fold=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function renderList(){const list=allIDs.filter(id=>{const p=practice[id-1],q=catalog[id-1];return (theme==='Todos'||p.tag===theme)&&fold([p.name,q.title,q.en,p.tag,id,pad(id)].join(' ')).includes(fold(search.trim()));});$('#filtered').innerHTML=list.map(row).join('')||'<p class="empty">Ninguna pregunta coincide con la búsqueda.</p>';}
function toolbar(id){return '<aside class="side"><section class="panel">'+kicker('Mi preparación')+'<p>Marca esta pregunta cuando puedas defender la solución completa de memoria.</p>'+btn(state.done[id]?'✓ Puedo defenderla':'Marcar como dominada','master')+'<div class="linkline"><a class="textlink" href="#fichas/'+id+'">Sus 4 memofichas →</a></div></section><section class="panel">'+kicker('Mi hoja resumen')+'<label class="field" for="note">Lo que llevaría al examen</label><textarea id="note" placeholder="Hipótesis, una identidad, el paso que suelo olvidar…">'+esc(state.notes[id])+'</textarea><small class="notes-status">'+(persistent?'Se guarda en este navegador.':'Guardado disponible solo durante esta sesión.')+'</small></section><section class="panel"><a class="textlink" href="soluciones.pdf#page='+id+'">Hoja '+pad(id)+' en PDF ↗</a></section></aside>';}
function proofContent(p){
 return '<div class="proof">'+p.steps.map((s,i)=>'<section class="step" id="paso-'+(i+1)+'"><h3><span>'+pad(i+1)+'</span><span>'+s.title+'</span></h3>'+s.body+'</section>').join('')+'<div class="solution-check"><strong>'+p.checkTitle+'</strong>'+p.check+'</div></div>';
}
let boardHints=0,boardShow=false,boardStep=-1;
function questionBody(id,mode,p){const q=catalog[id-1];
 if(mode==='lab')return labHTML(id);
 if(mode==='tablero')return '<section class="paper">'+kicker('Reconstrucción sin mirar')+'<h2 class="lab-title">Al tablero</h2><p class="prompt" lang="en">'+q.en+'</p><label class="field" for="boardScratch">Tu reconstrucción</label><textarea id="boardScratch" placeholder="Empieza por las hipótesis y el objetivo…">'+esc(state.scratch[id])+'</textarea><div class="actions">'+(boardHints<p.steps.length?btn('Revelar una pista','hint'):'')+btn(boardShow?'Ocultar solución':'Contrastar mi solución','boardSolution',true)+'</div>'+(boardHints?'<ol class="recall">'+p.steps.slice(0,boardHints).map((v,k)=>'<li>'+v.title+' '+btn(boardStep===k?'Cerrar':'Ver este paso','boardStep-'+k)+(boardStep===k?'<div class="proof">'+v.body+'</div>':'')+'</li>').join('')+'</ol>':'')+(boardShow?proofContent(p):'')+'</section>';
 return '<article class="paper">'+kicker('Enunciado del examen')+'<p class="prompt" lang="en" style="margin:12px 0">'+q.en+'</p><div class="quote"><strong>La idea</strong><p>'+q.idea+'</p></div>'+proofContent(p)+'</article>';
}
function question(id,mode,p){
 const q=catalog[id-1];return '<div class="wrap page"><a class="back" href="#temario">'+ico('left')+' Temario</a><div class="pagehead">'+kicker('Pregunta '+pad(id)+' / 12 · '+practice[id-1].tag)+'<h1>'+q.title+'</h1></div><nav aria-label="Modos de estudio" class="tabs">'+[['solucion','Solución completa'],['tablero','Al tablero'],['lab','Laboratorio']].map(([v,s])=>'<a class="tab '+(mode===v?'active':'')+'" '+(mode===v?'aria-current="page"':'')+' href="'+urlQ(id,v)+'">'+s+'</a>').join('')+'</nav><div class="reading"><div id="qBody">'+questionBody(id,mode,p)+'</div>'+toolbar(id)+'</div><div class="spread" style="margin-top:22px">'+(id>1?link('← Pregunta '+pad(id-1),urlQ(id-1)):'<span></span>')+(id<12?link('Pregunta '+pad(id+1)+' →',urlQ(id+1)):link('Volver al temario','#temario'))+'</div></div>';
}
function keyCards(scope){return allIDs.filter(i=>scope==='all'||scope==='weak'||Number(scope)===i).flatMap(i=>practice[i-1].cards.map((_,j)=>i+'-'+j)).filter(key=>scope!=='weak'||state.rated[key]==='again');}
function startDeck(scope){state.deck={scope,queue:shuffle(keyCards(scope)),pos:0,flipped:false,ok:0,miss:[]};save();}
function nextCard(rate){
 const d=state.deck;if(!d.flipped||d.pos>=d.queue.length)return;
 const key=d.queue[d.pos];state.rated[key]=rate;if(rate==='again')d.miss.push(key);else d.ok++;
 d.pos++;d.flipped=false;save();render(false);
}
function deckPage(){
 const d=state.deck,weak=Object.values(state.rated).filter(r=>r==='again').length;
 const options=[['all','Todo el temario'],['weak','Pendientes de refuerzo ('+weak+')'],...allIDs.map(i=>[String(i),pad(i)+' · '+practice[i-1].name])];
 let body;if(!d.queue.length)body='<div class="cardface">'+kicker('Refuerzo')+'<h2>No tienes fichas pendientes.</h2><p>Al marcar «Necesito repasar», esa ficha aparecerá aquí.</p><div class="actions">'+btn('Practicar todo el temario','deckAll',true)+'</div></div>';
 else if(d.pos>=d.queue.length)body='<div class="cardface">'+kicker('Ronda terminada')+'<h2>'+d.ok+' de '+d.queue.length+' recordadas</h2><p>'+d.miss.length+' fichas por reforzar en esta ronda.</p><div class="actions">'+(d.miss.length?btn('Repetir mis fallos','deckMistakes',true):'')+btn('Mezclar otra ronda','deckNew')+'</div></div>';
 else {const key=d.queue[d.pos],[id,j]=key.split('-').map(Number),card=practice[id-1].cards[j];body='<div class="cardface">'+kicker('Pregunta '+pad(id)+' · '+practice[id-1].name)+'<h2>'+card[0]+'</h2>'+(d.flipped?'<p class="answer">'+card[1]+'</p>':'<p class="muted">Intenta responder antes de girar la ficha.</p>')+'</div><div class="cardprogress"><i style="width:'+100*d.pos/d.queue.length+'%"></i></div><div class="spread"><div class="actions">'+(d.flipped?btn('Necesito repasar','again')+btn('La recordé '+ico('check'),'know',true):btn('Mostrar respuesta','flip',true))+'</div><a class="textlink" href="'+urlQ(id)+'">Ver demostración ↗</a></div>';}
 return '<div class="wrap page"><div class="focusbox"><div class="pagehead">'+kicker('Recuerdo activo')+'<h1>Memofichas</h1><p class="lead">Una pregunta cada vez. Responde en voz alta y decide qué necesitas volver a practicar.</p></div><div class="decktop"><label for="deckFilter"><span class="sr">Seleccionar grupo de fichas</span><select id="deckFilter" class="select">'+options.map(([v,l])=>'<option value="'+v+'" '+(d.scope===v?'selected':'')+'>'+l+'</option>').join('')+'</select></label><span class="kicker">'+(d.queue.length?Math.min(d.pos+1,d.queue.length)+' / '+d.queue.length:'0 fichas')+'</span></div>'+body+'</div></div>';
}
let simPool='all';
const remaining=e=>e.paused?e.remaining:Math.max(0,e.deadline-Date.now());
const timerText=t=>{const s=Math.ceil(Math.max(0,t)/1000);return pad(Math.floor(s/60))+':'+pad(s%60);};
function newExam(){let ids=allIDs;if(simPool==='weak')ids=allIDs.filter(id=>!state.done[id]);if(!ids.length)return;const eligible=state.bag.filter(i=>ids.includes(i));if(!eligible.length)state.bag=shuffle(ids);const index=state.bag.findIndex(i=>ids.includes(i)),id=state.bag.splice(index,1)[0];state.exam={id,phase:'prep',time:Date.now(),deadline:Date.now()+1200000,paused:false,remaining:1200000,text:'',ticks:[],used:null};save();render(false);}
function toOral(){const e=state.exam;if(e.phase!=='prep')return;e.used=1200000-remaining(e);e.phase='oral';e.paused=false;save();render(false);}
function historyHTML(){return '<section class="panel">'+kicker('Mis simulacros')+(state.history.length?'<ul class="history">'+state.history.slice(0,6).map(t=>'<li><span>'+new Date(t.time).toLocaleDateString('es',{day:'numeric',month:'short'})+' · Pregunta '+pad(t.id)+'</span><b>'+t.score+'/'+t.total+'</b></li>').join('')+'</ul>':'<p>Aquí verás tus intentos terminados y cuántos pasos pudiste defender.</p>')+'</section>';}
function examPage(p){
 if(simPool==='weak'&&allIDs.every(i=>state.done[i]))simPool='all';
 const e=state.exam;
 if(!e){const weak=allIDs.filter(i=>!state.done[i]).length;return '<div class="wrap page"><div class="pagehead">'+kicker('Ensayo del examen')+'<h1>Simulacro oral</h1><p class="lead">Saca un papel, prepara tu solución en 20 minutos y defiéndela en el tablero.</p></div><div class="desk"><section class="paper intro-sim">'+kicker('El sorteo')+'<h2>¿Qué pregunta te tocará?</h2><ol class="listclean"><li>Escribe tu solución con ayuda de tu hoja resumen.</li><li>Al terminar el tiempo, explica la demostración en voz alta.</li><li>Contrasta los pasos con la solución y registra tu autoevaluación.</li></ol><label class="field" for="simPool">Preguntas que entran en el sorteo</label><select id="simPool" class="select"><option value="all">Las doce preguntas</option><option value="weak" '+(simPool==='weak'?'selected':'')+' '+(!weak?'disabled':'')+'>Por dominar ('+weak+')</option></select><div class="actions">'+btn(ico('shuffle')+' Sortear y empezar','draw',true)+'</div><p class="status">El cronómetro comienza al sacar el papel.</p></section><aside>'+historyHTML()+'</aside></div></div>';}
 const id=e.id,q=catalog[id-1],take=practice[id-1],phase=e.phase;
 const banner='<div class="wrap page"><div class="pagehead">'+kicker('Simulacro · Pregunta '+pad(id)+' / 12')+'<h1>'+({prep:'Preparación',oral:'Defensa oral',review:'Revisión del intento',done:'Simulacro completado'}[phase])+'</h1></div>';
 if(phase==='done'){const t=state.history[0];return banner+'<div class="desk"><section class="paper">'+kicker(take.name)+'<h2 style="margin:14px 0">'+t.score+' de '+t.total+' pasos justificados</h2><p class="muted">Autoevaluación · Tiempo de preparación '+timerText(e.used)+'</p>'+(t.missed.length?'<h3 style="margin-top:20px">Para el próximo intento</h3><ul class="listclean">'+t.missed.map(j=>'<li>'+p.steps[j].title+'</li>').join(''):'<p class="callout">Has marcado todos los pasos de la demostración.</p>')+'<div class="actions">'+btn('Preparar otro sorteo','examReset',true)+link('Repasar esta pregunta',urlQ(id))+'</div></section><aside>'+historyHTML()+'</aside></div></div>';}
 const title='<div class="kicker">Papel '+pad(id)+' · '+q.group+'</div><h2 style="margin:13px 0">'+take.name+'</h2><p class="prompt" lang="en">'+q.en+'</p>';
 if(phase==='review')return banner+'<div class="reading"><section class="paper">'+title+'<details><summary>Leer mi borrador</summary><p style="white-space:pre-wrap">'+esc(e.text||'Sin anotaciones.')+'</p></details><div class="step"><h3>¿Qué pasos pudiste justificar?</h3><p class="muted">Marca solo los que explicaste antes de consultar la solución.</p>'+p.steps.map((s,j)=>'<label class="checkrow"><input type="checkbox" data-tick="'+j+'" '+(e.ticks.includes(j)?'checked':'')+'><span>'+s.title+'</span></label>').join('')+'</div><details><summary>Contrastar con la solución completa</summary>'+proofContent(p)+'</details><div class="actions">'+btn('Guardar autoevaluación','finish',true)+'</div></section><aside>'+historyHTML()+'</aside></div></div>';
 const note='<details><summary>Consultar mi hoja resumen</summary><p style="white-space:pre-wrap">'+esc(state.notes[id]||'Aún no has escrito apuntes para esta pregunta. También puedes usar tu hoja en papel.')+'</p></details>';
 let side=phase==='prep'?'<section class="panel">'+kicker('Tiempo de preparación')+'<div class="timer" id="timer">'+timerText(remaining(e))+'</div><p>'+(e.paused?'Cronómetro en pausa.':'Al llegar a cero pasarás a la defensa oral.')+'</p><div class="actions">'+btn(e.paused?'Reanudar':'Pausar','pause')+'</div></section>':'<section class="panel">'+kicker('Repregunta oral')+'<p>Después de tu exposición, intenta responder lo siguiente.</p><details><summary>Ver la repregunta</summary><p>'+take.cards[2][0]+'</p></details></section>';
 return banner+'<div class="reading"><section class="paper">'+title+(phase==='prep'?note+'<label class="field" for="examText">Mi borrador de preparación</label><textarea id="examText" rows="8" placeholder="¿Qué supones? ¿Qué quieres demostrar? Escribe tus pasos…">'+esc(e.text)+'</textarea>':'<p class="callout">Explica el argumento en voz alta desde las hipótesis hasta la conclusión.</p><details><summary>Consultar mi borrador</summary><p style="white-space:pre-wrap">'+esc(e.text||'Sin anotaciones.')+'</p></details>')+'<div class="actions">'+(phase==='prep'?btn('Pasar al tablero →','toOral',true):btn('Terminar defensa y revisar','toReview',true))+'</div></section><aside class="side">'+side+'</aside></div></div>';
}
let renderToken=0,lastURL='',subKey='';
async function render(scroll=true){
 const token=++renderToken,parts=route();let [page,rawId,tab]=parts;
 if(!['inicio','temario','pregunta','fichas','simulacro'].includes(page))page='inicio';
 const id=Math.min(12,Math.max(1,parseInt(rawId,10)||1)),mode=['solucion','tablero','lab'].includes(tab)?tab:'solucion';
 if(lastURL!==location.hash){boardHints=0;boardShow=false;boardStep=-1;}
 lastURL=location.hash;const scope=page==='fichas'&&allIDs.includes(Number(rawId))?String(id):null;
 if(page==='fichas'&&(!state.deck||(scope&&subKey!==location.hash&&state.deck.scope!==scope)))startDeck(scope||'all');subKey=location.hash;
 $$('.bar nav a').forEach(a=>{if(a.dataset.nav===(page==='pregunta'?'temario':page))a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
 const target=page==='pregunta'?id:page==='simulacro'&&state.exam?state.exam.id:null;
 let p;if(target){try{p=await fetchProof(target);}catch{if(token===renderToken)$('#main').innerHTML='<div class="wrap page"><p>No se pudo cargar esta demostración.</p><div class="actions">'+btn('Reintentar','retry')+link('Abrir el cuaderno','soluciones.pdf')+'</div></div>';return;}if(token!==renderToken)return;}
 if(page==='pregunta'){state.last=id;state.visited=true;save();}
 document.title=({inicio:'Análisis numérico',temario:'Temario',pregunta:practice[id-1].name,fichas:'Memofichas',simulacro:'Simulacro oral'}[page])+' · Límite | IMPA';
 $('#main').innerHTML=page==='pregunta'?question(id,mode,p):page==='temario'?catalogPage():page==='fichas'?deckPage():page==='simulacro'?examPage(p):home();
 if(!persistent)$('#main').insertAdjacentHTML('beforeend','<p class="wrap status">El navegador bloquea el guardado local. Tu progreso durará esta sesión.</p>');
 if(page==='temario')renderList();if(page==='pregunta'&&mode==='lab')updateLab(id);
 if(scroll){window.scrollTo(0,0);$('#main').focus({preventScroll:true});}
}
function completeExam(){
 const e=state.exam;if(e.phase!=='review')return;const p=proofs[e.id];state.history.unshift({time:Date.now(),id:e.id,score:e.ticks.length,total:p.steps.length,missed:p.steps.map((s,i)=>i).filter(i=>!e.ticks.includes(i))});state.history=state.history.slice(0,60);e.phase='done';save();render(false);
}
document.addEventListener('click',event=>{
 if(event.target.closest('.skip')){event.preventDefault();$('#main').focus();return;}
 const themeButton=event.target.closest('[data-theme]');if(themeButton){theme=themeButton.dataset.theme;render(false);return;}
 const target=event.target.closest('[data-action]');if(!target)return;
 const a=target.dataset.action,id=Math.max(1,Number(route()[1])||1),d=state.deck,e=state.exam;
 if(a==='master'){state.done[id]=!state.done[id];save();target.textContent=state.done[id]?'✓ Puedo defenderla':'Marcar como dominada';return;}
 if(a==='hint'||a==='boardSolution'||a.startsWith('boardStep-')){
 if(a==='hint')boardHints++;else if(a==='boardSolution')boardShow=!boardShow;else{const n=Number(a.split('-')[1]);boardStep=boardStep===n?-1:n;}
 $('#qBody').innerHTML=questionBody(id,'tablero',proofs[id]);return;}
 if(a==='flip'){d.flipped=true;save();render(false);return;}
 if(a==='again'||a==='know'){nextCard(a==='again'?'again':'know');return;}
 if(a==='deckNew'||a==='deckAll'||a==='deckMistakes'){if(a==='deckMistakes'){state.deck={scope:d.scope,queue:shuffle(d.miss),pos:0,ok:0,miss:[],flipped:false};save();}else startDeck(a==='deckAll'?'all':d.scope);render(false);return;}
 if(a==='draw'){newExam();return;}
 if(a==='pause'&&e?.phase==='prep'){if(!e.paused){const t=remaining(e);if(t<=0){toOral();return;}e.remaining=t;e.paused=true;}else{e.deadline=Date.now()+e.remaining;e.paused=false;}save();render(false);return;}
 if(a==='toOral'){toOral();return;}
 if(a==='toReview'&&e?.phase==='oral'){e.phase='review';save();render(false);return;}
 if(a==='finish'){completeExam();return;}
 if(a==='examReset'){state.exam=null;save();render(false);return;}
 if(a==='retry')render(false);
});
document.addEventListener('input',ev=>{const t=ev.target,id=Number(route()[1])||1;if(t.id==='search'){search=t.value;renderList();}else if(t.id==='param')updateLab(id);else if(t.id==='note'){state.notes[id]=t.value;save();}else if(t.id==='boardScratch'){state.scratch[id]=t.value;save();}else if(t.id==='examText'&&state.exam){state.exam.text=t.value;save();}});
document.addEventListener('change',ev=>{const t=ev.target;if(t.id==='deckFilter'){startDeck(t.value);if(route()[1]&&t.value!==route()[1])location.hash='fichas';else render(false);}else if(t.id==='simPool')simPool=t.value;else if(t.hasAttribute('data-tick')&&state.exam?.phase==='review'){const j=Number(t.dataset.tick),ticks=new Set(state.exam.ticks);if(t.checked)ticks.add(j);else ticks.delete(j);state.exam.ticks=[...ticks];save();}});
function tick(){const e=state.exam;if(e?.phase!=='prep'||e.paused)return;if(remaining(e)<=0){e.used=1200000;e.phase='oral';save();if(route()[0]==='simulacro')render(false);}else if($('#timer'))$('#timer').textContent=timerText(remaining(e));}
window.addEventListener('hashchange',()=>render());window.addEventListener('pageshow',tick);document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});setInterval(tick,500);tick();render(false);
