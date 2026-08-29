const WEMU="https://wemu.dev/";
const app=document.querySelector("#app");
const player=document.querySelector("#player");
const area=document.querySelector("#gameArea");
const runtime=document.querySelector("#runtime");
const gamepad=document.querySelector("#gamepad");
const screenHint=document.querySelector("#screenHint");
const editToggle=document.querySelector("#editToggle");
const sizeRange=document.querySelector("#sizeRange");

const defaultPositions={
  stick:{left:3.5,bottom:7,width:24},
  mouse:{right:29,bottom:5,width:31,height:27},
  buttons:{right:4,bottom:8,width:25},
  shoulders:{left:4,top:5,width:92},
  quick:{left:50,top:4}
};
let positions=JSON.parse(localStorage.getItem("pcgw-layout")||"null")||structuredClone(defaultPositions);
let mappings=JSON.parse(localStorage.getItem("pcgw-map")||"{}");
let dragging=null;
let pointerStart=null;
let origin=null;

function clamp(v,min,max){return Math.max(min,Math.min(max,v))}
function save(){localStorage.setItem("pcgw-layout",JSON.stringify(positions));localStorage.setItem("pcgw-map",JSON.stringify(mappings))}
function applyPositions(){
  document.querySelectorAll(".control").forEach(el=>{
    const p=positions[el.dataset.control]; if(!p)return;
    el.style.left=p.left!=null?p.left+"%":"";
    el.style.right=p.right!=null?p.right+"%":"";
    el.style.top=p.top!=null?p.top+"%":"";
    el.style.bottom=p.bottom!=null?p.bottom+"%":"";
    if(p.width!=null)el.style.width=p.width+"%";
    if(p.height!=null)el.style.height=p.height+"%";
  });
}
applyPositions();

document.querySelector("#launchBtn").onclick=()=>{
  player.scrollIntoView({behavior:"smooth",block:"start"});
  runtime.src=WEMU;
  screenHint.style.display="none";
};
document.querySelector("#newTabBtn").onclick=()=>window.open(WEMU,"_blank","noopener");

document.querySelector("#fullscreenBtn").onclick=async()=>{
  app.classList.toggle("fullscreen");
  if(app.classList.contains("fullscreen")){
    try{await app.requestFullscreen?.()}catch(e){}
  }else{
    try{await document.exitFullscreen?.()}catch(e){}
  }
};

editToggle.onchange=()=>{
  gamepad.classList.toggle("editing",editToggle.checked);
  document.body.style.overflow=editToggle.checked?"hidden":"";
};

sizeRange.oninput=()=>{
  const factor=Number(sizeRange.value)/100;
  const s=positions.stick; s.width=clamp(24*factor,16,36);
  const b=positions.buttons; b.width=clamp(25*factor,18,37);
  const m=positions.mouse; m.width=clamp(31*factor,20,45); m.height=clamp(27*factor,18,40);
  applyPositions(); save();
};

document.querySelector("#resetLayout").onclick=()=>{
  positions=structuredClone(defaultPositions); sizeRange.value=100; applyPositions(); save();
};

document.querySelectorAll(".screenMode").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".screenMode").forEach(x=>x.classList.remove("active"));
  btn.classList.add("active");
  area.style.aspectRatio=btn.dataset.ratio;
});

document.querySelectorAll("[data-map]").forEach(sel=>{
  const original=sel.dataset.map;
  if(mappings[original])sel.value=mappings[original];
  sel.onchange=()=>{mappings[original]=sel.value; save(); updateButtonLabels()};
});
function updateButtonLabels(){
  document.querySelectorAll(".padBtn").forEach(btn=>{
    const original=btn.dataset.key;
    const mapped=mappings[original]||original;
    btn.textContent=mapped==="Space"?"A":mapped.replace("Key","");
  });
}
updateButtonLabels();

function emitKey(type,key){
  const target=runtime.contentWindow;
  const ev={type,key,code:key,bubbles:true};
  try{target.postMessage({source:"PCGW",event:"keyboard",...ev},"*")}catch(e){}
  window.dispatchEvent(new KeyboardEvent(type,{key,code:key,bubbles:true}));
}
document.querySelectorAll("[data-key]").forEach(btn=>{
  let active=false;
  const original=btn.dataset.key;
  const getKey=()=>mappings[original]||original;
  btn.addEventListener("pointerdown",e=>{e.preventDefault();active=true;btn.setPointerCapture?.(e.pointerId);emitKey("keydown",getKey())});
  ["pointerup","pointercancel","pointerleave"].forEach(type=>btn.addEventListener(type,e=>{
    if(!active)return;active=false;e.preventDefault();emitKey("keyup",getKey());
  }));
});

// Joystick: WASD + pointer movement. Also sends a postMessage hook for a compatible runtime.
const stick=document.querySelector(".stickWrap"), knob=document.querySelector(".stickKnob");
let joyKeys=[];
function joyMove(e){
  const r=stick.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  let dx=e.clientX-cx,dy=e.clientY-cy,max=r.width*.28,len=Math.hypot(dx,dy);
  if(len>max){dx*=max/len;dy*=max/len}
  knob.style.transform=`translate(${dx}px,${dy}px)`;
  const next=[];
  if(dy<-max*.25)next.push("KeyW"); if(dy>max*.25)next.push("KeyS");
  if(dx<-max*.25)next.push("KeyA"); if(dx>max*.25)next.push("KeyD");
  joyKeys.filter(k=>!next.includes(k)).forEach(k=>emitKey("keyup",k));
  next.filter(k=>!joyKeys.includes(k)).forEach(k=>emitKey("keydown",k));
  joyKeys=next;
}
function joyEnd(){joyKeys.forEach(k=>emitKey("keyup",k));joyKeys=[];knob.style.transform=""}
stick.addEventListener("pointerdown",e=>{if(!editToggle.checked){stick.setPointerCapture(e.pointerId);joyMove(e)}});
stick.addEventListener("pointermove",e=>{if(!editToggle.checked&&stick.hasPointerCapture(e.pointerId))joyMove(e)});
stick.addEventListener("pointerup",joyEnd);stick.addEventListener("pointercancel",joyEnd);

// Drag controls in editor mode.
document.querySelectorAll(".control").forEach(el=>{
  el.addEventListener("pointerdown",e=>{
    if(!editToggle.checked||el.dataset.control==="stick"&&e.target===knob)return;
    e.preventDefault();el.setPointerCapture?.(e.pointerId);
    const r=area.getBoundingClientRect(), p=positions[el.dataset.control];
    dragging=el;pointerStart={x:e.clientX,y:e.clientY};origin={...p,r};
  });
  el.addEventListener("pointermove",e=>{
    if(!dragging||dragging!==el)return;
    const dx=(e.clientX-pointerStart.x)/origin.r.width*100;
    const dy=(e.clientY-pointerStart.y)/origin.r.height*100;
    const p=positions[el.dataset.control];
    if(p.left!=null){p.left=clamp(origin.left+dx,0,100-(p.width||8))}
    if(p.right!=null){p.right=clamp(origin.right-dx,0,100-(p.width||8))}
    if(p.top!=null){p.top=clamp(origin.top+dy,0,100-8)}
    if(p.bottom!=null){p.bottom=clamp(origin.bottom-dy,0,100-8)}
    applyPositions();
  });
  el.addEventListener("pointerup",()=>{if(dragging===el){dragging=null;save()}});
  el.addEventListener("pointercancel",()=>{dragging=null});
});

// Touchpad sends mouse-like deltas through postMessage. A compatible runtime can consume them.
const pad=document.querySelector(".mousePad");
let lastX=0,lastY=0;
pad.addEventListener("pointerdown",e=>{if(editToggle.checked)return;pad.setPointerCapture(e.pointerId);lastX=e.clientX;lastY=e.clientY});
pad.addEventListener("pointermove",e=>{
  if(editToggle.checked||!pad.hasPointerCapture(e.pointerId))return;
  const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;
  try{runtime.contentWindow.postMessage({source:"PCGW",event:"mouse",dx,dy},"*")}catch(err){}
});
pad.addEventListener("pointerup",e=>{try{pad.releasePointerCapture(e.pointerId)}catch(err){}});

// Forward messages from a compatible embedded runtime back to our UI.
window.addEventListener("message",e=>{
  if(e.data?.source==="WEMU") screenHint.style.display="none";
});
