'use strict';
const $=id=>document.getElementById(id), canvas=$('canvas'),ctx=canvas.getContext('2d');
let W=1280,H=720,t=0,last=0,mode='menu',level=0,score=0,hearts=3,camera=0,checkpoint=100,ingredients=[],elapsed=0,muted=true,ready=false;
let player,dog,platforms=[],gems=[],enemies=[],particles=[],gate,item,boss,projectiles=[],barkRings=[],keys={},pressed={},jumpBuffer=0,coyote=0,invuln=0,barkCD=0,dialogueUntil=0,toastUntil=0,bossTimer=0,modalAction=null,previousMode='menu';
const SAVE='isa-patas-v5',assets={},names=['girl-idle','girl-run1','girl-run2','girl-jump','dog','father','witch','potion','world','desert','darkwood',...Array.from({length:4},(_,i)=>'skate-'+i),...Array.from({length:4},(_,i)=>'spin-'+i),'beetle','mushroom','scorpion','scarab','bat','ghost','dog-run0','dog-run1','home',...Array.from({length:4},(_,i)=>'ride-'+i),...Array.from({length:4},(_,i)=>'dad-walk-'+i),'hug-0','hug-1','walk-away-0','walk-away-1','ice','sky','volcano','golem-0','golem-1','golem-2'];
let attackTime=0,attackCD=0,attackQueued=0,hitStop=0,shake=0,combo=0,comboTimer=0,trail=[],floaters=[],dustClock=0,lightning=0,weatherTime=0,stageTime=0,assistCooldown=0;
const ATTACK_DURATION=.56;
const STAR_GOAL=8,MOUNT_SECONDS=12;
let starEnergy=0,mounted=false,mountTime=0,mountReady=false,rayCD=0,beam=null,dogPath=[],pathDistance=0,cinematicTime=0,cinematicCue=-1,goalCD=0,pauseReturn='play',springCD=0,soundTouched=false;
const cinematicModes=new Set(['intro','ending']);
const reducedMotion=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const worldLayouts=[
 [[0,570,820,220],[970,570,710,220],[1820,570,980,220],[2960,570,1180,220],[400,485,150,30],[630,410,140,30],[815,482,185,30],[1130,480,140,30],[1595,472,215,30],[1960,490,150,30],[2140,405,220,30],[2440,477,155,30],[2750,490,245,30],[3160,478,160,30],[3370,405,180,30]],
 [[0,570,710,220],[870,570,780,220],[1800,570,1000,220],[2960,570,1180,220],[360,490,160,35],[630,442,170,35],[825,480,150,35],[1080,480,155,35],[1520,465,260,35],[1850,485,180,35],[2070,415,165,35],[2260,355,220,35],[2530,460,150,35],[2740,487,260,35],[3140,485,200,35],[3430,430,170,35]],
 [[0,570,760,220],[930,570,750,220],[1840,570,930,220],[2940,570,1200,220],[350,488,155,32],[560,420,150,32],[750,472,200,32],[1120,482,160,32],[1550,475,275,32],[1910,485,140,32],[2100,410,170,32],[2310,360,185,32],[2520,452,155,32],[2700,485,270,32],[3110,485,180,32],[3350,415,175,32]]
];
const worlds=[
 {name:'Bosque dos Sussurros',item:'Flor do Sol',color:'#ffe57b',bg:'world',climate:'Brisa & pétalas',weather:'leaves',top:'#b7ed88',edge:'#78b85d',rock:'#58755a',base:'#25483e',story:'A bruxa transformou o papai em um cachorrinho! Encontre a Flor do Sol. ↓ dá o giro. Enter chama o papai. Junte 8 estrelas para montar e disparar raios!'},
 {name:'Deserto dos Ventos',item:'Orvalho do Oásis',color:'#ffcd70',bg:'desert',climate:'Rajadas de areia',weather:'sand',top:'#ffe09a',edge:'#dca85e',rock:'#bd784a',base:'#754237',story:'As dunas escondem o Orvalho do Oásis. Escorpiões dão arrancadas e escaravelhos voam baixo. Um giro bem na hora e a ajuda do papai vão abrir o caminho!'},
 {name:'Floresta das Sombras',item:'Centelha do Amor',color:'#ddaaff',bg:'darkwood',climate:'Chuva & neblina',weather:'rain',top:'#9bc8b5',edge:'#4c867e',rock:'#384b60',base:'#172a40',story:'A chuva anuncia o castelo de Violeta. Morcegos mergulham e fantasmas rondam as árvores. Encontre a Centelha do Amor, desvie dos ataques de Violeta e aproveite quando ela cansar e busque o antídoto!'}
];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),show=(id,on=true)=>$(id).classList.toggle('hidden',!on);
function resize(){const r=canvas.getBoundingClientRect();W=Math.round(H*r.width/r.height);canvas.width=W;canvas.height=H;}window.addEventListener('resize',resize);resize();
function safeRead(){try{return JSON.parse(localStorage.getItem(SAVE)||'null')}catch{return null}}
function save(){if(typeof courseRun!=='undefined'&&courseRun)return;try{localStorage.setItem(SAVE,JSON.stringify({level,score,ingredients,elapsed,starEnergy}))}catch{}}
function clearSave(){try{localStorage.removeItem(SAVE)}catch{}}
let audioCtx=null;
function tone(freq,duration=.12,type='sine',vol=.06,delay=0){if(muted)return;try{audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.type=type;o.frequency.setValueAtTime(freq,audioCtx.currentTime+delay);g.gain.setValueAtTime(0,audioCtx.currentTime+delay);g.gain.linearRampToValueAtTime(vol,audioCtx.currentTime+delay+.015);g.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+delay+duration);o.connect(g);g.connect(audioCtx.destination);o.start(audioCtx.currentTime+delay);o.stop(audioCtx.currentTime+delay+duration+.01)}catch{}}
function chime(){[523,659,784,1047].forEach((f,i)=>tone(f,.22,'sine',.07,i*.08))}
function setSound(){soundTouched=true;muted=!muted;window.RockAudio?.setMuted(muted); $('sound').innerHTML=muted?'♪<span class="slash">/</span>':'♪';$('sound').setAttribute('aria-label',muted?'Ativar som':'Desativar som');$('sound').title=muted?'Ativar som':'Desativar som';if(!muted)tone(659,.2)}
$('sound').onclick=setSound;
$('fullscreen').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else if($('game').requestFullscreen)await $('game').requestFullscreen();else toast('Use o celular na horizontal para ampliar o jogo.')}catch{toast('Tela cheia não disponível neste navegador.')}};
function burst(x,y,color,n=16){for(let i=0;i<n;i++)particles.push({x,y,vx:(Math.random()-.5)*260,vy:-80-Math.random()*200,life:.6+Math.random()*.7,max:1.3,color,size:3+Math.random()*5})}
function say(speaker,text,seconds=5){$('speaker').textContent=speaker;$('dialogue-text').textContent=text;show('dialogue');dialogueUntil=t+seconds}
function toast(text){$('toast').textContent=text;show('toast');toastUntil=t+3}
function modal(eyebrow,title,text,button,action,extra='',secondary=false){keys={};pressed={};if(typeof buddyKeys!=='undefined'){buddyKeys={};buddyPressed={};}show('modal');$('modal-eyebrow').textContent=eyebrow;$('modal-title').textContent=title;$('modal-text').textContent=text;$('modal-primary').textContent=button;$('modal-extra').innerHTML=extra;modalAction=action;show('modal-secondary',secondary);$('modal-primary').focus({preventScroll:true})}
$('modal-primary').onclick=()=>{show('modal',false);modalAction?.()};$('modal-secondary').onclick=()=>{show('modal',false);menu()};
function hud(){ $('score').textContent=score;$('hearts').textContent='♥ '.repeat(hearts)+'♡ '.repeat(3-hearts);$('hearts').setAttribute('aria-label',`${hearts} corações`);$('stage-small').textContent=`CAPÍTULO 0${level+1} / 06`;$('stage-name').textContent=worlds[level].name;$('quest-text').textContent=ingredients.includes(level)?(level===5?'Derrote Violeta e pegue o antídoto':'Leve o ingrediente ao portal'):('Encontre: '+worlds[level].item);$('ingredients').innerHTML=worlds.map((_,i)=>i).map(i=>`<span class="${ingredients.includes(i)?'done':''}">${ingredients.includes(i)?'✓':i+1}</span>`).join('')}
function newLevel(n){
 resetModern();
 level=n;camera=0;checkpoint=100;mounted=false;mountTime=0;mountReady=starEnergy>=STAR_GOAL;beam=null;rayCD=0;goalCD=0;dogPath=[];pathDistance=0;springCD=0;hearts=3;invuln=0;barkCD=0;bossTimer=1;attackTime=attackCD=attackQueued=hitStop=shake=combo=comboTimer=assistCooldown=stageTime=0;trail=[];floaters=[];
 player={x:100,y:490,w:32,h:66,vx:0,vy:0,ground:false,jumps:0,face:1,stride:0,lean:0,squash:0,moveBlend:0};
 dog={x:45,y:520,w:40,h:32,vx:0,vy:0,ground:false,face:1,stride:0,target:null,assist:0,barkAnim:0};particles=[];projectiles=[];barkRings=[];keys={};pressed={};jumpBuffer=0;coyote=0;
 platforms=worldLayouts[n].map((p,i)=>({x:p[0],y:p[1],w:p[2],h:p[3],ground:i<4,bx:p[0],by:p[1],dx:0,dy:0,axis:i>=4&&[5,6,8,9,12,13].includes(i)?(i%2?'y':'x'):null,amp:i%2?26:36,speed:.85+(i%3)*.13,phase:i*.8}));
 gems=[];for(let i=0;i<platforms.length;i++){const p=platforms[i],count=p.ground?Math.floor(p.w/165):2;for(let j=0;j<count;j++){const x=p.x+60+j*135;if(x<p.x+p.w-20)gems.push({x,y:p.y-62,got:false,phase:i+j,platform:i,offset:x-p.x})}}
 const placements=[
  [['beetle',560,445,745],['mushroom',1130,1030,1290],['beetle',1500,1450,1610],['mushroom',2000,1890,2100],['beetle',2590,2480,2740],['mushroom',3250,3080,3420]],
  [['scorpion',540,430,660],['scarab',1100,960,1250],['scorpion',1490,1430,1600],['scarab',2040,1890,2150],['scorpion',2610,2530,2740],['scarab',3180,3020,3350],['scorpion',3460,3380,3600]],
  [['ghost',570,400,690],['bat',1140,970,1300],['ghost',1490,1440,1620],['bat',2020,1870,2170],['ghost',2610,2530,2720],['bat',3160,3000,3300],['ghost',3440,3370,3530]]
 ];
 enemies=placements[n%3].map(([type,x,min,max],i)=>({type,x,y:['bat','scarab','ghost'].includes(type)?455:526,baseY:['bat','scarab','ghost'].includes(type)?455:526,min,max,w:44,h:44,dir:i%2?1:-1,dead:false,speed:48+n*12,phase:i*1.73,clock:i*.35,charge:0,stun:0,deathLife:0}));
 gate={x:1360,y:280,w:38,h:290,open:false};item={x:n===0?2250:n===1?2380:2400,y:n===0?345:n===1?298:305,visible:false,got:ingredients.includes(n)};
 boss={kind:n===2?'stone':'witch',x:3720,y:300,hp:n===2?10:14,maxHP:n===2?10:14,defeated:n!==2&&n!==5,flash:0,active:false,state:'dormant',clock:0,cycle:0,invuln:0,volley:0,face:-1};initDogPath();$('game').dataset.world=['forest','desert','dark'][theme()];hud();show('start-screen',false);show('hud');show('objective');show('combat-hud');show('weather-badge');show('touch');show('dialogue',false);show('prompt',false);show('boss-hud',false);show('power-hud');show('cinema',false);$('weather-badge').textContent=worlds[n].climate;save();
}

function begin(n=0,resume=false){
 courseRun=null;buddy=null;show('course-exit',false);
 if(!resume){score=0;ingredients=[];elapsed=0;starEnergy=0;}
 if(!soundTouched&&muted)setSound();window.RockAudio?.select(n);newLevel(n);
 if(n===0&&!resume){startCinematic('intro');return;}
 mode='story';modal(`CAPÍTULO 0${n+1} / 06`,worlds[n].name,worlds[n].story,'Vamos nessa!',()=>enterPlay());
}
function enterPlay(){mode='play';show('cinema',false);for(const id of ['hud','objective','combat-hud','weather-badge','power-hud','touch'])show(id);window.RockAudio?.resume();say('ISA',level===0?'↑ pula. ↓ gira. Enter chama o papai. Vamos juntos!':'Vamos lá, papai! Falta pouco.',5);}
$('start').onclick=()=>begin();$('continue').onclick=()=>{const s=safeRead();if(!s||!Number.isInteger(s.level)||s.level<0||s.level>=worlds.length)return begin();score=Number(s.score)||0;ingredients=Array.isArray(s.ingredients)?s.ingredients.filter(x=>Number.isInteger(x)&&x>=0&&x<worlds.length):[];elapsed=Number(s.elapsed)||0;starEnergy=clamp(Number(s.starEnergy)||0,0,STAR_GOAL);begin(s.level,true)};
function menu(){courseRun=null;buddy=null;show('course-exit',false);show('duo-touch',false);mode='menu';show('start-screen');['hud','objective','touch','dialogue','prompt','toast','combat-hud','weather-badge','power-hud','boss-hud','cinema'].forEach(id=>show(id,false));show('continue',!!safeRead());keys={};window.RockAudio?.pause()}
function pause(){if(mode==='play'||cinematicModes.has(mode)){pauseReturn=mode;mode='pause';window.RockAudio?.pause();modal('RESPIRE UM POUQUINHO','Pausa para um cafuné','Isa e o papai vão esperar por você aqui.','Continuar aventura',()=>{mode=pauseReturn;window.RockAudio?.resume()},'',true)}else if(mode==='pause'){show('modal',false);mode=pauseReturn;window.RockAudio?.resume()}}$('pause').onclick=pause;
$('help').onclick=()=>{if(!ready||!['menu','play'].includes(mode))return;previousMode=mode;if(mode==='play')mode='help';modal('GUIA DA AVENTURA','Pequenos passos, grandes saltos','Colete 8 estrelas: ao pousar, Isa monta no papai por 12 segundos. Enter dispara o raio durante a montaria. Fora dela, o latido atordoa inimigos e revela segredos. Isa dá o golpe final!','Entendi!',()=>{mode=previousMode},'<div class="control-list"><div><b>← →</b> Mover Isa</div><div><b>↑ / ↑ ↑</b> Salto / salto duplo</div><div><b>↓</b> Girar nos patins</div><div><b>Enter</b> Latido / raio da montaria</div><div><b>Esc / P</b> Pausar</div></div>')};
function bindKey(e,down){
 if(mode==='editor'||['INPUT','SELECT','TEXTAREA'].includes(e.target?.tagName))return;
 if(handleBuddyKey(e,down))return;
 const map={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'jump',ArrowDown:'attack',Enter:'bark',NumpadEnter:'bark'};
 if(map[e.code]){if(mode==='play'){e.preventDefault();const k=map[e.code];if(down&&!keys[k]&&!e.repeat)pressed[k]=true;keys[k]=down;}else if(!down)keys[map[e.code]]=false;}
 else if(down&&!e.repeat&&(e.code==='Escape'||e.code==='KeyP'))pause();
}
window.addEventListener('keydown',e=>bindKey(e,true));window.addEventListener('keyup',e=>bindKey(e,false));window.addEventListener('blur',()=>{keys={};pressed={};if(mode==='play'||cinematicModes.has(mode))pause()});document.addEventListener('visibilitychange',()=>{if(document.hidden&&(mode==='play'||cinematicModes.has(mode)))pause()});
document.querySelectorAll('[data-control]').forEach(b=>{const key=b.dataset.control;b.onpointerdown=e=>{e.preventDefault();b.setPointerCapture(e.pointerId);if(!keys[key])pressed[key]=true;keys[key]=true};b.onpointerup=b.onpointercancel=b.onlostpointercapture=()=>keys[key]=false});
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y}
function bodyStep(b,dt){
 const previousX=b.x,wasOn=b.ground,oldSupport=b.support;
 if(b.ground&&b.support){b.x+=b.support.dx;b.y+=b.support.dy;}
 const oldBottom=b.y+b.h;b.vy+=1600*dt;b.x+=b.vx*dt;b.x=clamp(b.x,0,worldWidth()-40-b.w);b.y+=b.vy*dt;b.ground=false;b.support=null;
 if(b.vy>=0){const landings=platforms.filter(p=>b.x+b.w>p.x&&b.x<p.x+p.w&&oldBottom<=surfaceY(p,previousX+b.w/2)-p.dy+6+(p.slope?Math.abs(b.vx*dt)*.8:0)&&(b.y+b.h>=surfaceY(p,b.x+b.w/2)||(wasOn&&p===oldSupport&&Math.abs(surfaceY(p,b.x+b.w/2)-oldBottom)<Math.abs(b.vx*dt)*1.2+7)));landings.sort((a,c)=>surfaceY(a,b.x+b.w/2)-surfaceY(c,b.x+b.w/2));if(landings.length){b.support=landings[0];b.y=surfaceY(b.support,b.x+b.w/2)-b.h;b.vy=0;b.ground=true;}}
}
function movePlatforms(dt){for(const p of platforms){const x=p.x,y=p.y;if(p.axis==='x')p.x=p.bx+Math.sin(stageTime*p.speed+p.phase)*p.amp;if(p.axis==='y')p.y=p.by+Math.sin(stageTime*p.speed+p.phase)*p.amp;p.dx=p.x-x;p.dy=p.y-y;}for(const g of gems){if(g.platform!==undefined){const p=platforms[g.platform];g.x=p.x+g.offset;g.y=surfaceY(p,g.x)-62;}}}
function hurt(fall=false){if(invuln>0&&!fall)return;if(mounted&&!fall){endMount();invuln=1.5;toast('A montaria protegeu Isa!');return;}hearts--;burst(player.x,player.y+20,'#ff929a',14);tone(160,.3,'triangle',.12);if(hearts<=0){hearts=3;player.x=checkpoint;player.y=480;player.vx=player.vy=0;dog.x=checkpoint-55;dog.y=500;dog.vy=0;toast('Mais uma chance! O papai está com você.')}else if(fall){player.x=checkpoint;player.y=450;player.vx=player.vy=0;dog.x=checkpoint-55;dog.y=490;dog.vy=0}else{player.vy=-330;player.vx=-player.face*230;player.squash=-.12;shake=.18}if(fall||hearts===3){endMount();initDogPath();if(boss.active&&!boss.defeated){boss.hp=boss.maxHP;boss.state='move';boss.clock=0;boss.cycle=0;boss.x=3720;boss.y=300;projectiles=[];}}invuln=2;hud()}
function bark(){
 if(mounted){fireRay();return;}
 if(barkCD>0)return;activateResonance();sfx('bark');barkCD=1.1;dog.barkAnim=.4;barkRings.push({x:dog.x+20,y:dog.y+10,life:.5});tone(190,.11,'triangle',.12);tone(255,.1,'triangle',.1,.14);
 let acted=false;if(!gate.open&&Math.abs(player.x-gate.x)<235){gate.open=true;acted=true;burst(gate.x,440,'#cffba5',40);say('ISA','Boa, papai! Seu latido desfez o selo!',4);chime();}
 if(!item.got&&!item.visible&&dist({x:player.x,y:player.y},item)<225){item.visible=true;acted=true;burst(item.x,item.y,worlds[level].color,35);say('PAPAI','Au-au! Encontrei! Pule para pegar o ingrediente.',4);chime();}
 for(const e of enemies)if(!e.dead&&Math.abs(e.x-player.x)<175&&Math.abs(e.y-player.y)<130){e.stun=1.7;e.helped=true;burst(e.x+22,e.y,'#fff1a2',5);acted=true;}
 if(boss.active&&!boss.defeated&&Math.abs(player.x-boss.x)<210&&boss.state==='exposed'){boss.clock=Math.max(0,boss.clock-.45);acted=true;floaters.push({x:boss.x,y:boss.y-50,text:'DISTRAÍDA!',color:'#fff2ad',life:.8});}
 if(!acted)say('PAPAI','Au! Estou bem aqui. Você ataca, eu dou cobertura!',2.5);
}
function completeLevel(){
 if(typeof courseRun!=='undefined'&&courseRun){finishCourse();return;}
 if(goalCD>0)return;goalCD=2;
 if(!ingredients.includes(level)){player.x=3880;toast('Ainda falta o ingrediente! Procure o brilho no alto.');return;}
 if(!boss.defeated){player.x=3880;toast('Derrote o guardião para abrir o portal!');return;}
 if(level<worlds.length-1){mode='between';window.RockAudio?.pause();chime();modal('INGREDIENTE ENCONTRADO',worlds[level].item+'!',`A dupla já encontrou ${ingredients.length} de 6 ingredientes. O próximo mundo espera por vocês!`,'Explorar o próximo mundo',()=>begin(level+1,true),`<div class="end-stats"><span><strong>${score}</strong>estrelas</span><span><strong>${ingredients.length}/6</strong>ingredientes</span></div>`);}else{endMount();clearSave();startCinematic('ending');}
}
function startSpin(){
 if(attackCD>0)return false;
 sfx('spin');impact(player.x+16,player.y+38,'#ffe7b1',.5);attackTime=ATTACK_DURATION;attackCD=.75;attackQueued=0;player.vx=player.face*(player.ground?445:375);player.squash=.16;
 if(!player.ground&&player.vy>60)player.vy=60;
 burst(player.x+16,player.y+player.h-8,'#ffda8c',8);tone(440,.08,'triangle',.06);tone(750,.13,'sine',.06,.09);
 requestAssist();return true;
}
function requestAssist(){
 if(assistCooldown>0||mounted)return;const nearby=enemies.filter(e=>!e.dead&&Math.abs(e.x-player.x)<165&&Math.abs(e.y-player.y)<120);
 if(!nearby.length)return;assistCooldown=2.4;dog.barkAnim=.3;for(const e of nearby){e.stun=Math.max(e.stun,.9);e.helped=true;}barkRings.push({x:dog.x+20,y:dog.y+15,life:.4});
}
function defeatEnemy(e,source='spin'){
 if(e.dead)return;e.dead=true;impact(e.x+22,e.y+22,'#fff0b0',1);sfx('hit');e.deathLife=.65;e.deathVX=(e.x>player.x?1:-1)*210;e.deathVY=-245;
 combo=comboTimer>0?Math.min(combo+1,5):1;comboTimer=2.4;const reward=source==='spin'?3+combo:3;score+=reward;gainStar(2,false);
 const color=level===0?'#dafba0':level===1?'#ffcf7c':'#d3adff';burst(e.x+22,e.y+18,color,24);
 floaters.push({x:e.x+22,y:e.y-15,text:source==='dog'?'PAPAI! +3':combo>1?`COMBO ×${combo} +${reward}`:`+${reward}`,life:1.1,color});
 if(source==='spin'){hitStop=.045;shake=reducedMotion?0:.12;player.vx=player.face*390;}tone(300+combo*95,.1,'triangle',.1);tone(760,.12,'sine',.05,.06);hud();
}
function updateEnemies(dt,oldY){
 for(const e of enemies){
  if(e.dead){if(e.deathLife>0){e.deathLife-=dt;e.x+=e.deathVX*dt;e.y+=e.deathVY*dt;e.deathVY+=750*dt;}continue;}
  e.clock+=dt;e.stun=Math.max(0,e.stun-dt);const frozen=e.stun>0;
  if(!frozen&&e.type==='scorpion'){
   if(e.attackState==='warn'){e.stateTime-=dt;if(e.stateTime<=0){e.attackState='charge';e.stateTime=.48;}}
   else if(e.attackState==='charge'){e.x+=e.dir*230*dt;e.stateTime-=dt;if(e.stateTime<=0){e.attackState='rest';e.stateTime=1.1;}}
   else if(e.attackState==='rest'){e.stateTime-=dt;if(e.stateTime<=0)e.attackState='walk';}
   else{e.x+=e.dir*e.speed*.75*dt;if(Math.abs(player.x-e.x)<210&&Math.abs(player.y-e.y)<95){e.attackState='warn';e.stateTime=.5;e.dir=player.x>e.x?1:-1;}}
  }else if(!frozen){
   e.x+=e.dir*e.speed*(e.type==='ghost'?.7:1)*dt;
   if(e.type==='mushroom'){const phase=(e.clock+e.phase)%2.2;e.y=e.baseY-(phase<.85?Math.sin(phase/.85*Math.PI)*82:0);}
   if(e.type==='scarab')e.y=e.baseY+Math.sin(e.clock*2.7+e.phase)*37;
   if(e.type==='bat'){const swoop=Math.sin(e.clock*1.8+e.phase);e.y=e.baseY-32+Math.max(0,swoop)*97;}
   if(e.type==='ghost')e.y=e.baseY+24+Math.sin(e.clock*2+e.phase)*31;
  }
  if(e.x<e.min){e.x=e.min;e.dir=1;}if(e.x>e.max){e.x=e.max;e.dir=-1;}
  const active=attackTime>0&&attackTime<ATTACK_DURATION-.065;
  if(active&&Math.abs(e.x+22-(player.x+16))<90&&Math.abs(e.y+22-(player.y+36))<83){defeatEnemy(e,'spin');continue;}
  if(overlap(player,e)){
   if(player.vy>0&&oldY+player.h<e.y+18){defeatEnemy(e,'stomp');player.vy=-390;player.squash=-.1;}
   else if(!active&&!frozen)hurt();
  }
 }
}
function initDogPath(){dogPath=[{x:player.x-60,foot:player.y+player.h,d:0,face:1,ground:player.ground},{x:player.x,foot:player.y+player.h,d:60,face:1,ground:player.ground}];pathDistance=60;dog.x=player.x-60;dog.y=player.y+player.h-dog.h;dog.vx=0;}
function updateDog(dt){
 dog.barkAnim=Math.max(0,dog.barkAnim-dt);assistCooldown=Math.max(0,assistCooldown-dt);
 if(mounted){dog.x=player.x;dog.y=player.y+player.h-48;dog.face=player.face;dog.vx=player.vx;return;}
 const lastPoint=dogPath.at(-1),foot=player.y+player.h,travel=Math.hypot(player.x-lastPoint.x,foot-lastPoint.foot);
 if(travel>.15){pathDistance+=travel;dogPath.push({x:player.x,foot,d:pathDistance,face:player.face,ground:player.ground});}
 while(dogPath.length>2&&dogPath[1].d<pathDistance-120)dogPath.shift();
 const targetD=pathDistance-58;let a=dogPath[0],b=dogPath[1]||a;for(let i=1;i<dogPath.length;i++){b=dogPath[i];if(b.d>=targetD)break;a=b;}
 const f=clamp((targetD-a.d)/Math.max(.001,b.d-a.d),0,1),targetX=a.x+(b.x-a.x)*f,targetFoot=a.foot+(b.foot-a.foot)*f,oldX=dog.x;
 dog.x+=(targetX-dog.x)*(1-Math.exp(-dt*25));dog.y+=(targetFoot-dog.h-dog.y)*(1-Math.exp(-dt*25));dog.vx=(dog.x-oldX)/dt;
 if(Math.abs(dog.vx)>12)dog.face=dog.vx>0?1:-1;dog.ground=b.ground;dog.stride+=Math.abs(dog.vx)*dt/29;
 if(Math.abs(player.x-dog.x)>140||Math.abs(player.y+player.h-(dog.y+dog.h))>170)initDogPath();
}
function updateCombatHUD(){
 const cooldown=clamp(attackCD/.75,0,1);$('spin-fill').style.transform=`scaleX(${1-cooldown})`;$('spin-status').textContent=attackTime>0?'GIRANDO!':cooldown>.05?'Preparando…':'↓ Giro pronto';
 $('assist-status').textContent=mounted?'Enter: raio estelar':dog.barkAnim>0?'Papai dando cobertura':'Enter: latido de suporte';
 $('power-fill').style.transform=`scaleX(${mounted?mountTime/MOUNT_SECONDS:starEnergy/STAR_GOAL})`;$('power-title').textContent=mounted?'MONTARIA ESTELAR':mountReady?'PODER PRONTO!':'PODER DAS ESTRELAS';$('power-count').textContent=mounted?`${Math.ceil(mountTime)}s`:`${starEnergy}/${STAR_GOAL}`;
 $('power-tip').textContent=mounted?'Enter dispara o raio':mountReady?'Pouse para montar':'8 estrelas liberam a montaria';$('power-hud').classList.toggle('active',mounted);
 const barkButton=document.querySelector('[data-control="bark"]');if(barkButton)barkButton.textContent=mounted?'RAIO':'AU!';
}
function update(dt){
 if(mode==='pause'||mode==='help')return;weatherTime+=dt;updateEffects(dt);if(t>dialogueUntil)show('dialogue',false);if(t>toastUntil)show('toast',false);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=390*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);
 for(const r of barkRings)r.life-=dt;barkRings=barkRings.filter(r=>r.life>0);
 for(const f of floaters){f.y-=37*dt;f.life-=dt;}floaters=floaters.filter(f=>f.life>0);
 for(const p of trail)p.life-=dt;trail=trail.filter(p=>p.life>0);
 if(cinematicModes.has(mode)){updateCinematic(dt);pressed={};return;}if(mode!=='play'){pressed={};return;}
 if(hitStop>0){hitStop-=dt;return;}
 stageTime+=dt;elapsed+=dt;goalCD=Math.max(0,goalCD-dt);rayCD=Math.max(0,rayCD-dt);springCD=Math.max(0,springCD-dt);if(beam){beam.life-=dt;if(beam.life<=0)beam=null;}movePlatforms(dt);if(mounted){mountTime-=dt;if(mountTime<=0)endMount();}if(mountReady&&!mounted&&player.ground)startMount();invuln=Math.max(0,invuln-dt);barkCD=Math.max(0,barkCD-dt);boss.flash=Math.max(0,boss.flash-dt);shake=Math.max(0,shake-dt);comboTimer=Math.max(0,comboTimer-dt);attackTime=Math.max(0,attackTime-dt);attackCD=Math.max(0,attackCD-dt);
 if(pressed.attack)attackQueued=.18;else attackQueued=Math.max(0,attackQueued-dt);if(attackQueued>0&&attackCD<=0)startSpin();
 const dir=(keys.right?1:0)-(keys.left?1:0),wasGround=player.ground,landingSpeed=player.vy;
 if(attackTime>0){player.vx+=(player.face*345-player.vx)*dt*3;}else{const acceleration=dir?10:(level===1?6:8.5);player.vx+=(dir*(mounted?410:330)-player.vx)*Math.min(1,dt*acceleration);if(dir)player.face=dir;}
 player.stride+=Math.abs(player.vx)*dt/39;player.lean+=((attackTime>0?0:player.vx/330*.095)-player.lean)*Math.min(1,dt*10);player.squash*=Math.exp(-dt*11);player.moveBlend+=(clamp(Math.abs(player.vx)/110,0,1)-player.moveBlend)*Math.min(1,dt*12);
 if(player.ground){coyote=.11;player.jumps=0;}else coyote-=dt;
 if(pressed.jump)jumpBuffer=.14;else jumpBuffer-=dt;
 if(jumpBuffer>0&&(player.jumps<2||coyote>0)){
  if(!player.ground&&coyote<=0&&player.jumps===0)player.jumps=1;player.vy=player.jumps===0?-580:-525;player.jumps++;player.ground=false;coyote=0;jumpBuffer=0;player.squash=-.15;impact(player.x+16,player.y+player.h,'#d9fff2',.4);sfx('jump');
  tone(player.jumps===1?480:720,.13,'sine',.08);burst(player.x+16,player.y+66,player.jumps===2?'#fff0ab':worlds[level].top,9);
 }
 // A tap produces a full jump; a second press triggers the double jump.
 const oldY=player.y;bodyStep(player,dt);
 if(!wasGround&&player.ground&&landingSpeed>180){player.squash=clamp(landingSpeed/2700,.1,.24);if(player.support)player.support.bounce=.16;impact(player.x+16,player.y+player.h,worlds[level].top,.45);sfx('land');burst(player.x+16,player.y+66,worlds[level].top,10);tone(130,.065,'sine',.04);}
 if(!gate.open&&overlap(player,gate)){if(player.x+player.w/2<gate.x+gate.w/2)player.x=gate.x-player.w;else player.x=gate.x+gate.w;player.vx=0;}
 if(attackTime>0&&Math.floor(stageTime*60)%3===0)trail.push({x:player.x+16,y:player.y+66,life:.18,face:player.face,pose:'spin-'+Math.floor((ATTACK_DURATION-attackTime)*16)%4});
 dustClock-=dt;if(player.ground&&Math.abs(player.vx)>90&&dustClock<=0){dustClock=.07;particles.push({x:player.x+16-player.face*15,y:player.y+65,vx:-player.vx*.15,vy:-22,life:.28,size:3,color:worlds[level].top});}
 updateDog(dt);if(pressed.bark)bark();if(player.y>810)hurt(true);
 if(!courseRun&&player.ground&&player.y+player.h>550){if(player.x>3000)checkpoint=Math.max(checkpoint,3005);else if(player.x>1880)checkpoint=Math.max(checkpoint,1885);else if(player.x>1040)checkpoint=Math.max(checkpoint,1045);}
 for(const g of gems)if(!g.got&&Math.abs(g.x-player.x-16)<37&&Math.abs(g.y-player.y-26)<62){g.got=true;gainStar(1);burst(g.x,g.y,level===1?'#ffe8a5':'#9fffe9',7);tone(880+(score%5)*80,.08,'sine',.045);hud();}
 updateEnemies(dt,oldY);
 if(item.visible&&!item.got&&dist({x:player.x+16,y:player.y+30},item)<65){item.got=true;ingredients.push(level);score+=20;burst(item.x,item.y,worlds[level].color,45);chime();toast(`${worlds[level].item} encontrada! +20 estrelas`);say('ISA','Conseguimos, papai! Vamos seguir até o portal.',5);hud();save();}
 updateBoss(dt);updateProjectiles(dt);updateSprings();updateWorldInteractions(dt);updateBuddy(dt);updateCourseObjectives(dt);
 let prompt='';if(!gate.open&&Math.abs(player.x-gate.x)<230)prompt='Latir para abrir o selo';else if(!item.got&&!item.visible&&dist({x:player.x,y:player.y},item)<235)prompt='Farejar o ingrediente escondido';show('prompt',!!prompt);if(prompt)$('prompt').lastElementChild.textContent=prompt;
 if(player.x>(courseRun?courseRun.goal.x-50:3895))completeLevel();const targetCam=clamp(player.x-W*.37+clamp(player.vx*.18,-50,60),0,Math.max(0,worldWidth()-W));camera+=(targetCam-camera)*(1-Math.exp(-dt*5.8));updateCombatHUD();pressed={};
}
function gainStar(amount=1,countScore=true){
 if(countScore)score+=amount;
 if(mounted)mountTime=Math.min(MOUNT_SECONDS,mountTime+amount*.25);else{starEnergy=Math.min(STAR_GOAL,starEnergy+amount);mountReady=starEnergy>=STAR_GOAL;}
 hud();
}
function startMount(){
 if(!mountReady||mounted)return;mounted=true;mountReady=false;starEnergy=0;mountTime=MOUNT_SECONDS;const bottom=player.y+player.h;player.h=84;player.w=48;player.y=bottom-player.h;attackTime=0;chime();burst(player.x+20,bottom-45,'#ffe792',44);impact(player.x+24,bottom-40,'#ffe292',2);sfx('power');toast('MONTARIA ESTELAR! Enter dispara o raio.');
}
function endMount(){
 if(!mounted)return;const bottom=player.y+player.h;mounted=false;mountTime=0;player.h=66;player.w=32;player.y=bottom-66;beam=null;initDogPath();
}
function fireRay(){
 if(rayCD>0)return;rayCD=.65;const x=player.x+24+player.face*58,y=player.y+player.h-39;
 impact(x,y,'#b4ffff',1);sfx('ray');beam={x,y,face:player.face,range:580,life:.24};tone(145,.13,'sawtooth',.06);tone(940,.12,'sine',.09);burst(x,y,'#b6ffff',16);
 for(const e of enemies){const ahead=(e.x+22-x)*player.face;if(!e.dead&&ahead> -25&&ahead<580&&Math.abs(e.y+22-y)<70)defeatEnemy(e,'ray');}
 if(boss.active&&!boss.defeated){const ahead=(boss.x-x)*player.face;if(ahead> -35&&ahead<580&&Math.abs(boss.y-y)<94)damageBoss('ray');}
 if(!gate.open&&(gate.x-x)*player.face>0&&(gate.x-x)*player.face<580){gate.open=true;burst(gate.x,440,'#cffba5',35);}
 if(!item.got&&!item.visible&&Math.abs(item.y-y)<100&&(item.x-x)*player.face>0&&(item.x-x)*player.face<580){item.visible=true;chime();}
}
function updateSprings(){
 if(courseRun)return;
 if(springCD>0||!player.ground)return;
 const springs=[{x:1770,p:8},{x:2860,p:12}];
 for(const spring of springs){const p=platforms[spring.p],x=p.x+p.w*.55;if(Math.abs(player.x+16-x)<25&&Math.abs(player.y+player.h-p.y)<8){player.vy=-740;player.ground=false;player.jumps=1;player.squash=-.2;springCD=.65;burst(x,p.y,'#adffdb',18);tone(520,.16);break;}}
}
function damageBoss(source='spin'){
 if(boss.kind==='stone')return damageStoneBoss(source);
 if(boss.defeated||boss.invuln>0)return false;
 if(boss.state!=='exposed'&&source!=='reflect'){if(source==='ray')floaters.push({x:boss.x,y:boss.y-40,text:'ESCUDO!',color:'#ddbaff',life:.7});return false;}
 impact(boss.x,boss.y,'#ffc3ff',1.5);sfx('hit');boss.hp--;boss.invuln=.8;boss.flash=.6;shake=reducedMotion?0:.15;burst(boss.x,boss.y,'#ffe2a8',35);tone(180,.14,'triangle',.13);
 if(source==='reflect'){boss.state='exposed';boss.clock=0;boss.y=470;}
 if(boss.hp<=0){boss.defeated=true;boss.state='defeated';boss.clock=0;projectiles=[];chime();say('VIOLETA','Vocês venceram… Esse vínculo é mais forte que minha magia!',5);toast('Violeta derrotada! O antídoto está no portal.');}
 else floaters.push({x:boss.x,y:boss.y-45,text:'ACERTOU!',color:'#ffe89b',life:1});
 return true;
}
function updateBoss(dt){
 if(boss.kind==='stone'){updateStoneBoss(dt);return;}
 if(boss.disabled)return;
 if(level!==5)return;
 if(boss.defeated){if(boss.state==='defeated'){boss.clock+=dt;boss.x+=170*dt;boss.y-=150*dt;}show('boss-hud',false);return;}
 if(!boss.active&&player.x>3300){boss.active=true;boss.state='move';boss.clock=0;checkpoint=3305;show('boss-hud');say('VIOLETA','Quer o antídoto? Então alcance minha magia, pequenina!',4);}
 if(!boss.active)return;
 boss.invuln=Math.max(0,boss.invuln-dt);boss.clock+=dt;boss.face=player.x>boss.x?1:-1;
 const fast=boss.hp<=7;
 if(boss.state==='move'){
  boss.x+=(3700+Math.sin(boss.clock*2+boss.cycle)*170-boss.x)*(1-Math.exp(-dt*3));boss.y+=(305+Math.sin(boss.clock*3)*45-boss.y)*(1-Math.exp(-dt*3));
  if(boss.clock>(fast?1.15:1.6)){boss.state='cast';boss.clock=0;boss.volley=0;}
 }else if(boss.state==='cast'){
  boss.y+=Math.sin(stageTime*4)*dt*10;
  if(boss.clock>.6&&boss.volley<(fast?6:4)&&boss.clock>.6+boss.volley*.23){
   const dx=player.x+16-boss.x,dy=player.y+30-boss.y,l=Math.hypot(dx,dy)||1;
   projectiles.push({x:boss.x,y:boss.y,vx:dx/l*(fast?340:270),vy:dy/l*(fast?340:270),life:5,reflected:false});boss.volley++;tone(260,.12,'triangle',.07);
  }
  if(boss.clock>2.2){boss.state='warn';boss.clock=0;boss.targetX=clamp(player.x+40,3400,3890);boss.fromX=boss.x;boss.fromY=boss.y;}
 }else if(boss.state==='warn'){
  if(boss.clock>.95){boss.state='dive';boss.clock=0;}
 }else if(boss.state==='dive'){
  const f=clamp(boss.clock/.75,0,1),ease=f*f*(3-2*f);boss.x=boss.fromX+(boss.targetX-boss.fromX)*ease;boss.y=boss.fromY+(480-boss.fromY)*ease;
  if(dist({x:player.x+16,y:player.y+35},boss)<63&&attackTime<=0)hurt();
  if(f>=1){if(fast)for(const vx of [-270,270])projectiles.push({x:boss.x,y:542,vx,vy:0,life:3,reflected:false});boss.state='exposed';boss.clock=0;burst(boss.x,555,'#c9a1f6',25);}
 }else if(boss.state==='exposed'){
  boss.y+=(478+Math.sin(stageTime*3)*5-boss.y)*(1-Math.exp(-dt*7));
  if(attackTime>0&&dist({x:player.x+16,y:player.y+30},boss)<100)damageBoss('spin');
  if(boss.clock>(fast?1.4:2.0)){boss.state='move';boss.clock=0;boss.cycle++;}
 }
 $('boss-fill').style.transform=`scaleX(${boss.hp/boss.maxHP})`;$('boss-hint').textContent=boss.state==='exposed'?'AGORA! ↓ gire ou use o raio':boss.state==='warn'?'Ela vai mergulhar! Saia da marca':boss.state==='cast'?'↓ rebate as magias':'Violeta está procurando uma abertura';
}
function updateProjectiles(dt){
 for(const p of projectiles){
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
  if(!p.reflected&&dist(p,{x:player.x+16,y:player.y+32})<(attackTime>0?83:30)){
   if(attackTime>0){p.reflected=true;const dx=boss.x-p.x,dy=boss.y-p.y,l=Math.hypot(dx,dy)||1;p.vx=dx/l*460;p.vy=dy/l*460;burst(p.x,p.y,'#ffe998',12);tone(990,.13);floaters.push({x:p.x,y:p.y-20,text:'REBATEU!',color:'#ffec96',life:1});}
   else{hurt();p.life=0;}
  }
  if(p.reflected&&dist(p,boss)<66){p.life=0;damageBoss('reflect');}
 }projectiles=projectiles.filter(p=>p.life>0);
}
function startCinematic(kind){
 mode=kind;cinematicTime=0;cinematicCue=-1;keys={};pressed={};show('modal',false);for(const id of ['hud','objective','touch','combat-hud','weather-badge','power-hud','boss-hud','dialogue','prompt','toast'])show(id,false);show('cinema');$('cinema-title').textContent=kind==='intro'?'PRÓLOGO · O FEITIÇO DAS PATAS':'EPÍLOGO · JUNTOS ATÉ O FIM';$('skip-scene').textContent=kind==='intro'?'Pular história':'Concluir história';window.RockAudio?.cinematic(true);window.RockAudio?.resume();
}
function finishCinematic(){
 if(mode==='ending')cinematicTime=25;
 show('cinema',false);window.RockAudio?.cinematic(false);
 if(mode==='intro'){enterPlay();return;}
 mode='win';window.RockAudio?.select(0);modal('UMA AVENTURA EM FAMÍLIA','De volta para casa.','O feitiço acabou. Depois do abraço mais apertado do mundo, Isa e o papai seguem juntos para casa — com uma história que nunca vão esquecer.','Jogar de novo',()=>begin(),`<div class="end-stats"><span><strong>${score}</strong>estrelas</span><span><strong>6/6</strong>ingredientes</span></div>`,true);
}
function updateCinematic(dt){
 cinematicTime+=dt;const intro=mode==='intro',times=intro?[0,2.8,5.2,7.6,10.8,13.3]:[0,3.4,6.7,11,16.2,21];
 let cue=0;for(let i=0;i<times.length;i++)if(cinematicTime>=times[i])cue=i;
 const lines=intro?[
  ['ISA','Papai, olha como eu já consigo andar de patins!'],['VIOLETA','Tanta alegria… vamos ver se continua depois do meu feitiço!'],['PAPAI','Isa! Fique atrás de mim!'],['ISA','Papai?! Você… virou um cachorrinho!'],['PAPAI','Au-au!'],['ISA','Eu vou achar o antídoto. Nós vamos juntos!']
 ]:[
  ['ISA','Conseguimos, papai! Agora, só uma gotinha…'],['ISA','Está funcionando!'],['PAPAI','Minha menina… eu sabia que você conseguiria.'],['ISA','Eu nunca ia deixar você para trás.'],['PAPAI','Vamos para casa? Temos uma grande história para contar.'],['NARRADOR','Algumas aventuras terminam. O amor continua.']
 ];
 if(cue!==cinematicCue){cinematicCue=cue;$('cinema-speaker').textContent=lines[cue][0];$('cinema-line').textContent=lines[cue][1];if((intro&&cue===3)||(!intro&&cue===1))chime();}
 if(cinematicTime>(intro?16:25))finishCinematic();
}
$('skip-scene').onclick=()=>{if(cinematicModes.has(mode))finishCinematic();};
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke()}}
function sprite(name,x,bottom,height,face=1,alpha=1){const img=assets[name];if(!img)return;const width=height*img.width/img.height;ctx.save();ctx.globalAlpha=alpha;ctx.translate(x,bottom);ctx.scale(face,1);ctx.drawImage(img,-width/2,-height,width,height);ctx.restore()}
function diamond(x,y,size,color,rot=0){ctx.save();ctx.translate(x,y);ctx.rotate(rot);ctx.shadowColor=color;ctx.shadowBlur=15;ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(size*.63,0);ctx.lineTo(0,size);ctx.lineTo(-size*.63,0);ctx.closePath();ctx.fill();ctx.shadowBlur=0;ctx.fillStyle='#ffffff80';ctx.beginPath();ctx.moveTo(0,-size);ctx.lineTo(0,size);ctx.lineTo(-size*.63,0);ctx.closePath();ctx.fill();ctx.restore()}
function label(text,x,y,color='#fffad5',size=14){ctx.font=`900 ${size}px Nunito, sans-serif`;ctx.textAlign='center';ctx.fillStyle=color;ctx.shadowColor='#123e48';ctx.shadowBlur=8;ctx.fillText(text,x,y);ctx.shadowBlur=0}
function background(menu=false){
 const index=menu?0:level,bg=assets[worlds[index].bg];ctx.fillStyle=['#77d4d3','#edb46b','#172b43'][menu?0:theme()];ctx.fillRect(0,0,W,H);
 if(bg){const scale=Math.max((W+250)/bg.width,(H+30)/bg.height),bw=bg.width*scale,bh=bg.height*scale;const progress=menu?.18:clamp(camera/Math.max(1,worldWidth()-W),0,1);ctx.drawImage(bg,-(bw-W)*progress,-(bh-H)*.45,bw,bh);}
 const wash=ctx.createLinearGradient(0,370,0,H);wash.addColorStop(0,'#00000000');wash.addColorStop(1,['#16483765','#94634438','#101f4baa'][menu?0:theme()]);ctx.fillStyle=wash;ctx.fillRect(0,350,W,H-350);
 drawWeather(index,false);
}
function drawWeather(index,front=false){
 if(index>=3){drawNewWeather(index,front);return;}
 const tm=weatherTime,mod=(v,m)=>(v%m+m)%m;
 ctx.save();
 if(index===0){
  const count=front?13:24;
  for(let i=0;i<count;i++){
   const depth=front?1.5:.6,x=mod(i*143+tm*(22+i%5*4)*depth-camera*(front?.8:.22),W+80)-40,y=mod(i*79+tm*(8+i%3*4),H+50)-25;
   ctx.save();ctx.translate(x,y);ctx.rotate(tm*.7+i);ctx.globalAlpha=front?.58:.42;ctx.fillStyle=['#f7edaa','#ffbfd0','#c3e694'][i%3];ctx.beginPath();ctx.ellipse(0,0,(front?5:3)+i%3,2,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  if(!front){ctx.globalAlpha=.2;for(let i=0;i<4;i++){const ray=ctx.createLinearGradient(W*.2+i*100,0,W*.5+i*100,500);ray.addColorStop(0,'#fffbc440');ray.addColorStop(1,'#fffbc400');ctx.fillStyle=ray;ctx.beginPath();ctx.moveTo(W*.15+i*100,0);ctx.lineTo(W*.23+i*100,0);ctx.lineTo(W*.63+i*100,550);ctx.lineTo(W*.51+i*100,550);ctx.fill();}}
 }else if(index===1){
  const gust=.5+.5*Math.sin(tm*.48),count=front?48:66;
  ctx.lineWidth=front?1.3:1;ctx.strokeStyle=front?'#ffeac281':'#fff1c34a';ctx.beginPath();
  for(let i=0;i<count;i++){const speed=65+(i%7)*20+gust*100,x=mod(i*173+tm*speed-camera*(front?.65:.1),W+100)-50,y=mod(i*73+Math.sin(tm*.8+i)*18,H);ctx.moveTo(x,y);ctx.lineTo(x+6+gust*16,y-2);}
  ctx.stroke();if(front){const haze=ctx.createLinearGradient(0,460,0,H);haze.addColorStop(0,'#e7b05b00');haze.addColorStop(1,`rgba(242,184,105,${.10+gust*.08})`);ctx.fillStyle=haze;ctx.fillRect(0,460,W,H-460);}
 }else{
  const count=front?76:64;ctx.lineWidth=front?1.25:.7;ctx.strokeStyle=front?'#b1dcf858':'#9acbd82b';ctx.beginPath();
  for(let i=0;i<count;i++){const speed=front?500:320,x=mod(i*101-tm*90-camera*(front?.72:.12),W+80)-40,y=mod(i*59+tm*speed,H+50)-25;ctx.moveTo(x,y);ctx.lineTo(x-4,y+(front?19:11));}ctx.stroke();
  if(front){
   const fog=ctx.createLinearGradient(0,470,0,H);fog.addColorStop(0,'#9bbcd000');fog.addColorStop(.7,'#9bc1d229');fog.addColorStop(1,'#92bad345');ctx.fillStyle=fog;ctx.fillRect(0,470,W,250);
   for(let i=0;i<4;i++){const x=mod(i*470+tm*18-camera*.23,W+700)-350;const mist=ctx.createRadialGradient(x,620+Math.sin(tm+i)*15,15,x,620,240);mist.addColorStop(0,'#bfdfee0e');mist.addColorStop(1,'#bfdfee00');ctx.fillStyle=mist;ctx.fillRect(x-240,400,480,320);}
   if(!reducedMotion){const phase=tm%13;lightning=phase<.17?(1-phase/.17)*.2:0;if(lightning>0){ctx.fillStyle=`rgba(214,227,255,${lightning})`;ctx.fillRect(0,0,W,H);}}
  }else{
   for(let i=0;i<15;i++){const x=mod(i*139+Math.sin(tm*.5+i)*25-camera*.25,W),y=190+i*29%360;ctx.globalAlpha=.3+Math.sin(tm*2+i)*.15;ctx.fillStyle='#82f4e2';ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
  }
 }
 ctx.restore();
}
function drawMenu(){background(true);const small=W<800,heroX=small?W*.86:W*.70,groundY=H*.85;ctx.fillStyle='#063c3425';ctx.beginPath();ctx.ellipse(heroX,groundY,135,21,0,0,Math.PI*2);ctx.fill();sprite('girl-idle',heroX,groundY+Math.sin(t*2)*3,390);sprite('dog',small?W*1.1:W*.86,groundY+7+Math.sin(t*3)*4,150);drawWeather(0,true);for(let i=0;i<6;i++)diamond(W*.55+i*77,H*.34+Math.sin(i*1.4+t)*30,5,'#fff0a8',t*.4);}
function drawPlatform(p){
 if(p.slope){drawSlope(p);return;}
 const x=p.x-camera,w=worlds[level];if(x>W+60||x+p.w<-60)return;const grad=ctx.createLinearGradient(0,p.y,0,p.y+p.h);grad.addColorStop(0,w.rock);grad.addColorStop(1,w.base);
 ctx.save();ctx.shadowColor='#11243338';ctx.shadowBlur=14;ctx.shadowOffsetY=9;rr(x,p.y,p.w,p.h,Math.min(12,p.h/2),grad);ctx.restore();rr(x,p.y,p.w,17,8,w.top);rr(x,p.y+11,p.w,8,4,w.edge);
 if(level===1){
  ctx.strokeStyle='#ffebc536';ctx.lineWidth=2;for(let y=p.y+30;y<p.y+p.h;y+=28){ctx.beginPath();ctx.moveTo(x+10,y);ctx.bezierCurveTo(x+p.w*.3,y-10,x+p.w*.7,y+10,x+p.w-10,y);ctx.stroke();}
  ctx.fillStyle='#fff5d270';for(let i=17;i<p.w;i+=37){ctx.fillRect(x+i,p.y+5,9,2);}
 }else if(level===2){
  ctx.strokeStyle='#7f9eb432';ctx.lineWidth=2;for(let y=p.y+33;y<p.y+p.h;y+=38){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+p.w,y);ctx.stroke();for(let bx=28;bx<p.w;bx+=86){ctx.beginPath();ctx.moveTo(x+bx+(y%2)*24,y);ctx.lineTo(x+bx+(y%2)*24,y+38);ctx.stroke();}}
  ctx.fillStyle='#cbfff255';for(let i=18;i<p.w;i+=42){ctx.beginPath();ctx.ellipse(x+i,p.y+6,12,2,0,0,Math.PI*2);ctx.fill();}
 }else{
  ctx.fillStyle='#e4ffc35e';for(let i=16;i<p.w;i+=35){ctx.beginPath();ctx.ellipse(x+i,p.y+5,7,2,0,0,Math.PI*2);ctx.fill();}
  if(p.ground)for(let i=20;i<p.w;i+=58)rr(x+i,p.y+40+(i%3)*15,25,7,3,'#ffffff12');
 }
}
function animatedSprite(name,x,bottom,height,face=1,alpha=1,rotation=0,sx=1,sy=1){
 const img=assets[name];if(!img)return;const width=height*img.width/img.height;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,bottom);ctx.rotate(rotation);ctx.scale(face*sx,sy);ctx.drawImage(img,-width/2,-height,width,height);ctx.restore();
}
function star(x,y,r=14,color='#ffe493',rotation=0){ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.shadowColor=color;ctx.shadowBlur=13;ctx.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,s=i%2?r*.46:r;const px=Math.cos(a)*s,py=Math.sin(a)*s;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.closePath();ctx.fillStyle=color;ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle='#fffde0';ctx.stroke();ctx.restore();}
function drawRay(){if(!beam)return;const a=beam.life/.24,x=beam.x-camera,y=beam.y;ctx.save();ctx.globalAlpha=a;ctx.lineCap='round';for(let layer=0;layer<3;layer++){ctx.strokeStyle=['#47e5fa88','#c2ffff','#fffce5'][layer];ctx.lineWidth=[22,10,3][layer];ctx.shadowColor='#93ffff';ctx.shadowBlur=20;ctx.beginPath();ctx.moveTo(x,y);for(let j=1;j<17;j++){ctx.lineTo(x+beam.face*beam.range*j/16,y+Math.sin(j*2.1+t*75)*(layer===2?8:14));}ctx.stroke();}ctx.restore();}
function drawSprings(){if(courseRun)return;for(const i of [8,12]){const p=platforms[i],x=p.x+p.w*.55-camera,y=p.y;ctx.save();ctx.strokeStyle='#a1ffe4';ctx.lineWidth=4;ctx.shadowBlur=12;ctx.shadowColor='#6effb9';ctx.beginPath();ctx.ellipse(x,y-4,24,6,0,0,Math.PI*2);ctx.stroke();for(let k=0;k<3;k++){const rise=(t*38+k*16)%47;ctx.globalAlpha=1-rise/47;ctx.beginPath();ctx.moveTo(x-8,y-rise);ctx.lineTo(x,y-rise-7);ctx.lineTo(x+8,y-rise);ctx.stroke();}ctx.restore();}}
function drawBoss(){
 if(boss.kind==='stone'){drawStoneBoss();return;}
 if(level!==5||!boss.active)return;
 if(boss.defeated){if(boss.clock<2)animatedSprite('witch',boss.x-camera,boss.y+60,155,1,1-boss.clock/2,-boss.clock*.4);return;}
 const x=boss.x-camera,y=boss.y;ctx.save();
 if(boss.state==='warn'||boss.state==='dive'){ctx.globalAlpha=.35+.2*Math.sin(t*13);ctx.fillStyle='#ff8ca8';ctx.beginPath();ctx.ellipse(boss.targetX-camera,562,60,9,0,0,Math.PI*2);ctx.fill();label('!',boss.targetX-camera,540,'#fff0a3',30);ctx.globalAlpha=1;}
 if(boss.state!=='exposed'){ctx.strokeStyle='#d9a1ff77';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,87,t*1.1,t*1.1+Math.PI*1.7);ctx.stroke();}
 if(boss.state==='cast'){const charge=clamp(boss.clock/.85,0,1);diamond(x+boss.face*60,y+20,13+charge*12,'#f0adff',t*3);}
 animatedSprite('witch',x,y+65,155,boss.face,boss.flash>.1&&Math.floor(t*18)%2?.5:1,boss.state==='dive'?.25*boss.face:Math.sin(t*2)*.06);
 if(boss.state==='exposed'){for(let i=0;i<3;i++)star(x+Math.cos(t*3+i*2.1)*55,y-60+Math.sin(t*3+i*2.1)*9,7,'#fff2a1',t);label('VULNERÁVEL',x,y-106,'#fff5b2',13);}
 ctx.restore();
}
function sceneBG(name){const im=assets[name];if(!im)return;const scale=Math.max(W/im.width,H/im.height);ctx.drawImage(im,(W-im.width*scale)/2,(H-im.height*scale)/2,im.width*scale,im.height*scale);}
function magicSwirl(x,y,progress,color){ctx.save();for(let i=0;i<28;i++){const a=i*2.4+cinematicTime*5,r=25+Math.sin(i+progress*4)*35+progress*25;star(x+Math.cos(a)*r,y+Math.sin(a)*r*.9,3+i%4,color,a);}ctx.restore();}
function drawCinematic(){
 const tm=cinematicTime,intro=mode==='intro'||(mode==='pause'&&pauseReturn==='intro'),ground=H*.84,center=W*.5;
 if(intro){
  sceneBG('world');drawWeather(0,false);const walk=clamp(tm/2.6,0,1),fatherX=W*.31+walk*W*.13,girlX=W*.43+walk*W*.13;
  const change=clamp((tm-6.8)/2,0,1),fatherPose=tm<2.6?'dad-walk-'+Math.floor(tm*7)%4:'father';
  if(change<1)animatedSprite(fatherPose,fatherX,ground,236*(1-change*.55),1,1-change,change*.15,1,1);
  if(change>0)animatedSprite('dog',fatherX,ground,90,1,change,0,1+Math.sin(tm*7)*.025,1);
  animatedSprite(tm<2.6?'skate-'+Math.floor(tm*7)%4:'girl-idle',girlX,ground+(tm<2.6?Math.sin(tm*12)*2:0),tm<2.6?166:156,-1,1);
  if(tm>2.8&&tm<12.5){const arrival=clamp((tm-2.8)/2.7,0,1),leave=Math.max(0,tm-10.5),wx=W+140-(W*.28+140)*arrival+leave*260,wy=250+Math.sin(tm*3)*14-leave*130;animatedSprite('witch',wx,wy,190,-1,1,Math.sin(tm*2)*.08);
   if(tm>5.8&&tm<7.5){ctx.save();ctx.strokeStyle='#d998ff';ctx.lineWidth=7;ctx.shadowColor='#dc9bff';ctx.shadowBlur=25;ctx.beginPath();ctx.moveTo(wx-60,wy-65);ctx.quadraticCurveTo(center,210,fatherX,ground-100);ctx.stroke();ctx.restore();}
  }
  if(tm>6.4&&tm<9.5)magicSwirl(fatherX,ground-75,change,'#ecb1ff');
 }else{drawEndingScene(tm);}

 ctx.fillStyle='#082536ba';ctx.fillRect(0,0,W,43);ctx.fillRect(0,H-105,W,105);
 const fade=cinematicTime<.6?1-cinematicTime/.6:0;if(fade>0){ctx.fillStyle=`rgba(13,33,46,${fade})`;ctx.fillRect(0,0,W,H);}
}
function drawActors(){
 if(mounted){const phase=Math.floor(player.stride*1.6)%4;animatedSprite('ride-'+phase,player.x+24-camera,player.y+player.h+8+(player.ground?Math.sin(player.stride*4)*2:0),176,player.face,invuln>0&&Math.floor(t*12)%2?.5:1,player.ground?0:clamp(player.vy/3500,-.1,.1));if(attackTime>0){ctx.strokeStyle='#fff0ac';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(player.x+24-camera,player.y+player.h-30,98,28,t*10,0,Math.PI*1.7);ctx.stroke();}return;}
 if(mode==='ending'||mode==='win'){sprite('father',player.x+90-camera,570,155);sprite('girl-idle',player.x-camera,570,110);for(let i=0;i<12;i++)diamond(player.x+45-camera+Math.cos(i+t)*100,470+Math.sin(i+t)*90,6,'#ffe294');return;}
 const px=player.x+16-camera,py=player.y+player.h+4,alpha=invuln>0&&Math.floor(t*12)%2?.4:1;
 for(const tr of trail)animatedSprite(tr.pose,tr.x-camera,tr.y,116,tr.face,tr.life*.65,0,1.02,1);
 ctx.fillStyle='#0c243e38';ctx.beginPath();ctx.ellipse(px,player.y+player.h+2,25*(player.ground?1:.75),5,0,0,Math.PI*2);ctx.fill();
 if(attackTime>0){
  const progress=(ATTACK_DURATION-attackTime)/ATTACK_DURATION,angle=progress*Math.PI*5;
  ctx.save();ctx.translate(px,py-42);ctx.lineCap='round';
  for(let i=0;i<3;i++){ctx.strokeStyle=['#fff9cbe0','#ffc8eded','#96fff0b0'][i];ctx.lineWidth=9-i*2;ctx.shadowColor=['#ffe59c','#ff8ede','#87ffff'][i];ctx.shadowBlur=14;ctx.beginPath();ctx.ellipse(0,(i-1)*16,71-i*4,18+i*5,Math.sin(angle)*.12,angle+i*1.7,angle+i*1.7+Math.PI*1.45);ctx.stroke();}
  ctx.restore();
  // Four views around the vertical axis: profile, back, opposite profile, front.
  const order=[0,2,3,1],phase=progress*10,frame=order[Math.floor(phase)%4];
  animatedSprite('spin-'+frame,px,py-3,116,player.face,alpha,Math.sin(angle)*.035,1,1+Math.sin(angle)*.018);
 }else if(!player.ground){
  softSprite('girl-jump',px,py,110,player.face,alpha,player.lean*.4,1+player.squash,1-player.squash,clamp(player.vy/120,-5,5));
 }else{
  const blend=player.moveBlend,phase=player.stride%4,index=Math.floor(phase),bounce=Math.sin(player.stride*Math.PI)*2.3*blend;
  // Feet remain anchored; chest, hair and hips follow different curves.
  const pose=blend>.22?'skate-'+index:'girl-idle';
  softSprite(pose,px,py+bounce,pose==='girl-idle'?110:116,player.face,alpha,player.lean,1+player.squash,1-player.squash,Math.sin(player.stride*Math.PI)*2.6*blend+Math.sin(t*2.8)*.65);

 }
 const speed=Math.abs(dog.vx),run=speed>40,dogFrame=run?'dog-run'+(Math.floor(dog.stride)%2):'dog';
 const bounce=run?Math.sin(dog.stride*Math.PI)*2.5:Math.sin(t*3)*1.2,squash=dog.barkAnim>0?Math.sin(dog.barkAnim*20)*.07:run?Math.sin(dog.stride*Math.PI)*.045:0;
 if(dog.assist>0){ctx.save();ctx.strokeStyle='#ffe7a58f';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(dog.x-camera-dog.face*40,dog.y+20);ctx.lineTo(dog.x-camera,dog.y+20);ctx.stroke();ctx.restore();}
 softSprite(dogFrame,dog.x+20-camera,dog.y+dog.h+5+bounce,60,dog.face,1,dog.ground?0:clamp(dog.vy/2400,-.16,.16)*dog.face,1+squash,1-squash,Math.sin(dog.stride*Math.PI)*1.7);
}
function drawEnemies(){
 for(const e of enemies){
  if(e.dead&&e.deathLife<=0)continue;const x=e.x+22-camera;if(x<-180||x>W+180)continue;
  if(e.dead){animatedSprite(e.type,x,e.y+e.h,70,e.dir,clamp(e.deathLife/.65,0,1),(.65-e.deathLife)*e.dir*5,1,1);continue;}
  const fly=['scarab','bat','ghost'].includes(e.type),phase=e.clock*7+e.phase,bounce=fly?0:Math.abs(Math.sin(phase))*2;
  ctx.fillStyle='#112a4433';ctx.beginPath();ctx.ellipse(x,570,fly?19:25,4,0,0,Math.PI*2);ctx.fill();
  const sx=e.type==='bat'?1+Math.sin(e.clock*13)*.18:1+Math.sin(phase)*.025;
  const sy=e.type==='mushroom'?1+Math.cos(e.clock*7)*.07:1-Math.sin(phase)*.025;
  ctx.save();if(e.type==='ghost'){ctx.shadowColor='#b887ff';ctx.shadowBlur=20;ctx.globalAlpha=.8+Math.sin(e.clock*3)*.12;}
  animatedSprite(e.type,x,e.y+e.h+bounce,e.type==='bat'?66:e.type==='scorpion'?72:70,e.dir,1,fly?Math.sin(e.clock*3)*.06:0,sx,sy);ctx.restore();
  if(e.attackState==='warn')label('!',x,e.y-29,'#ffec9b',29);
 }
}
function draw(){
 if(mode==='editor'){drawEditor();return;}
 ctx.clearRect(0,0,W,H);if(mode==='win'||cinematicModes.has(mode)||(mode==='pause'&&cinematicModes.has(pauseReturn))){drawCinematic();return;}if(mode==='menu'||!player){drawMenu();return;}
 background();ctx.save();if(shake>0&&!reducedMotion)ctx.translate(Math.sin(t*90)*shake*30,Math.cos(t*105)*shake*18);
 drawWorldDepth(false);for(const p of platforms){ctx.save();const b=p.bounce||0;ctx.translate(0,Math.sin(b*35)*b*12);drawPlatform(p);drawLivingPlatform(p);ctx.restore();}drawWorldProps();
 for(let i=0;i<Math.min(3,platforms.length-1);i++){const end=platforms[i].x+platforms[i].w,next=platforms[i+1].x,grad=ctx.createLinearGradient(0,595,0,H);grad.addColorStop(0,'#00000000');grad.addColorStop(1,level===1?'#eec38388':level===5?'#415eaaa0':'#81e4dd99');ctx.fillStyle=grad;ctx.fillRect(end-camera,595,next-end,H-595);}
 for(const g of gems)if(!g.got&&g.x-camera>-30&&g.x-camera<W+30)star(g.x-camera,g.y+Math.sin(t*3+g.phase)*6,15,'#ffe492',Math.sin(t+g.phase)*.12);
 if(!gate.open){const x=gate.x-camera;ctx.save();ctx.shadowColor=worlds[level].color;ctx.shadowBlur=25;rr(x,gate.y,gate.w,gate.h,18,'#bdddcf55',worlds[level].color);for(let i=0;i<8;i++)diamond(x+19,gate.y+25+i*32,7,worlds[level].color,t+i);ctx.restore();label('SELO ENCANTADO',x+19,gate.y-20,'#ffffdf',12);}
 if(!item.got){const x=item.x-camera,y=item.y+Math.sin(t*2)*8;ctx.save();ctx.globalAlpha=item.visible?1:.45;diamond(x,y,item.visible?25:15,worlds[level].color,t*.2);for(let i=0;i<5;i++){const a=t+i*Math.PI*2/5;diamond(x+Math.cos(a)*42,y+Math.sin(a)*24,4,worlds[level].color);}ctx.restore();label(item.visible?worlds[level].item:'Algo brilha aqui…',x,y-55,'#fffde1',14);}
 for(const x of (courseRun?[]:[1045,1885,3005])){ctx.fillStyle='#f6e0a1';ctx.fillRect(x-camera,528,4,42);rr(x-camera-13,511,31,25,9,checkpoint>=x?'#d9f394':'#f6f0d4');label('♡',x-camera+2,529,'#487954',17);}
 drawSprings();drawEnemies();
 const portalX=(courseRun?courseRun.goal.x:3960)-camera,portalY=courseRun?courseRun.goal.y:476;ctx.save();ctx.shadowColor=ingredients.includes(level)?'#ffea93':'#a6f0dd';ctx.shadowBlur=35;ctx.strokeStyle=ingredients.includes(level)?'#ffea93':'#b5ffeb88';ctx.lineWidth=9;ctx.beginPath();ctx.ellipse(portalX,portalY,47,83,0,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#d9ffe12b';ctx.fill();ctx.restore();if(level===5&&!courseRun){sprite('potion',portalX,515,100);label('O ANTÍDOTO',portalX,370);}else label(courseRun?'OBJETIVO':'PRÓXIMO MUNDO',portalX,portalY-110,'#fffbce',12);
 drawBoss();
 for(const p of projectiles)diamond(p.x-camera,p.y,15,p.reflected?'#fff4a6':'#efadff',t*3);
 drawActors();drawBuddy();drawRay();drawImpacts();drawCourseObjects();
 for(const ring of barkRings){ctx.strokeStyle=`rgba(255,243,170,${ring.life/.65})`;ctx.lineWidth=4;ctx.beginPath();ctx.arc(ring.x-camera,ring.y,(.65-ring.life)*330+20,0,Math.PI*2);ctx.stroke();label('AU!',ring.x-camera,ring.y-40,'#ffefab',19);}
 for(const p of particles){ctx.globalAlpha=clamp(p.life/.5,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x-camera,p.y,p.size,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;
 for(const f of floaters){ctx.globalAlpha=Math.min(1,f.life*2);label(f.text,f.x-camera,f.y,f.color,17);}ctx.globalAlpha=1;ctx.restore();
 drawWeather(level,true);drawWorldDepth(true);
 rr(25,H-12,W-50,3,2,'#ffffff30');rr(25,H-12,(W-50)*clamp(player.x/(worldWidth()-140),0,1),3,2,worlds[level].color);
}
let accumulator=0;
function frame(now){const delta=last?Math.min((now-last)/1000,.075):0;last=now;accumulator+=delta;const step=1/120;let steps=0;while(accumulator>=step&&steps<10){t+=step;update(step);accumulator-=step;steps++;}draw();requestAnimationFrame(frame);}

Promise.all(names.map(name=>new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>{assets[name]=img;resolve()};img.onerror=()=>reject(new Error(name));img.src=`assets/${name==='world'?'world.webp':['desert','darkwood','home','ice','sky','volcano'].includes(name)?name+'.webp':name+'.png'}`}))).then(()=>{ready=true;$('start').disabled=false;$('start').textContent='Começar aventura';show('continue',!!safeRead());requestAnimationFrame(frame)}).catch(()=>{$('start').disabled=false;$('start').textContent='Recarregar aventura';$('start').onclick=()=>location.reload();toast('Uma imagem não carregou. Toque para tentar novamente.')});
