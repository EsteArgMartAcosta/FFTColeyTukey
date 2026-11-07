import katex from 'katex';
import renderMathInElement from 'katex/contrib/auto-render';

export const tex = (value:string,display=false) => katex.renderToString(value,{displayMode:display,throwOnError:true,strict:'warn',trust:false});
export function typeset(root:HTMLElement){renderMathInElement(root,{delimiters:[{left:'\\[',right:'\\]',display:true},{left:'\\(',right:'\\)',display:false}],throwOnError:false,trust:false});}
export const fmt = (x:number,d=3) => Math.abs(x)<1e-12?'0':Number(x.toFixed(d)).toString();
export const sci = (x:number) => x===0?'0':x.toExponential(2);
export const escapeHtml=(s:string)=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
export const path = (pts:number[][])=>pts.map(([x,y],i)=>`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
export function svgGrid(w:number,h:number,pad=25){return Array.from({length:5},(_,i)=>{const y=pad+(h-2*pad)*i/4;return `<path d="M${pad},${y}H${w-pad}" stroke="currentColor" opacity=".10"/>`;}).join('');}
export function ctext(z:{re:number,im:number},d=3){return `${fmt(z.re,d)} ${z.im<0?'−':'+'} ${fmt(Math.abs(z.im),d)}i`;}
export function range(label:string,id:string,min:number,max:number,value:number,step=1){return `<label class="control" for="${id}"><span>${label}<output id="${id}-value">${value}</output></span><input id="${id}" type="range" min="${min}" max="${max}" value="${value}" step="${step}"></label>`;}
