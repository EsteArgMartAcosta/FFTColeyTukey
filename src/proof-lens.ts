import {proofEntries} from './proofs';
import {references} from './content';
import {typeset,escapeHtml} from './ui';

/** Hover/focus previews, with click-to-pin and an explicit close action. */
export function installProofLens() {
  const lens=document.createElement('aside');
  lens.id='proof-lens';lens.className='proof-lens';lens.hidden=true;lens.setAttribute('role','dialog');lens.setAttribute('aria-modal','false');lens.setAttribute('aria-label','Mathematical derivation');
  document.body.append(lens);
  let pinned=false, current='', timer=0, suppressFocus=false, anchor:HTMLElement|null=null;
  const close=()=>{clearTimeout(timer);lens.hidden=true;pinned=false;current='';anchor?.setAttribute('aria-expanded','false');};
  function returnFocus(){suppressFocus=true;anchor?.focus();suppressFocus=false;}
  const find=(id:string)=>proofEntries.find(p=>p.id===id)??proofEntries.find(p=>p.chapter===id)??proofEntries[0];
  function open(id:string,pin=false,source?:HTMLElement){
    clearTimeout(timer);if(pinned&&!pin)return;
    const p=find(id);if(!p)return;anchor=source??anchor;pinned=pin||pinned;
    if(current!==p.id){current=p.id;lens.innerHTML=`<div class="proof-lens-top"><div><span class="eyebrow">MATHEMATICAL DOSSIER</span><span class="proof-counter">${String(proofEntries.indexOf(p)+1).padStart(2,'0')} / ${proofEntries.length}</span></div><div><button data-pin aria-label="Pin derivation">⌖ <span>Pin</span></button><button data-expand aria-label="Expand derivation">⤢</button><button data-close aria-label="Close derivation">×</button></div></div><div class="proof-lens-scroll"><div class="proof-lens-heading"><span class="proof-kind">STATEMENT · ASSUMPTIONS · PROOF</span><h2 id="proof-lens-title">${escapeHtml(p.title)}</h2><p>${p.summary}</p></div><div class="theorem-statement">${p.statement}</div><div class="proof-body">${p.body}</div><div class="proof-citations"><span>PRIMARY REFERENCES</span>${p.refs.map(id=>{const r=references.find(r=>r.id===id);return r?`<a href="${r.url}" target="_blank" rel="noreferrer">${escapeHtml(r.authors)} · ${escapeHtml(r.title)} (${escapeHtml(r.year)}) ↗</a>`:`<span>${escapeHtml(id)}</span>`;}).join('')}</div><div class="proof-switcher"><label for="proof-select">Explore another derivation</label><select id="proof-select">${proofEntries.map(q=>`<option value="${q.id}"${q.id===p.id?' selected':''}>${escapeHtml(q.title)}</option>`).join('')}</select></div></div><div class="proof-lens-bottom"><span data-proof-hint>Hover to read · click the formula to pin</span><span>Esc to close</span></div>`;typeset(lens);
      lens.querySelector<HTMLButtonElement>('[data-close]')!.onclick=()=>{close();returnFocus();};
      lens.querySelector<HTMLButtonElement>('[data-pin]')!.onclick=()=>{pinned=!pinned;sync();};
      lens.querySelector<HTMLButtonElement>('[data-expand]')!.onclick=()=>{pinned=true;lens.classList.toggle('expanded');sync();};
      lens.querySelector<HTMLSelectElement>('#proof-select')!.onchange=e=>open((e.target as HTMLSelectElement).value,true);
    }
    lens.hidden=false;source?.setAttribute('aria-expanded','true');sync();
  }
  function sync(){lens.classList.toggle('pinned',pinned);lens.querySelector('[data-pin]')?.setAttribute('aria-pressed',String(pinned));const label=lens.querySelector('[data-pin] span');if(label)label.textContent=pinned?'Pinned':'Pin';const hint=lens.querySelector('[data-proof-hint]');if(hint)hint.textContent=pinned?'Pinned · explore the lab while reading':'Hover to read · click the formula to pin';}
  const schedule=()=>{if(!pinned)timer=window.setTimeout(close,280);};
  document.addEventListener('pointerover',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-proof]');if(target){clearTimeout(timer);if(!pinned)timer=window.setTimeout(()=>open(target.dataset.proof!,false,target),260);}});
  document.addEventListener('pointerout',e=>{if((e.target as Element).closest('[data-proof]')&&!(e.relatedTarget instanceof Node&&lens.contains(e.relatedTarget)))schedule();});
  document.addEventListener('focusin',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-proof]');if(target&&!pinned&&!suppressFocus)open(target.dataset.proof!,false,target);});
  document.addEventListener('click',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-proof]');if(target){e.preventDefault();open(target.dataset.proof!,true,target);}});
  lens.addEventListener('pointerenter',()=>clearTimeout(timer));lens.addEventListener('pointerleave',schedule);
  document.addEventListener('keydown',e=>{const target=(e.target as Element).closest<HTMLElement>('[data-proof]');if(target&&target.tagName!=='BUTTON'&&(e.key==='Enter'||e.key===' ')){e.preventDefault();open(target.dataset.proof!,true,target);}if(e.key==='Escape'&&!lens.hidden){e.stopPropagation();close();returnFocus();}});
  return {open:(id:string)=>open(id,true),close};
}

export function proofLinks(chapter:string) {
  const entries=proofEntries.filter(p=>p.chapter===chapter);
  return `<div class="proof-links"><span class="proof-links-label">EXPLORE THE PROOF</span>${entries.map(p=>`<button class="proof-link" data-proof="${p.id}" aria-haspopup="dialog" aria-expanded="false"><span>∴</span>${escapeHtml(p.title)}<i>↗</i></button>`).join('')}</div>`;
}
