/** A procedural Fourier surface. Decorative geometry, never experimental data. */
export function mountField(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d')!;
  let w = 0, h = 0, frame = 0, last = 0, time = 0;
  let enabled = !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let pointerX = 0, pointerY = 0;
  const resize = () => {
    w = innerWidth; h = innerHeight;
    const dpr = Math.min(devicePixelRatio, 1.5);
    canvas.width = w * dpr; canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  const pointer = (e: PointerEvent) => { pointerX = (e.clientX / w - .5); pointerY = e.clientY / h - .5; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const preference = () => { enabled = !reduced.matches; document.dispatchEvent(new CustomEvent('atlas-motion', {detail:enabled})); };
  addEventListener('resize', resize); addEventListener('pointermove', pointer, {passive:true}); reduced.addEventListener('change', preference);
  function draw(now: number) {
    frame = requestAnimationFrame(draw);
    if (document.hidden || now-last < 34) return;
    const delta = Math.min(now-last, 60); last = now;
    if (enabled) time += delta * .00013;
    ctx.clearRect(0, 0, w, h);
    const glow = ctx.createRadialGradient(w*.73,h*.4,0,w*.73,h*.4,w*.65);
    glow.addColorStop(0,'rgba(22,92,131,.14)'); glow.addColorStop(.5,'rgba(13,45,83,.08)'); glow.addColorStop(1,'rgba(2,7,18,0)');
    ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);
    const mobile=w<700, rows=mobile?23:38, cols=mobile?40:68;
    const project=(x:number,z:number)=>{
      const a=x*.35+time, b=z*.48-time*.55;
      const wave=Math.sin(a)*Math.cos(b)*.8+.3*Math.sin(x*.8+z*.4+time*1.6);
      const depth=1/(1+z*.045);
      return {x:w*.68+(x-17+pointerX*.5)*w*.031*depth,y:h*.52+(z*14-wave*65+pointerY*10)*depth,depth};
    };
    ctx.lineWidth=.65;
    for(let iz=0;iz<rows;iz++){
      const z=iz*.85;ctx.beginPath();
      for(let ix=0;ix<cols;ix++){const p=project(ix*.75,z);ix?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}
      ctx.strokeStyle=`rgba(74,177,224,${.055+.07*(1-iz/rows)})`;ctx.stroke();
    }
    for(let ix=0;ix<cols;ix+=2){ctx.beginPath();for(let iz=0;iz<rows;iz++){const p=project(ix*.75,iz*.85);iz?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y);}ctx.strokeStyle='rgba(72,179,211,.07)';ctx.stroke();}
    for(let i=0;i<65;i++){
      const x=((i*193.713)%w + (enabled?Math.sin(time*.4+i)*9:0)), y=(i*137.231)%h;
      const a=.06+.12*(.5+.5*Math.sin(time+i*4.2));ctx.fillStyle=`rgba(139,202,233,${a})`;ctx.beginPath();ctx.arc(x,y,i%7===0?1.4:.6,0,Math.PI*2);ctx.fill();
    }
  }
  frame=requestAnimationFrame(draw);
  return { get enabled(){return enabled;}, toggle(){enabled=!enabled;document.dispatchEvent(new CustomEvent('atlas-motion',{detail:enabled}));return enabled;},dispose(){cancelAnimationFrame(frame);removeEventListener('resize',resize);removeEventListener('pointermove',pointer);reduced.removeEventListener('change',preference);} };
}
