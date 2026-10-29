import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

(() => {
const $=id=>document.getElementById(id);
const canvas=$("stage");
let renderer,scene,camera,group,wordGroup,particles,ringA,ringB,logoPlane,materialFront,materialSide;
let running=true,raf=0,elapsed=0,last=performance.now(),recording=false,logoTexture=null;
const state={duration:8,effect:"reveal",motion:5,playing:true,exporting:false};
const clock=new THREE.Clock();

function color(id){return $(id).value}
function makeTextGeometry(text,size,depth){
  // Create actual extruded text from a procedural block font. This avoids external font files.
  const shapes=[];
  const map={
   A:[[0,1],[.18,0],[.38,0],[.56,1],[.43,1],[.38,.72],[.17,.72],[.12,1]],
   E:[[.05,0],[.48,0],[.48,.14],[.18,.14],[.18,.42],[.43,.42],[.43,.56],[.18,.56],[.18,.86],[.5,.86],[.5,1],[.05,1]],
   F:[[.05,0],[.5,0],[.5,.14],[.18,.14],[.18,.43],[.43,.43],[.43,.57],[.18,.57],[.18,1],[.05,1]],
   I:[[.12,0],[.42,0],[.42,.14],[.33,.14],[.33,.86],[.42,.86],[.42,1],[.12,1],[.12,.86],[.21,.86],[.21,.14],[.12,.14]],
   L:[[.06,0],[.2,0],[.2,.85],[.5,.85],[.5,1],[.06,1]],
   M:[[.03,1],[.03,0],[.18,0],[.3,.48],[.42,0],[.57,0],[.57,1],[.43,1],[.43,.38],[.34,.72],[.26,.72],[.17,.38],[.17,1]],
   N:[[.05,1],[.05,0],[.2,0],[.47,.67],[.47,0],[.62,0],[.62,1],[.47,1],[.2,.33],[.2,1]],
   O:[[.12,0],[.43,0],[.58,.16],[.58,.84],[.43,1],[.12,1],[0,.84],[0,.16]],
   R:[[.05,1],[.05,0],[.37,0],[.55,.13],[.55,.42],[.4,.53],[.58,1],[.42,1],[.27,.58],[.19,.58],[.19,1],[.05,1]],
   S:[[.48,.12],[.4,0],[.12,0],[0,.13],[0,.4],[.12,.5],[.38,.58],[.38,.82],[.3,.87],[.05,.87],[.05,1],[.39,1],[.53,.86],[.53,.55],[.4,.45],[.15,.38],[.15,.18],[.22,.14],[.48,.14]],
   T:[[0,0],[.55,0],[.55,.15],[.35,.15],[.35,1],[.2,1],[.2,.15],[0,.15]],
   V:[[0,0],[.16,0],[.28,.75],[.41,0],[.57,0],[.39,1],[.19,1]],
   X:[[0,0],[.17,0],[.29,.35],[.42,0],[.59,0],[.39,.5],[.59,1],[.42,1],[.29,.66],[.17,1],[0,1],[.2,.5]],
   ' ':[]
  };
  const chars=[...text.toUpperCase()].slice(0,12), total=chars.length;
  const width=size*.63, gap=size*.12;
  chars.forEach((ch,i)=>{
    const pts=map[ch]||map.R;
    if(!pts.length)return;
    const s=new THREE.Shape();
    pts.forEach((p,j)=>{const x=(i-(total-1)/2)*(width+gap)+(p[0]-.29)*width;const y=(.5-p[1])*size;if(j===0)s.moveTo(x,y);else s.lineTo(x,y);});
    s.closePath();shapes.push(s);
  });
  const geos=shapes.map(s=>new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:size*.012,bevelThickness:size*.012}));
  const merged=new THREE.BufferGeometry();
  // Build a group-like object by returning geometries as meshes, preserving real extrusion.
  return geos;
}
function clearGroup(g){while(g.children.length){const c=g.children.pop();if(c.geometry)c.geometry.dispose();if(c.material&&c.material.dispose)c.material.dispose();}}
function makeText(text){
  if(wordGroup){group.remove(wordGroup);wordGroup.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material)o.material.dispose();});}
  wordGroup=new THREE.Group();const geos=makeTextGeometry(text||"R",1.1,.22);
  geos.forEach((geo,i)=>{
    const front=new THREE.MeshStandardMaterial({color:color("violet"),metalness:.68,roughness:.24,emissive:color("violet"),emissiveIntensity:.18});
    const mesh=new THREE.Mesh(geo,front);mesh.castShadow=true;mesh.receiveShadow=true;wordGroup.add(mesh);
  });
  wordGroup.position.y=.1;group.add(wordGroup);
}
function addParticles(){
  const n=650,positions=new Float32Array(n*3),colors=new Float32Array(n*3);
  const c1=new THREE.Color(color("violet")),c2=new THREE.Color(color("cyan"));
  for(let i=0;i<n;i++){
    const r=2+Math.random()*8,a=Math.random()*Math.PI*2;
    positions[i*3]=Math.cos(a)*r;positions[i*3+1]=(Math.random()-.5)*12;positions[i*3+2]=Math.sin(a)*r-2;
    const c=Math.random()>.5?c1:c2;colors.set([c.r,c.g,c.b],i*3);
  }
  const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(positions,3));geo.setAttribute("color",new THREE.BufferAttribute(colors,3));
  const mat=new THREE.PointsMaterial({size:.035,vertexColors:true,transparent:true,opacity:.8,blending:THREE.AdditiveBlending,depthWrite:false});
  particles=new THREE.Points(geo,mat);scene.add(particles);
}
function init(){
 try{
  renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:"low-power"});
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.setSize(720,1280,false);
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
  scene=new THREE.Scene();scene.background=new THREE.Color(color("background"));scene.fog=new THREE.FogExp2(color("background"),.045);
  camera=new THREE.PerspectiveCamera(36,720/1280,.1,100);camera.position.set(0,0,13);
  group=new THREE.Group();scene.add(group);
  scene.add(new THREE.AmbientLight(0x8a8aa6,.85));
  const key=new THREE.PointLight(color("violet"),80,35);key.position.set(-4,4,7);scene.add(key);
  const rim=new THREE.PointLight(color("cyan"),65,30);rim.position.set(4,-1,4);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xffffff,2);fill.position.set(0,5,8);scene.add(fill);
  const ringGeo=new THREE.TorusGeometry(3.2,.018,8,180);
  ringA=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:color("cyan"),transparent:true,opacity:.7}));ringA.rotation.x=1.15;group.add(ringA);
  ringB=new THREE.Mesh(new THREE.TorusGeometry(3.8,.012,8,180),new THREE.MeshBasicMaterial({color:color("violet"),transparent:true,opacity:.6}));ringB.rotation.set(.5,.3,.8);group.add(ringB);
  addParticles();makeText($("logoText").value);
  const floor=new THREE.GridHelper(24,36,color("cyan"),0x252331);floor.position.y=-4.1;floor.material.transparent=true;floor.material.opacity=.2;scene.add(floor);
  setFormat();installDrag();renderLoop();
 }catch(e){$("fallback").hidden=false;console.error(e);}
}
function setFormat(){
 if(!renderer)return;
 const f=$("format").value;let w=720,h=1280;
 if(f==="square"){w=900;h=900;}else if(f==="wide"){w=1280;h=720;}
 renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 canvas.style.aspectRatio=`${w}/${h}`;canvas.style.width="100%";canvas.style.height="auto";
 canvas.width=w;canvas.height=h;
}
function updateScene(t){
 if(!group)return;
 const intensity=Number($("motion").value)/5;
 const effect=$("effect").value;
 const dur=Number($("duration").value);
 const p=Math.max(0,Math.min(1,t/dur));
 const intro=Math.min(1,Math.max(0,(p-.05)/.5));
 group.rotation.y=Math.sin(t*.7)*.12*intensity;
 group.rotation.x=Math.sin(t*.45)*.045*intensity;
 if(wordGroup){wordGroup.scale.setScalar(.45+intro*.55);wordGroup.rotation.y=Math.sin(t*.9)*.12*intensity;}
 if(ringA){ringA.rotation.z=t*.3*intensity;ringA.rotation.x=1.1+Math.sin(t*.5)*.18;}
 if(ringB){ringB.rotation.z=-t*.2*intensity;ringB.rotation.y=t*.12;}
 if(particles){
   particles.rotation.y=t*.025*intensity;
   particles.rotation.x=Math.sin(t*.17)*.04;
   particles.material.size=effect==="particles"?.055:.03;
   particles.material.opacity=effect==="energy"?.95:.72;
 }
 if(effect==="orbit"){camera.position.x=Math.sin(t*.32)*.7;camera.position.z=13+Math.cos(t*.32)*.4;}
 else {camera.position.x=Math.sin(t*.22)*.18;camera.position.z=13;}
 camera.lookAt(0,0,0);
 scene.background=new THREE.Color(color("background"));
}
function renderLoop(now){
 raf=requestAnimationFrame(renderLoop);
 const dt=Math.min(.05,(now-last)/1000||0);last=now;
 if(running){elapsed+=dt;updateScene(elapsed);}
 renderer.render(scene,camera);
}
function play(){elapsed=0;running=true;$("previewStatus").textContent="REPRODUZINDO";$("playBtn").textContent="Ⅱ Reproduzindo";}
function reset(){elapsed=0;running=false;updateScene(0);renderer.render(scene,camera);$("previewStatus").textContent="PRONTO";$("playBtn").textContent="▶ Reproduzir";}
function refresh(){const wasRunning=running;running=false;
 if(group){scene.background=new THREE.Color(color("background"));scene.fog.color.set(color("background"));
  // update lights and material colors without rebuilding scene
  scene.traverse(o=>{if(o.isPointLight && o.color){if(o.position.x<0)o.color.set(color("violet"));else if(o.position.x>0)o.color.set(color("cyan"));}});
  if(ringA)ringA.material.color.set(color("cyan"));if(ringB)ringB.material.color.set(color("violet"));
  makeText($("logoText").value||"R");
  if(particles){scene.remove(particles);particles.geometry.dispose();particles.material.dispose();addParticles();}
  updateScene(elapsed);renderer.render(scene,camera);
 }
 running=wasRunning;$("previewStatus").textContent="ATUALIZADO";
}
function installDrag(){
 let down=false,x=0,y=0;
 canvas.addEventListener("pointerdown",e=>{down=true;x=e.clientX;y=e.clientY;canvas.setPointerCapture(e.pointerId);});
 canvas.addEventListener("pointermove",e=>{if(!down||!group)return;const dx=e.clientX-x,dy=e.clientY-y;x=e.clientX;y=e.clientY;group.rotation.y+=dx*.008;group.rotation.x+=dy*.006;running=false;renderer.render(scene,camera);});
 canvas.addEventListener("pointerup",()=>down=false);canvas.addEventListener("pointercancel",()=>down=false);
}
$("playBtn").addEventListener("click",play);$("resetBtn").addEventListener("click",reset);
$("applyBtn").addEventListener("click",()=>{setFormat();refresh();});
["logoText","effect","violet","cyan","background","motion"].forEach(id=>$(id).addEventListener("change",refresh));
$("format").addEventListener("change",()=>{setFormat();refresh();});
$("duration").addEventListener("change",()=>{state.duration=Number($("duration").value);});
$("logoFile").addEventListener("change",e=>{
 const f=e.target.files&&e.target.files[0];if(!f)return;
 if(f.size>8*1024*1024){alert("Escolha uma imagem de até 8 MB para melhor desempenho no celular.");e.target.value="";return;}
 const url=URL.createObjectURL(f);new THREE.TextureLoader().load(url,tex=>{
  if(logoTexture)logoTexture.dispose();logoTexture=tex;logoTexture.colorSpace=THREE.SRGBColorSpace;
  if(logoPlane){group.remove(logoPlane);logoPlane.geometry.dispose();logoPlane.material.dispose();}
  const mat=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false});
  logoPlane=new THREE.Mesh(new THREE.PlaneGeometry(3.5,2),mat);logoPlane.position.z=.5;group.add(logoPlane);URL.revokeObjectURL(url);refresh();
 },undefined,()=>{URL.revokeObjectURL(url);alert("Não foi possível carregar a imagem.");});
});
$("screenshotBtn").addEventListener("click",()=>{
 renderer.render(scene,camera);canvas.toBlob(blob=>{if(!blob){alert("Não foi possível salvar a imagem.");return;}
 const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="vfx-motion-frame.png";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000);},"image/png");
});
async function exportVideo(){
 if(!("MediaRecorder" in window)||!canvas.captureStream){alert("Este navegador não oferece gravação de canvas WebGL. Atualize o Chrome Android.");return;}
 $("exportBtn").disabled=true;$("downloadLink").hidden=true;$("progressBar").style.width="0%";
 const total=Number($("duration").value),stream=canvas.captureStream(30),types=["video/webm;codecs=vp9","video/webm;codecs=vp8","video/webm"];
 const mime=types.find(t=>MediaRecorder.isTypeSupported(t))||"";
 let recorder;const chunks=[];
 try{recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:4500000}:undefined);}
 catch(e){stream.getTracks().forEach(t=>t.stop());$("exportBtn").disabled=false;$("exportStatus").textContent="Gravação não suportada neste aparelho.";return;}
 let start=performance.now(),prevRunning=running;running=true;elapsed=0;
 $("exportStatus").textContent="Renderizando localmente… mantenha a página aberta.";
 recorder.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
 recorder.onerror=()=>{$("exportStatus").textContent="A gravação foi interrompida pelo navegador.";};
 recorder.onstop=()=>{
   stream.getTracks().forEach(t=>t.stop());running=prevRunning;
   const blob=new Blob(chunks,{type:recorder.mimeType||"video/webm"}),url=URL.createObjectURL(blob);
   const link=$("downloadLink");link.href=url;link.download=`vfx-motion-${Date.now()}.webm`;link.textContent=`Baixar vídeo WebM (${(blob.size/1048576).toFixed(1)} MB)`;link.hidden=false;
   $("exportStatus").textContent="Renderização concluída. Toque para salvar o vídeo.";$("progressBar").style.width="100%";$("exportBtn").disabled=false;$("previewStatus").textContent="EXPORTADO";
 };
 recorder.start(200);
 function tick(now){
  const t=Math.min(total,(now-start)/1000);elapsed=t;updateScene(t);renderer.render(scene,camera);
  $("progressBar").style.width=`${t/total*100}%`;$("exportStatus").textContent=`Renderizando no aparelho… ${Math.floor(t/total*100)}%`;
  if(t<total&&recorder.state==="recording")requestAnimationFrame(tick);else if(recorder.state==="recording")recorder.stop();
 }
 requestAnimationFrame(tick);
}
$("exportBtn").addEventListener("click",exportVideo);
function projectData(){return {app:"VFX Motion AI",version:2,logoText:$("logoText").value,tagline:$("tagline").value,effect:$("effect").value,duration:$("duration").value,format:$("format").value,violet:color("violet"),cyan:color("cyan"),background:color("background"),motion:$("motion").value};}
$("saveProject").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(projectData(),null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="vfx-motion-project.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);});
$("importProject").addEventListener("change",async e=>{const f=e.target.files&&e.target.files[0];if(!f)return;try{const d=JSON.parse(await f.text());for(const k of ["logoText","tagline","effect","duration","format","violet","cyan","background","motion"])if(d[k]!=null&&$(k))$(k).value=d[k];setFormat();refresh();alert("Projeto importado.");}catch(err){alert("Arquivo de projeto inválido.");}e.target.value="";});
let deferredPrompt=null;window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").hidden=false;});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt){alert("No Chrome Android, abra o menu ⋮ e escolha Instalar app ou Adicionar à tela inicial.");return;}deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").hidden=true;});
if("serviceWorker"in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
// Pause the render loop while the tab is backgrounded to reduce battery use on Android.
document.addEventListener("visibilitychange",()=>{
 if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;}
 else if(!raf){last=performance.now();raf=requestAnimationFrame(renderLoop);}
});
init();
})();