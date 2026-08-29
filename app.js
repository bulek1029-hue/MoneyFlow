const $=s=>document.querySelector(s);
const fileInput=$("#gameFile"), fileInfo=$("#fileInfo"), status=$("#status"), screenMsg=$("#screenMsg");
let mode="win32";

fileInput.addEventListener("change",()=>{
  const files=[...fileInput.files];
  fileInfo.textContent=files.length?files.map(f=>`${f.name} (${Math.round(f.size/1024/1024*10)/10} MB)`).join(" • "):"Nie wybrano plików";
  if(files.length){
    status.textContent="Pliki załadowane lokalnie — runtime emulatora oczekuje na podłączenie";
    screenMsg.innerHTML="<strong>PLIKI GRY WYBRANE</strong><span>Runtime emulatora można podłączyć do tego interfejsu.</span>";
  }
});

document.querySelectorAll(".mode").forEach(b=>b.onclick=()=>{
  document.querySelectorAll(".mode").forEach(x=>x.classList.remove("active"));
  b.classList.add("active"); mode=b.dataset.mode;
  $("#modeText").textContent=mode==="win32"
    ?"Tryb Windows 32-bit jest eksperymentalny. KOTOR 2 jest grą Windows, nie DOS, więc kompatybilność zależy od silnika WASM."
    :"Tryb DOS działa najlepiej z klasycznymi grami DOS i może korzystać z DOSBox/js-dos.";
});

$("#fsBtn").onclick=()=>{
  document.documentElement.classList.toggle("fullscreen");
  if(document.documentElement.classList.contains("fullscreen")) document.documentElement.requestFullscreen?.().catch(()=>{});
  else document.exitFullscreen?.().catch(()=>{});
};

document.querySelectorAll("[data-key]").forEach(btn=>{
  const key=btn.dataset.key;
  const down=()=>window.dispatchEvent(new KeyboardEvent("keydown",{key,code:key,bubbles:true}));
  const up=()=>window.dispatchEvent(new KeyboardEvent("keyup",{key,code:key,bubbles:true}));
  ["pointerdown","touchstart"].forEach(e=>btn.addEventListener(e,down,{passive:true}));
  ["pointerup","pointercancel","pointerleave","touchend"].forEach(e=>btn.addEventListener(e,up,{passive:true}));
});

// Virtual joystick: emits keyboard-style WASD events for a future runtime.
const stick=$("#stick"), knob=stick.querySelector(".stickKnob");
let active=false, last=[];
function joy(e){
  const r=stick.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let dx=e.clientX-cx, dy=e.clientY-cy, max=r.width*.28;
  const len=Math.hypot(dx,dy); if(len>max){dx*=max/len;dy*=max/len}
  knob.style.transform=`translate(${dx}px,${dy}px)`;
  const keys=[];
  if(dy<-max*.25)keys.push("KeyW"); if(dy>max*.25)keys.push("KeyS");
  if(dx<-max*.25)keys.push("KeyA"); if(dx>max*.25)keys.push("KeyD");
  last.filter(k=>!keys.includes(k)).forEach(k=>window.dispatchEvent(new KeyboardEvent("keyup",{code:k,key:k.replace("Key","").toLowerCase()})));
  keys.filter(k=>!last.includes(k)).forEach(k=>window.dispatchEvent(new KeyboardEvent("keydown",{code:k,key:k.replace("Key","").toLowerCase()})));
  last=keys;
}
stick.addEventListener("pointerdown",e=>{active=true;stick.setPointerCapture(e.pointerId);joy(e)});
stick.addEventListener("pointermove",e=>active&&joy(e));
stick.addEventListener("pointerup",()=>{active=false;last.forEach(k=>window.dispatchEvent(new KeyboardEvent("keyup",{code:k})));last=[];knob.style.transform=""});

const pad=$("#touchpad");
let px=0,py=0;
pad.addEventListener("pointerdown",e=>{px=e.clientX;py=e.clientY;pad.setPointerCapture(e.pointerId)});
pad.addEventListener("pointermove",e=>{
  if(!px)return;
  const dx=e.clientX-px,dy=e.clientY-py;
  window.dispatchEvent(new CustomEvent("virtual-mouse",{detail:{dx,dy}}));
  px=e.clientX;py=e.clientY;
});
pad.addEventListener("pointerup",()=>{px=py=0});

// PWA install metadata is handled by the browser.
