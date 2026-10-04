'use strict';
// All animation uses game time. Pausing freezes scenery, effects and stories together.
let impacts=[],resonators=[],pods=[],resonanceTime=0,ambientClock=0;
function resetModern(){impacts=[];resonanceTime=0;ambientClock=0;resonators=[{x:1180,used:false,pulse:0},{x:2700,used:false,pulse:0}];pods=[{x:700,y:527,opened:false},{x:2020,y:447,opened:false},{x:3250,y:527,opened:false}];}
function impact(x,y,color,power=1){impacts.push({x,y,color,power,life:.42,max:.42});if(impacts.length>30)impacts.shift();}
function updateEffects(dt){for(const p of impacts)p.life-=dt;impacts=impacts.filter(p=>p.life>0);for(const p of platforms)p.bounce=Math.max(0,(p.bounce||0)-dt);}
function activateResonance(){
 for(const r of resonators)if(!r.used&&Math.abs(player.x-r.x)<175){r.used=true;r.pulse=1;resonanceTime=7;gainStar(2);impact(r.x,490,'#b0fff1',2);burst(r.x,490,'#adffe0',34);sfx('power');toast('RESSONÂNCIA! O cenário acordou. +2 estrelas');}
}
function updateWorldInteractions(dt){
 resonanceTime=Math.max(0,resonanceTime-dt);ambientClock-=dt;
 for(const r of resonators)r.pulse=Math.max(0,r.pulse-dt);
 for(const p of pods){if(p.opened)continue;const close=Math.abs(player.x+16-p.x)<92&&Math.abs(player.y+36-p.y)<92;const ray=beam&&(p.x-beam.x)*beam.face>0&&(p.x-beam.x)*beam.face<beam.range&&Math.abs(p.y-beam.y)<65;if(close&&attackTime>0||ray){p.opened=true;gainStar(3);impact(p.x,p.y,'#ffe9a0',1.2);burst(p.x,p.y,worlds[level].color,25);sfx('hit');floaters.push({x:p.x,y:p.y-25,text:'+3 ESTRELAS',color:'#fff3a3',life:1.2});}}
 // Resonance is a visible upward current, helpful without taking control from Isa.
 if(resonanceTime>0&&player.vy>0&&!player.ground){player.vy-=180*dt;}
 if(ambientClock<=0){ambientClock=level===2?5:9;sfx(level===2?'rain':level===1?'wind':'bird');}
}
function sfx(kind){
 if(typeof muted==='undefined'||muted)return;
 try{
 audioCtx??=new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume();const c=audioCtx,now=c.currentTime;
 const settings={spin:[.24,1200,100,.065],hit:[.19,900,60,.14],land:[.09,160,45,.035],ray:[.3,2600,90,.07],bark:[.18,520,160,.05],jump:[.12,200,900,.03],power:[.5,400,1800,.05],wind:[1.1,800,1800,.009],rain:[1.3,2400,1800,.006],bird:[.16,2000,3100,.008]};
 const [duration,f0,f1,vol]=settings[kind]||settings.hit,buffer=c.createBuffer(1,Math.ceil(c.sampleRate*duration),c.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/data.length,1.5);
 const source=c.createBufferSource();source.buffer=buffer;const filter=c.createBiquadFilter();filter.type='bandpass';filter.Q.value=kind==='bark'?5:1;filter.frequency.setValueAtTime(f0,now);filter.frequency.exponentialRampToValueAtTime(f1,now+duration);const gain=c.createGain();gain.gain.setValueAtTime(vol,now);gain.gain.exponentialRampToValueAtTime(.001,now+duration);source.connect(filter);filter.connect(gain);gain.connect(c.destination);source.start();source.stop(now+duration);
 }catch{}
}
function softSprite(name,x,bottom,height,face=1,alpha=1,rotation=0,sx=1,sy=1,bend=0){
 const im=assets[name];if(!im)return;const width=height*im.width/im.height;
 ctx.save();ctx.globalAlpha*=alpha;ctx.translate(x,bottom);ctx.rotate(rotation);ctx.scale(face*sx,sy);
 // Piecewise skin deformation: feet locked; torso/hair lag in motion.
 const count=20;for(let i=0;i<count;i++){const v=i/count,sh=im.height/count,dy=-height+v*height,offset=Math.sin((1-v)*Math.PI*.8)*bend;ctx.drawImage(im,0,i*sh,im.width,Math.min(sh+1,im.height-i*sh),-width/2+offset,dy,width,height/count+.6);}
 ctx.restore();
}
function drawImpacts(){
 ctx.save();ctx.globalCompositeOperation='lighter';for(const f of impacts){const a=f.life/f.max,r=(1-a)*74*f.power;ctx.globalAlpha=a*.75;ctx.strokeStyle=f.color;ctx.lineWidth=2+a*5;ctx.beginPath();ctx.ellipse(f.x-camera,f.y,r,r*.55,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<8;i++){const ang=i*Math.PI/4;ctx.beginPath();ctx.moveTo(f.x-camera+Math.cos(ang)*r*.7,f.y+Math.sin(ang)*r*.7);ctx.lineTo(f.x-camera+Math.cos(ang)*(r+14*a),f.y+Math.sin(ang)*(r+14*a));ctx.stroke();}}ctx.restore();
}
function drawLivingPlatform(p){
 if(p.slope)return;
 const x=p.x-camera;if(x>W+40||x+p.w<-40)return;
 // Reactive blades and tiny luminescent growth on the platform surface.
 ctx.save();ctx.lineCap='round';const palette=level===0?['#4a8e51','#c6ff94','#91dc6b']:level===1?['#a06f38','#eabc72','#ffefb1']:['#456d82','#96eada','#bc91ee'];
 for(let i=14;i<p.w-10;i+=23){const wx=p.x+i,near=player?Math.max(0,1-Math.abs(player.x+16-wx)/65):0,push=player?near*player.vx*.022:0,sway=Math.sin(weatherTime*2.1+wx*.05)*3+push;ctx.strokeStyle=palette[Math.floor(i)%3];ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+i,p.y+2);ctx.quadraticCurveTo(x+i+sway*.4,p.y-7,x+i+sway,p.y-7-i%9);ctx.stroke();if(i%5===0){ctx.fillStyle=worlds[level].color;ctx.beginPath();ctx.arc(x+i+sway,p.y-10-i%9,2.3,0,Math.PI*2);ctx.fill();}}
 if(p.axis){ctx.globalAlpha=.24;ctx.strokeStyle=worlds[level].color;ctx.setLineDash([3,8]);ctx.beginPath();if(p.axis==='x'){ctx.moveTo(p.bx-camera-p.amp+p.w/2,p.by+p.h+13);ctx.lineTo(p.bx-camera+p.amp+p.w/2,p.by+p.h+13);}else{ctx.moveTo(x+p.w/2,p.by-p.amp);ctx.lineTo(x+p.w/2,p.by+p.amp+p.h);}ctx.stroke();}
 ctx.restore();
}
function drawWorldProps(){
 for(const p of pods){const x=p.x-camera;if(x<-60||x>W+60)continue;if(p.opened){ctx.globalAlpha=.35;star(x,p.y+26,9,worlds[level].color);ctx.globalAlpha=1;continue;}const bob=Math.sin(t*3+p.x)*3;ctx.save();ctx.translate(x,p.y+bob);ctx.rotate(Math.sin(t*2+p.x)*.07);const g=ctx.createLinearGradient(-22,-25,22,25);g.addColorStop(0,'#fff9b4');g.addColorStop(.5,['#70dcb1','#ffa858','#b994ec'][theme()]);g.addColorStop(1,['#258b8b','#a95439','#695899'][theme()]);rr(-22,-25,44,44,12,g,'#fff5bb');star(0,-3,11,'#fffae0',t*.3);ctx.restore();if(Math.abs(player.x-p.x)<150)label('↓ GIRO',x,p.y-42,'#fffbd0',11);}
 for(const r of resonators){const x=r.x-camera;if(x<-90||x>W+90)continue;const y=493+Math.sin(t*2+r.x)*5;ctx.save();ctx.shadowColor='#9dffdf';ctx.shadowBlur=20;ctx.strokeStyle=r.used?'#95b5b0':'#b4ffec';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(x,y,25,34,Math.sin(t*2)*.1,0,Math.PI*2);ctx.stroke();diamond(x,y,12,r.used?'#9abeb1':'#fff3a4',t);ctx.restore();if(!r.used&&Math.abs(player.x-r.x)<165)label('ENTER · RESSONÂNCIA',x,y-53,'#e7fff5',11);}
}
function drawWorldDepth(front){
 const tm=weatherTime;ctx.save();
 if(!front){
  // Multiple translucent depth layers and flowing water in the gaps.
  for(let i=0;i<Math.min(3,platforms.length-1);i++){const p=platforms[i],end=p.x+p.w,next=platforms[i+1].x;const x=end-camera,width=next-end;if(x>W||x+width<0)continue;
   ctx.fillStyle=['#41d1c855','#efc68555','#758ee755'][theme()];ctx.beginPath();ctx.moveTo(x,H);ctx.lineTo(x,627);for(let j=0;j<=width;j+=6)ctx.lineTo(x+j,627+Math.sin(tm*2+j*.05)*4);ctx.lineTo(x+width,H);ctx.fill();
   ctx.strokeStyle=['#c1fff4','#fff0bf','#b1cfff'][theme()];ctx.lineWidth=1;for(let k=0;k<5;k++){ctx.globalAlpha=.28;ctx.beginPath();for(let j=0;j<=width;j+=8){const y=630+k*16+Math.sin(tm*2+j*.06+k)*3;j?ctx.lineTo(x+j,y):ctx.moveTo(x+j,y);}ctx.stroke();}ctx.globalAlpha=1;
  }
 }else{
  // Air currents visibly react to the dog's resonance.
  if(resonanceTime>0){ctx.strokeStyle='#d4ffe6';ctx.lineWidth=2;for(let i=0;i<18;i++){const x=((i*147-camera*.7)%W+W)%W,y=H-((tm*140+i*83)%H);ctx.globalAlpha=Math.min(1,resonanceTime)*.25;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+20,y-25,x+5,y-60);ctx.stroke();}}
  if(level===2){for(let i=0;i<15;i++){const x=((i*137-camera*.91)%W+W)%W,y=566;const life=(tm*1.7+i*.43)%1;ctx.globalAlpha=(1-life)*.22;ctx.strokeStyle='#dbf5ff';ctx.beginPath();ctx.ellipse(x,y,life*12,life*3,0,0,Math.PI*2);ctx.stroke();}}
  if(mounted&&!reducedMotion){ctx.globalAlpha=.18;ctx.strokeStyle='#fff5c0';ctx.lineWidth=2;for(let i=0;i<10;i++){const x=(i*179-t*600)%W,y=160+(i*87)%440;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+50,y);ctx.stroke();}}
 }
 ctx.restore();
}
function ease(v){v=clamp(v,0,1);return v*v*(3-2*v);}
function drawEndingScene(tm){
 const ground=H*.82,center=W*.5,home=ease((tm-16)/2.2),zoom=1+.055*ease((tm-5)/5)-.055*home;
 sceneBG('darkwood');ctx.save();ctx.globalAlpha=1-home;const terrace=ctx.createLinearGradient(0,ground,0,H);terrace.addColorStop(0,'#557083');terrace.addColorStop(1,'#1e2e45');rr(0,ground,W,H-ground,0,terrace);rr(0,ground,W,8,0,'#98bece');ctx.strokeStyle='#b9d1e333';ctx.lineWidth=2;for(let i=0;i<W;i+=95){ctx.beginPath();ctx.moveTo(i,ground+9);ctx.lineTo(i-60,H);ctx.stroke();}ctx.restore();ctx.save();ctx.globalAlpha=home;sceneBG('home');ctx.restore();
 ctx.save();ctx.translate(center,ground);ctx.scale(zoom,zoom);ctx.translate(-center,-ground);
 // The original playable characters stay in scene through approach and transformation.
 const change=ease((tm-2.7)/2.5),approach=ease((tm-6.5)/2.7),hugMix=ease((tm-9.4)/.65);
 if(tm<10.2){
  const gx=center-125+approach*105,jump=tm>8.8?Math.sin(clamp((tm-8.8)/1.2,0,1)*Math.PI)*33:0;
  if(hugMix<1){softSprite(approach>0&&approach<1?'skate-'+Math.floor(tm*8)%4:'girl-idle',gx,ground-jump,146,1,1-hugMix,approach<1?-.025:0,1,1,Math.sin(tm*6)*1.5);}
  if(tm<5.6)softSprite('dog',center+50,ground,87, -1,1-change,0,1+Math.sin(tm*4)*.025,1,Math.sin(tm*4));
  if(change>0&&hugMix<1)softSprite('father',center+50,ground,225, -1,change*(1-hugMix),Math.sin(tm*2)*.008,1,1,Math.sin(tm*2)*1.2);
  if(tm<3.6){const tilt=ease((tm-1)/1.2);animatedSprite('potion',center+30,ground-80-tilt*18,58,1,1-ease((tm-3)/.6),-tilt*.9);if(tilt>.5){ctx.fillStyle='#fff4af';ctx.beginPath();ctx.arc(center+43,ground-78+(tm*60%36),4,0,Math.PI*2);ctx.fill();}}
  if(tm>2.1&&tm<6.5){const p=clamp((tm-2.1)/4.4,0,1);magicSwirl(center+50,ground-110,p,'#fff4af');const g=ctx.createRadialGradient(center+50,ground-105,0,center+50,ground-105,150);g.addColorStop(0,`rgba(255,241,184,${Math.sin(p*Math.PI)*.8})`);g.addColorStop(1,'#fff1ba00');ctx.fillStyle=g;ctx.fillRect(center-100,ground-255,300,300);}
 }
 if(tm>=9.4&&tm<17.5){
  const close=ease((tm-10.2)/.9),release=1-ease((tm-16.5)/1),lift=Math.sin(ease((tm-10)/1.4)*Math.PI)*10,sway=Math.sin((tm-10)*2.7)*.018;
  if(close<1)softSprite('hug-0',center+24,ground-lift,230,1,hugMix*(1-close)*release,sway,1,1,Math.sin(tm*3)*1.2);
  softSprite('hug-1',center+24,ground-lift,230,1,hugMix*close*release,sway,1+Math.sin(tm*2.7)*.012,1-Math.sin(tm*2.7)*.012,Math.sin(tm*2.5)*2);
  for(let i=0;i<9;i++){const age=(tm-10+i*.38)%2.6;if(age<0)continue;const a=(1-age/2.6)*close*release;ctx.globalAlpha=a*.7;star(center+24+Math.sin(i*2.1)*75,ground-110-age*43,4,'#fff3b3',age);ctx.globalAlpha=1;}
 }
 if(tm>16.5){const progress=ease((tm-16.5)/8.5),alpha=ease((tm-16.5)/.8),stride=tm*5.6,size=230-progress*112,x=center+24+progress*W*.16,bottom=ground-progress*95;softSprite('walk-away-'+Math.floor(stride)%2,x,bottom+Math.sin(stride*Math.PI)*1.8,size,1,alpha,Math.sin(stride*Math.PI)*.012,1,1,Math.sin(stride*Math.PI)*1.7);}
 ctx.restore();
 // Foreground celebration continues across the camera transition to home.
 for(let i=0;i<35;i++){const x=((i*91+tm*(13+i%4))%(W+50))-25,y=((i*71+tm*24)%(H+30))-15;ctx.globalAlpha=home*.48;ctx.fillStyle=['#fff0ad','#ffb3d0','#b9ffcb'][i%3];ctx.save();ctx.translate(x,y);ctx.rotate(tm+i);ctx.fillRect(-3,-2,6,4);ctx.restore();}ctx.globalAlpha=1;
}
