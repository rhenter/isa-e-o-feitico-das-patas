'use strict';
(()=>{
 let index=0,muted=true,cinema=false,active=false,context=null,current=null,request=0;
 const buffers=new Map(),pending=new Map(),offsets=[0,0,0],names=['forest','desert','dark'];
 const url=n=>typeof ASSET_URLS==='undefined'?'assets/rock-'+names[n]+'.mp3':ASSET_URLS['rock-'+names[n]];
 function ensure(){if(!context){const Type=window.AudioContext||window.webkitAudioContext;if(!Type)return false;context=new Type();}context.resume().catch(()=>{});return true;}
 function volume(){return cinema?.14:.32;}
 function stop(fade=0){if(!current)return;const old=current;current=null;offsets[old.index]=(old.offset+Math.max(0,context.currentTime-old.started))%old.buffer.duration;old.gain.gain.cancelScheduledValues(context.currentTime);old.gain.gain.setValueAtTime(old.gain.gain.value,context.currentTime);old.gain.gain.linearRampToValueAtTime(0,context.currentTime+fade);try{old.source.stop(context.currentTime+fade+.01);}catch{}}
 async function buffer(n){if(buffers.has(n))return buffers.get(n);if(!pending.has(n)){pending.set(n,fetch(url(n)).then(r=>{if(!r.ok)throw new Error('music');return r.arrayBuffer();}).then(b=>context.decodeAudioData(b)).then(b=>{buffers.set(n,b);pending.delete(n);return b;}).catch(e=>{pending.delete(n);throw e;}));}return pending.get(n);}
 async function play(){const ticket=++request;if(muted||!active||!ensure())return;const n=index;
  try{const b=await buffer(n);if(ticket!==request||muted||!active||n!==index)return;if(current?.index===n)return;stop(.25);const source=context.createBufferSource(),gain=context.createGain();source.buffer=b;source.loop=true;source.connect(gain);gain.connect(context.destination);gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(volume(),context.currentTime+.3);const offset=offsets[n]%b.duration;source.start(0,offset);source.onended=()=>{source.disconnect();gain.disconnect();};current={source,gain,buffer:b,index:n,started:context.currentTime,offset};}catch{}
 }
 window.RockAudio={setMuted(v){muted=v;if(v){++request;stop();}else play();},select(n){index=n%3;active=true;play();},pause(){active=false;++request;stop();},resume(){active=true;play();},cinematic(v){cinema=v;if(current)current.gain.gain.setTargetAtTime(volume(),context.currentTime,.16);}};
})();
