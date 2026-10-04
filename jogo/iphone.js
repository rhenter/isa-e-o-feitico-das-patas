'use strict';
(()=>{
 const coarse=window.matchMedia?.('(pointer: coarse)').matches;
 if(!coarse)return;
 const updateViewport=()=>{document.documentElement.style.setProperty('--app-height',`${Math.round(window.visualViewport?.height||window.innerHeight)}px`);requestAnimationFrame(()=>{resize();if(player)camera=clamp(player.x-W*.37,0,Math.max(0,worldWidth()-W));});};
 window.addEventListener('resize',updateViewport);window.visualViewport?.addEventListener('resize',updateViewport);updateViewport();
 // Independent pointer ownership permits movement, jumping and attack together.
 const owners=new Map();
 const clear=()=>{owners.clear();keys={};pressed={};document.querySelectorAll('[data-control]').forEach(b=>b.classList.remove('is-held'));};
 document.querySelectorAll('[data-control]').forEach(b=>{
  const k=b.dataset.control;
  b.onpointerdown=e=>{e.preventDefault();if(mode!=='play')return;b.setPointerCapture(e.pointerId);owners.set(e.pointerId,k);if(!keys[k])pressed[k]=true;keys[k]=true;b.classList.add('is-held');};
  b.onpointerup=b.onpointercancel=b.onlostpointercapture=e=>{owners.delete(e.pointerId);keys[k]=[...owners.values()].includes(k);if(!keys[k])b.classList.remove('is-held');};
 });
 window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();});
 const note=document.getElementById('ios-install');if(note){const apple=/iPhone|iPad|iPod/.test(navigator.userAgent);note.hidden=!apple||navigator.standalone||window.matchMedia('(display-mode: standalone)').matches;}
})();
