const WEMU="https://wemu.dev/";
const zip=document.querySelector("#zip"), selected=document.querySelector("#selected");
const start=document.querySelector("#start"), ready=document.querySelector("#ready");
const gameName=document.querySelector("#gameName"), library=document.querySelector("#library");
let current=null;

zip.addEventListener("change",()=>{
 const f=zip.files[0];
 if(!f){current=null;selected.textContent="Nie wybrano gry";start.disabled=true;return}
 if(!/\.zip$/i.test(f.name)){selected.textContent="Wybierz plik ZIP.";start.disabled=true;return}
 current=f;
 selected.textContent=`${f.name} • ${(f.size/1048576).toFixed(1)} MB`;
 start.disabled=false;
});

start.onclick=()=>{
 if(!current)return;
 gameName.textContent=current.name;
 ready.classList.remove("hidden");
 library.innerHTML=`<div class="gameItem"><div><b>${escapeHtml(current.name)}</b><span>${(current.size/1048576).toFixed(1)} MB • lokalnie</span></div><button id="launch2" type="button">START</button></div>`;
 document.querySelector("#launch2").onclick=openRuntime;
 ready.scrollIntoView({behavior:"smooth",block:"center"});
};

document.querySelector("#openWemu").onclick=openRuntime;
document.querySelector("#copyInfo").onclick=()=>{
 alert("1. Otwórz wemu.\\n2. Wybierz swój ZIP.\\n3. Wybierz EXE gry.\\n4. Uruchom.\\n\\nGra pozostaje na Twoim urządzeniu.");
};

function openRuntime(){
 window.open(WEMU,"_blank","noopener");
}
document.querySelector("#fs").onclick=async()=>{
 try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(e){}
};
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
