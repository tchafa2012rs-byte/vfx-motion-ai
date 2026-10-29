(() => {
  const $ = (id) => document.getElementById(id);
  const canvas = $("stage");
  const ctx = canvas.getContext("2d", { alpha: false });
  const state = { playing: false, start: 0, raf: 0, logoImage: null, imageReady: false, lastT: 0, recorder: null, chunks: [] };
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resizeCanvas() {
    const f = $("format").value;
    const sizes = f === "square" ? [900,900] : f === "wide" ? [1280,720] : [720,1280];
    canvas.width = sizes[0]; canvas.height = sizes[1];
    draw(0);
  }
  function hexRgb(hex) { const n = parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
  function rgba(hex,a) { const c=hexRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
  function roundRect(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
  function textFit(text, maxWidth, preferred) {
    let size=preferred; ctx.font=`900 ${size}px system-ui, sans-serif`;
    while(ctx.measureText(text).width>maxWidth && size>18){size-=2;ctx.font=`900 ${size}px system-ui, sans-serif`;}
    return size;
  }
  function draw(t=0) {
    const W=canvas.width,H=canvas.height, cx=W/2, cy=H*.46;
    const violet=$("violet").value, cyan=$("cyan").value, bg=$("background").value;
    const duration=Number($("duration").value), p=Math.max(0,Math.min(1,t/duration));
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);

    // Soft atmospheric light, all rendered locally.
    let glow=ctx.createRadialGradient(cx,cy,2,cx,cy,W*.62);
    glow.addColorStop(0,rgba(violet,.24));glow.addColorStop(.48,rgba(cyan,.055));glow.addColorStop(1,rgba(bg,0));
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);

    // Faint technical grid.
    ctx.save();ctx.globalAlpha=.12;ctx.strokeStyle=cyan;ctx.lineWidth=1;
    const grid= Math.max(35,Math.round(W/18));
    for(let x=0;x<W;x+=grid){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=grid){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}
    ctx.restore();

    const effect=$("effect").value;
    const reveal=Math.min(1,Math.max(0,(p-.05)/.55));
    const angle=(t*.65);
    // Orbiting light rings.
    if(effect==="orbit" || effect==="reveal" || effect==="energy"){
      ctx.save();ctx.translate(cx,cy);ctx.rotate(angle*.2);
      ctx.strokeStyle=rgba(cyan,.42);ctx.lineWidth=Math.max(1,W*.002);
      ctx.beginPath();ctx.ellipse(0,0,W*.28,H*.095,0,0,Math.PI*2);ctx.stroke();
      ctx.strokeStyle=rgba(violet,.65);ctx.beginPath();ctx.ellipse(0,0,W*.32,H*.12,-.3,Math.PI*.12,Math.PI*1.75);ctx.stroke();
      ctx.restore();
    }

    // Particle field with deterministic positions.
    const count=effect==="particles"?130:75;
    for(let i=0;i<count;i++){
      const seed=i*127.1+33.3;
      const x=((Math.sin(seed)*43758.5453)%1+1)%1*W;
      const y=((Math.cos(seed*1.7)*24634.6345)%1+1)%1*H;
      const drift=(t*18*(i%3+1))%H;
      const px=(x+Math.sin(t*.5+i)*W*.015+W)%W;
      const py=(y-drift+H)%H;
      const alpha=.2+.55*(.5+.5*Math.sin(t*2+i));
      ctx.fillStyle=i%4===0?rgba(cyan,alpha):rgba(violet,alpha);
      ctx.beginPath();ctx.arc(px,py,Math.max(1,W*(i%7===0?.003:.0012)),0,Math.PI*2);ctx.fill();
    }

    // Center symbol: a layered extrusion creates a faux-3D depth effect.
    const symbol=($("logoText").value||"R").trim().slice(0,12);
    const baseSize=Math.min(W*.52, H*.2);
    const scale=.45+reveal*.55;
    const rotY=Math.sin(t*.9)*.17*(effect==="reveal"?1:.4);
    const skew=rotY*W*.1;
    ctx.save();ctx.translate(cx,cy);ctx.scale(scale,scale);
    const size=textFit(symbol,W*.62,baseSize);
    // depth layers
    for(let d=18;d>=1;d--){
      ctx.save();ctx.translate(d*W*.0017+skew*d*.12,d*H*.0007);
      ctx.font=`900 ${size}px system-ui, sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
      ctx.fillStyle=d%2?rgba(violet,.9):rgba(cyan,.85);ctx.fillText(symbol,0,0);
      ctx.restore();
    }
    ctx.shadowBlur=W*.065;ctx.shadowColor=violet;
    const grad=ctx.createLinearGradient(-W*.2,-H*.08,W*.2,H*.08);
    grad.addColorStop(0,"#f5f7fa");grad.addColorStop(.45,violet);grad.addColorStop(1,cyan);
    ctx.font=`900 ${size}px system-ui, sans-serif`;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.fillStyle=grad;ctx.fillText(symbol,0,0);ctx.shadowBlur=0;

    if(state.logoImage){
      const img=state.logoImage, maxW=W*.58,maxH=H*.2, ratio=Math.min(maxW/img.width,maxH/img.height);
      const iw=img.width*ratio,ih=img.height*ratio;
      ctx.globalAlpha=reveal;ctx.drawImage(img,-iw/2,-ih/2,iw,ih);
    }
    ctx.restore();

    // Subtle floor line and title lockup.
    ctx.save();ctx.globalAlpha=.65;
    const lineY=cy+H*.12;ctx.strokeStyle=rgba(cyan,.6);ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(W*.22,lineY);ctx.lineTo(W*.78,lineY);ctx.stroke();ctx.restore();
    const tagline=($("tagline").value||"").trim().toUpperCase();
    if(tagline){
      ctx.save();ctx.globalAlpha=Math.min(1,Math.max(0,(p-.3)*3));
      ctx.fillStyle="#F5F7FA";ctx.textAlign="center";ctx.textBaseline="middle";
      const ts=Math.min(W*.035,22);ctx.font=`600 ${ts}px system-ui, sans-serif`;ctx.letterSpacing="3px";
      ctx.fillText(tagline,cx,cy+H*.17,W*.8);ctx.restore();
    }
    ctx.save();ctx.fillStyle="rgba(245,247,250,.35)";ctx.textAlign="center";ctx.font=`600 ${Math.max(9,W*.015)}px system-ui,sans-serif`;
    ctx.fillText("VFX MOTION AI  •  LOCAL RENDER",cx,H*.93);ctx.restore();
    if(t===0){$("canvasHint").style.display="block";} else {$("canvasHint").style.display="none";}
  }
  function animate(now) {
    if(!state.playing)return;
    const t=(now-state.start)/1000;state.lastT=t;
    draw(t);
    if(t>=Number($("duration").value)){state.playing=false;$("previewStatus").textContent="CONCLUÍDO";$("playBtn").textContent="▶ Reproduzir";draw(Number($("duration").value));return;}
    state.raf=requestAnimationFrame(animate);
  }
  function play() {
    cancelAnimationFrame(state.raf);state.playing=true;state.start=performance.now();$("previewStatus").textContent="REPRODUZINDO";$("playBtn").textContent="Ⅱ Reproduzindo";
    animate(state.start);
  }
  $("playBtn").addEventListener("click",play);
  $("resetBtn").addEventListener("click",()=>{state.playing=false;cancelAnimationFrame(state.raf);$("previewStatus").textContent="PRONTO";$("playBtn").textContent="▶ Reproduzir";draw(0);});
  $("applyBtn").addEventListener("click",()=>{resizeCanvas();$("previewStatus").textContent="ATUALIZADO";});
  ["effect","duration","format","violet","cyan","background","logoText","tagline"].forEach(id=>{
    $(id).addEventListener("change",()=>{if(id==="format")resizeCanvas();else draw(0);});
    if(["logoText","tagline"].includes(id))$(id).addEventListener("input",()=>draw(0));
  });
  $("logoFile").addEventListener("change",e=>{
    const file=e.target.files && e.target.files[0];if(!file)return;
    if(file.size>12*1024*1024){alert("Escolha uma imagem de até 12 MB para funcionar melhor no celular.");e.target.value="";return;}
    const url=URL.createObjectURL(file),img=new Image();
    img.onload=()=>{state.logoImage=img;draw(0);URL.revokeObjectURL(url);};
    img.onerror=()=>{alert("Não foi possível abrir essa imagem.");URL.revokeObjectURL(url);};
    img.src=url;
  });
  $("clearLogo").addEventListener("click",()=>{state.logoImage=null;$("logoFile").value="";draw(0);});

  async function exportVideo() {
    if(!("MediaRecorder" in window) || !canvas.captureStream){alert("Seu navegador não oferece gravação de canvas. Tente a versão atual do Chrome no Android.");return;}
    const btn=$("exportBtn"),status=$("exportStatus"),bar=$("progressBar"),link=$("downloadLink");
    btn.disabled=true;link.hidden=true;bar.style.width="0%";status.textContent="Preparando renderização local…";
    state.chunks=[];
    const stream=canvas.captureStream(30);
    const mimeCandidates=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
    const mime=mimeCandidates.find(m=>MediaRecorder.isTypeSupported(m))||"";
    let recorder;
    try { recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:4_000_000}:undefined); }
    catch(e){stream.getTracks().forEach(t=>t.stop());btn.disabled=false;status.textContent="Não foi possível iniciar o gravador neste navegador.";return;}
    state.recorder=recorder;
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)state.chunks.push(e.data);};
    recorder.onerror=()=>{status.textContent="O navegador interrompeu a gravação. Tente reduzir a duração.";btn.disabled=false;stream.getTracks().forEach(t=>t.stop());};
    recorder.onstop=()=>{
      stream.getTracks().forEach(t=>t.stop());
      const blob=new Blob(state.chunks,{type:recorder.mimeType||"video/webm"});
      const url=URL.createObjectURL(blob);
      link.href=url;link.download=`vfx-motion-${Date.now()}.webm`;link.textContent=`Baixar vídeo (${(blob.size/1024/1024).toFixed(1)} MB)`;link.hidden=false;
      status.textContent="Vídeo pronto. Toque em “Baixar vídeo” e escolha onde salvar.";
      bar.style.width="100%";btn.disabled=false;$("previewStatus").textContent="EXPORTADO";
    };
    recorder.start(250);
    const total=Number($("duration").value),started=performance.now();
    function frame(now){
      const t=Math.min(total,(now-started)/1000);draw(t);
      bar.style.width=`${Math.min(99,t/total*100)}%`;status.textContent=`Renderizando no aparelho… ${Math.floor(t/total*100)}%`;
      if(t<total){requestAnimationFrame(frame);}else{setTimeout(()=>{try{recorder.stop();}catch(e){}},180);}
    }
    requestAnimationFrame(frame);
  }
  $("exportBtn").addEventListener("click",exportVideo);

  let deferredPrompt=null;
  window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false;});
  $("installBtn").addEventListener("click",async()=>{
    if(!deferredPrompt){alert("No Chrome Android: abra o menu ⋮ e toque em “Instalar app” ou “Adicionar à tela inicial”.");return;}
    deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").hidden=true;
  });
  if("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost")) {
    window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
  }
  resizeCanvas();
})();