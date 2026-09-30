import{$ as e,A as t,B as n,Bn as r,D as i,Dn as a,E as o,En as s,G as c,L as l,P as u,R as d,Sn as f,T as p,U as m,Un as h,V as g,Vn as _,Z as v,_t as y,an as ee,at as b,bn as x,c as te,dn as S,dt as C,et as w,f as T,gn as ne,hn as E,ht as D,l as re,m as ie,mn as ae,ot as O,pn as oe,pt as se,r as k,s as ce,tt as A,u as le,v as j,wn as ue,xn as de,yn as M,z as fe,zn as N}from"./three-core-CV043QAN.js";import{a as pe,c as me,d as he,i as ge,l as _e,n as ve,o as ye,r as be,s as xe,t as Se,u as Ce}from"./three-DkLIafAf.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var we={energy:.35,bounce:.25,jumpy:.15,shimmy:.45,showoff:.35,hop:.5,hopDown:.2,twitchGate:.6,twitchHype:.55,bob:1.4,swirl:4,hype:1.05},P=[{key:`energy`,label:`crowd energy`,min:-.3,max:.6,step:.05,help:`+ to every crowd member (0.65..1.3)`},{key:`bounce`,label:`crowd bounce`,min:-.3,max:.7,step:.05,help:`+ bob size trait (0.3..1)`},{key:`jumpy`,label:`crowd jumpy`,min:-.2,max:.8,step:.05,help:`+ hop trait (0.1..1)`},{key:`shimmy`,label:`crowd shimmy`,min:-.3,max:1,step:.05,help:`+ hi-hat twitch trait (0..1)`},{key:`showoff`,label:`crowd showoff`,min:0,max:.6,step:.05,help:`+ solo swirl trait (0.05..0.4)`},{key:`hop`,label:`hop every beat at`,min:.1,max:1,step:.05,help:`hype·energy·jumpy above this`},{key:`hopDown`,label:`hop every 2nd at`,min:.05,max:1,step:.05,help:`hype·energy·jumpy above this`},{key:`twitchGate`,label:`twitch: shimmy >`,min:0,max:1,step:.05,help:`hi-hat twitch gate`},{key:`twitchHype`,label:`twitch: hype >`,min:0,max:1,step:.05,help:`hi-hat twitch needs this much hype`},{key:`bob`,label:`bob size`,min:.5,max:2.5,step:.05,help:`groove squash multiplier`},{key:`swirl`,label:`swirl chance`,min:0,max:5,step:.25,help:`x solo + ripple odds`},{key:`hype`,label:`hype`,min:.5,max:1.6,step:.05,help:`x global (lights, camera too)`}],F={...we},Te=[];function Ee(e){Te.push(e)}function De(e,t){let n=P.find(t=>t.key===e);F[e]=Math.min(n.max,Math.max(n.min,t));for(let e of Te)e()}function Oe(){Object.assign(F,we);for(let e of Te)e()}function ke(e){for(let t of P){let n=e.get(t.key);if(n===null)continue;let r=Number(n);Number.isFinite(r)&&(F[t.key]=Math.min(t.max,Math.max(t.min,r)))}}function Ae(){return P.filter(e=>F[e.key]!==we[e.key]).map(e=>`${e.key}=${+F[e.key].toFixed(3)}`).join(`&`)}function je(){let e=new URLSearchParams(location.search);for(let t of P)F[t.key]===we[t.key]?e.delete(t.key):e.set(t.key,String(+F[t.key].toFixed(3)));let t=e.toString();history.replaceState(null,``,location.pathname+(t?`?`+t:``)+location.hash)}var Me=class{url;onTheme;onTrack;connected=!1;queue=[];ws=null;send(e){this.ws?.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}retry=0;constructor(e,t,n=()=>{}){this.url=e,this.onTheme=t,this.onTrack=n,this.open()}open(){let e=new WebSocket(this.url);this.ws=e,e.onopen=()=>{this.connected=!0,this.retry=0},e.onmessage=e=>{let t=JSON.parse(e.data);t.type===`theme`?this.onTheme(t):t.type===`track`?this.onTrack(t):this.queue.push(t)},e.onclose=()=>{this.connected=!1;let e=Math.min(4e3,250*2**this.retry++);setTimeout(()=>this.open(),e)}}poll(e,t){this.queue.length>400&&this.queue.splice(0,this.queue.length-400);for(let e of this.queue)t(e);this.queue.length=0}},Ne=class e{frames;connected=!0;i=0;constructor(e){this.frames=e}get duration(){return this.frames.length?this.frames[this.frames.length-1].t:0}poll(e,t){for(this.i>0&&this.frames[this.i-1].t>e+.5&&(this.i=0);this.i<this.frames.length&&this.frames[this.i].t<=e;)t(this.frames[this.i++])}static async load(t){let n=(await(await fetch(t)).text()).split(`
`).filter(e=>e.length>2).map(e=>JSON.parse(e));return new e(n)}},Pe=class{connected=!0;t=0;beat=0;phase=0;phraseOn=!1;poll(e,t){let n=512/48e3;for(;this.t+n<=e;){this.t+=n,this.phase+=n*122/60;let e=!1;this.phase>=1&&(--this.phase,this.beat++,e=!0);let r=Math.floor(this.beat/4)%32,i=r>=24&&r<28,a=r===28&&this.beat%4==0&&e,o=r>=20&&r<24,s=o?.35:i?.5+(r-24)*.1:r>=28?.95:.7,c=e&&!o&&!i?.9:0,l=e&&this.beat%2==1&&!o?.7:0,u=this.phase*2%1,d=u<n*4?.5:0,f=Math.sin(this.t*.35)>-.2&&!i,p=0;f!==this.phraseOn&&(p=f?1:2,this.phraseOn=f);let m=f&&Math.sin(this.t*2*Math.PI*3.1)>.97?.7:0,h=f?.35+.35*Math.max(0,Math.sin(this.t*2*Math.PI*3.1)):0,g=Math.exp(-this.phase*6);t({t:this.t,silent:!1,level:s*(.8+.2*g),db:-14,bands:[o?.2:.4+.5*g,o?.25:.5+.45*g,.5,.55,.5+(i?.3:0),.4+.3*(1-u)],brightness:.5+(i?.3:0),flux:c?.9:l?.6:.2,onset:c||l,kick:c,snare:l,hat:d,bpm:122,beatConf:.8,beatPhase:this.phase,beat:this.beat,barBeat:this.beat%4,beatHit:e,energy:s,energyLong:.65,build:i?(r-24)/4:0,drop:+!!a,calm:o?.6:0,density:.5,section:o?0:i?2:r>=28?3:1,vocal:f?.9:.05,vocalEnv:h,syllable:m,pitch:f?.4*Math.sin(this.t*.9):0,pitchHz:f?300:0,phrase:p})}}},I=class{s;constructor(e){this.s=e>>>0||1}next(){let e=this.s+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}int(e){return Math.floor(this.next()*e)}pick(e){return e[this.int(e.length)]}chance(e){return this.next()<e}weighted(e){let t=e.reduce((e,[,t])=>e+Math.max(0,t),0),n=this.next()*t;for(let[t,r]of e)if(n-=Math.max(0,r),n<=0)return t;return e[e.length-1][0]}},L=(e,t=0,n=1)=>e<t?t:e>n?n:e,Fe=(e,t,n)=>{let r=L((n-e)/(t-e));return r*r*(3-2*r)},R=(e,t,n,r)=>t+(e-t)*Math.exp(-n*r),Ie=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,z={Calm:0,Groove:1,Build:2,Peak:3},Le=[`calm`,`groove`,`build`,`peak`],Re=class{level=0;energy=0;energyLong=0;sub=0;bass=0;lowMid=0;mid=0;highMid=0;high=0;brightness=0;flux=0;vocal=0;vocalEnv=0;vocalFloor=0;mouth=0;pitch=0;build=0;calm=0;density=0;section=z.Groove;kickPulse=0;snarePulse=0;hatPulse=0;beatPulse=0;dropPulse=0;syllablePulse=0;sinceDrop=1e9;phraseTime=0;inPhrase=!1;presence=0;silentFor=1e9;bpm=120;beatConf=0;beatPos=0;barBeat=0;danceMul=1;danceBeatPos=0;hype=0;listeners=[];lastBeatFloor=-1;lastDanceFloor=-1;beatTarget=0;lastFrame=null;barOffset=0;wasSilent=!0;on(e){this.listeners.push(e)}emit(e){for(let t of this.listeners)t(e)}get beatPhase(){return this.beatPos-Math.floor(this.beatPos)}get dancePhase(){return this.danceBeatPos-Math.floor(this.danceBeatPos)}get barPos(){return((Math.floor(this.beatPos)-this.barOffset)%4+4)%4+this.beatPhase}get danceBpm(){return this.bpm*this.danceMul}get playing(){return this.presence>.5}ingest(e){this.lastFrame=e;let t=e.beat+e.beatPhase;if(this.beatTarget=t,Math.abs(t-this.beatPos)>1.5&&(this.beatPos=t,this.lastBeatFloor=Math.floor(t)),this.barOffset=((e.beat-e.barBeat)%4+4)%4,e.bpm>0){this.bpm=e.bpm;let t=e.bpm>=145?.5:e.bpm<80?2:1;t!==this.danceMul&&(this.danceMul===.5?e.bpm<138:this.danceMul!==2||e.bpm>86)&&(this.danceMul=t,this.danceBeatPos=this.beatPos*t,this.lastDanceFloor=Math.floor(this.danceBeatPos))}if(this.beatConf=e.beatConf,e.kick>0&&(this.kickPulse=Math.max(this.kickPulse,.5+.5*e.kick),this.emit({type:`kick`,strength:e.kick})),e.snare>0&&(this.snarePulse=Math.max(this.snarePulse,.5+.5*e.snare),this.emit({type:`snare`,strength:e.snare})),e.hat>0&&(this.hatPulse=Math.max(this.hatPulse,.4+.6*e.hat),this.emit({type:`hat`,strength:e.hat})),e.syllable>0&&e.vocal>.45&&(this.syllablePulse=Math.max(this.syllablePulse,.6+.4*L(e.syllable*1.5)),this.emit({type:`syllable`,strength:e.syllable})),e.drop>0&&(this.dropPulse=1,this.sinceDrop=0,this.emit({type:`drop`,strength:e.drop})),e.phrase===1?(this.inPhrase=!0,this.phraseTime=0,this.emit({type:`phraseStart`})):e.phrase===2&&(this.inPhrase=!1,this.emit({type:`phraseEnd`})),e.section!==this.section){let t=this.section;this.section=e.section,this.emit({type:`section`,from:t,to:e.section})}e.silent!==this.wasSilent&&(this.wasSilent=e.silent,this.emit({type:e.silent?`musicStop`:`musicStart`}))}update(e){let t=this.lastFrame;if(t){let n=t=>1-Math.exp(-t*e);this.level+=(t.level-this.level)*n(20),this.energy+=(t.energy-this.energy)*n(10),this.energyLong+=(t.energyLong-this.energyLong)*n(4);let[r,i,a,o,s,c]=t.bands;this.sub+=(r-this.sub)*n(18),this.bass+=(i-this.bass)*n(18),this.lowMid+=(a-this.lowMid)*n(14),this.mid+=(o-this.mid)*n(14),this.highMid+=(s-this.highMid)*n(14),this.high+=(c-this.high)*n(14),this.brightness+=(t.brightness-this.brightness)*n(6),this.flux+=(t.flux-this.flux)*n(25),this.vocal+=(t.vocal-this.vocal)*n(12),this.vocalEnv+=(t.vocalEnv-this.vocalEnv)*n(30),this.vocalFloor+=(this.vocalEnv-this.vocalFloor)*n(this.vocalEnv<this.vocalFloor?8:1.5),this.pitch+=(t.pitch-this.pitch)*n(8),this.build+=(t.build-this.build)*n(4),this.calm+=(t.calm-this.calm)*n(3),this.density+=(t.density-this.density)*n(3);let l=+!t.silent;this.presence=R(this.presence,l,l?3:.8,e),this.silentFor=t.silent?this.silentFor+e:0}let n=this.bpm/60;this.beatTarget+=n*e,this.beatPos+=n*e;let r=this.beatTarget-this.beatPos;r>.5&&--r,r<-.5&&(r+=1),this.beatPos+=L(r*(1-Math.exp(-6*e)),-.5*n*e,2*n*e);let i=Math.floor(this.beatPos);if(i!==this.lastBeatFloor){if(i>this.lastBeatFloor&&this.presence>.3){let e=((i-this.barOffset)%4+4)%4;this.barBeat=e,this.beatPulse=1,this.emit({type:`beat`,beat:i,barBeat:e,strength:this.beatConf})}this.lastBeatFloor=i}this.danceBeatPos=this.beatPos*this.danceMul;let a=Math.floor(this.danceBeatPos);a!==this.lastDanceFloor&&(a>this.lastDanceFloor&&this.presence>.3&&this.emit({type:`danceBeat`,beat:a,bar:Math.floor(a/4)}),this.lastDanceFloor=a);let o=(t,n)=>t*Math.exp(-n*e);this.kickPulse=o(this.kickPulse,9),this.snarePulse=o(this.snarePulse,8),this.hatPulse=o(this.hatPulse,14),this.beatPulse=o(this.beatPulse,6),this.dropPulse=o(this.dropPulse,.7),this.syllablePulse=o(this.syllablePulse,12),this.sinceDrop+=e,this.inPhrase&&(this.phraseTime+=e);let s=L((this.vocalEnv-this.vocalFloor)/.15),c=L((this.vocal-.35)/.3);this.mouth=c*L(.06+.3*s*s+.9*this.syllablePulse);let l=L(this.beatConf*1.6),u=L(((.25+.75*this.energy)*(.35+.65*l)*this.presence+this.dropPulse*.4+(this.section===z.Peak?.15:0)-this.calm*.25)*F.hype);this.hype=R(this.hype,u,2.5,e)}},ze=class{accent;status;help;canvas;ctx;debug=!1;hist=[];statusText=``;statusAlpha=1;constructor(e){this.accent=e;let t=document.createElement(`style`);t.textContent=`
      .wp-status { position: fixed; left: 28px; bottom: 24px; font: 500 14px/1.4 ui-sans-serif, system-ui, sans-serif;
        color: #fff; letter-spacing: .02em; text-shadow: 0 1px 8px rgba(0,0,0,.7); pointer-events: none; transition: opacity .6s; }
      .wp-status b { font-weight: 700; }
      .wp-help { position: fixed; right: 28px; bottom: 24px; padding: 14px 18px; border-radius: 12px;
        background: rgba(10,10,14,.72); backdrop-filter: blur(8px); color: #eee; font: 13px/1.7 ui-monospace, monospace;
        display: none; border: 1px solid rgba(255,255,255,.12); }
      .wp-help kbd { display: inline-block; min-width: 1.6em; text-align: center; padding: 0 .3em; margin-right: .6em;
        border-radius: 4px; background: rgba(255,255,255,.14); }
      .wp-debug { position: fixed; left: 16px; top: 16px; pointer-events: none; display: none; }
    `,document.head.appendChild(t),this.status=document.createElement(`div`),this.status.className=`wp-status`,this.help=document.createElement(`div`),this.help.className=`wp-help`;for(let[e,t]of[[`space`,`next camera shot`],[`1–9`,`hold a shot · 0 auto`],[`t`,`preview next theme · T current`],[`d`,`signal debugger + crowd activity`],[`k`,`tuning dials`],[`f`,`fullscreen`],[`h`,`this help`],[`q`,`quit`]]){let n=document.createElement(`div`),r=document.createElement(`kbd`);r.textContent=e,n.append(r,t),this.help.append(n)}this.canvas=document.createElement(`canvas`),this.canvas.className=`wp-debug`,this.canvas.width=460,this.canvas.height=340,this.ctx=this.canvas.getContext(`2d`),document.body.append(this.status,this.help,this.canvas)}toggleHelp(){this.help.style.display=this.help.style.display===`block`?`none`:`block`}toggleDebug(){this.debug=!this.debug,this.canvas.style.display=this.debug?`block`:`none`}setStatus(...e){let t=JSON.stringify(e);t!==this.statusText&&(this.statusText=t,this.status.replaceChildren(...e.map(e=>{if(typeof e==`string`)return e;let t=document.createElement(`b`);return t.textContent=e.b,t})))}update(e,t,n,r){let i=+!t.playing;if(this.statusAlpha+=(i-this.statusAlpha)*(1-Math.exp(-e*2)),this.status.style.opacity=String(this.statusAlpha),!this.debug)return;this.hist.push({v:t.level,vocal:t.vocal,kick:t.kickPulse,beat:t.beatPulse}),this.hist.length>220&&this.hist.shift();let a=this.ctx,o=this.canvas.width,s=this.canvas.height;a.clearRect(0,0,o,s),a.fillStyle=`rgba(8,8,12,.78)`,a.fillRect(0,0,o,s),a.font=`12px ui-monospace, monospace`,a.fillStyle=`#fff`,a.fillText(`${t.bpm.toFixed(1)} bpm (dance ${t.danceBpm.toFixed(0)})  conf ${t.beatConf.toFixed(2)}  ${Le[t.section]}  ${n}`,10,18),[[`level`,t.level,`#9aa`],[`energy`,t.energy,`#9cf`],[`hype`,t.hype,this.accent()],[`bass`,t.bass,`#f96`],[`mid`,t.mid,`#fc6`],[`high`,t.high,`#6cf`],[`vocal`,t.vocal,`#f6c`],[`mouth`,t.mouth,`#f9d`],[`build`,t.build,`#fd4`],[`calm`,t.calm,`#8f8`]].forEach(([e,t,n],r)=>{let i=32+r*13;a.fillStyle=`#aaa`,a.fillText(e,10,i+9),a.fillStyle=n,a.fillRect(70,i,150*Math.max(0,Math.min(1,t)),9)});for(let e=0;e<4;e++)a.fillStyle=Math.floor(t.barPos)===e?this.accent():`rgba(255,255,255,.2)`,a.beginPath(),a.arc(250+e*22,40,7+(Math.floor(t.barPos)===e?3*t.beatPulse:0),0,Math.PI*2),a.fill();let c=o-240-10,l=(e,t,n,r)=>{a.strokeStyle=t,a.beginPath(),this.hist.forEach((t,i)=>{let o=240+i/220*c,s=n+r-t[e]*r;i?a.lineTo(o,s):a.moveTo(o,s)}),a.stroke()};l(`v`,`#9cf`,70,50),l(`vocal`,`#f6c`,130,50),l(`kick`,`#f96`,190,50),r&&this.drawActivity(r,256)}drawActivity(e,t){let n=this.ctx,r=[[`crowd`,`crowd`],[`heroes`,`heroes`],[`yellow`,`yellow`]];n.fillStyle=`#fff`,n.fillText(`activity (4 s)`,10,t),r.forEach(([e],r)=>{n.fillStyle=`#aaa`,n.fillText(e,130+r*80,t)}),[[`hops/beat`,e=>e.hops.toFixed(2)],[`twitch/beat`,e=>e.twitch.toFixed(2)],[`motion`,e=>e.motion.toFixed(2)],[`swirling`,e=>`${Math.round(e.swirling*100)}%`]].forEach(([i,a],o)=>{let s=t+15+o*15;n.fillStyle=`#aaa`,n.fillText(i,10,s),r.forEach(([,t],r)=>{n.fillStyle=t===`crowd`?this.accent():`#eee`,n.fillText(a(e[t]),130+r*80,s)})});let i=e.yellow.motion>.001?e.crowd.motion/e.yellow.motion:0;n.fillStyle=`#aaa`,n.fillText(`crowd÷yel`,370,t),n.fillStyle=this.accent(),n.fillText(`${Math.round(i*100)}% motion`,370,t+15)}};function B(e,t){let n=Math.abs(2*t-1),r=Math.max(0,1-n**+e.boxy)**(1/e.boxy);return e.width*.385*r*(1+e.pear*(.5-t))}function Be(e,t=56){let n=[];for(let t=0;t<=48;t++){let r=t/48,i=.5-.5*Math.cos(Math.PI*r);n.push(new N(t===0||t===48?0:B(e,i),i*e.height))}let r=new m(n,t,Math.PI,Math.PI*2);return r.computeVertexNormals(),r}var Ve=class{height;v=new _(1,0,0,0);constructor(e){this.height=e}apply(e,t=e){let{x:n,y:r,z:i,w:a}=this.v,o=Math.min(1,Math.max(0,e.y/this.height)),s=1+(1/Math.sqrt(Math.max(n,.2))-1)*He(0,.35,o),c=e.x*s,l=e.z*s,u=a*o,d=Math.cos(u),f=Math.sin(u),p=d*c-f*l,m=f*c+d*l;return c=p+r*o*o*this.height,l=m+i*o*o*this.height,t.set(c,e.y*n,l)}slope(e){let{y:t,z:n,x:r}=this.v;return{az:-Math.atan(2*e*t/r),ax:Math.atan(2*e*n/r)}}};function He(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}var V=function(e){return e[e.None=0]=`None`,e[e.Heart=1]=`Heart`,e[e.Star=2]=`Star`,e[e.Bolt=3]=`Bolt`,e[e.Note=4]=`Note`,e[e.W=5]=`W`,e[e.Skull=6]=`Skull`,e[e.Ring=7]=`Ring`,e}({}),H=function(e){return e[e.Solid=0]=`Solid`,e[e.Stripes=1]=`Stripes`,e[e.Dots=2]=`Dots`,e[e.Checker=3]=`Checker`,e[e.Zigzag=4]=`Zigzag`,e}({}),Ue=class{face=new _(1,1,0,.6);face2=new _(0,0,.6,0);face3=new _(0,0,0,1)},We=`
uniform vec4 uDeform;
uniform float uBodyH;
varying vec3 vObj;
`,Ge=`
vec3 wpDeform(vec3 p) {
  float u = clamp(p.y / uBodyH, 0.0, 1.0);
  float s = uDeform.x;
  float xz = inversesqrt(max(s, 0.2));
  p.xz *= mix(1.0, xz, smoothstep(0.0, 0.35, u));
  float a = uDeform.w * u;
  float c = cos(a), sn = sin(a);
  p.xz = vec2(c * p.x - sn * p.z, sn * p.x + c * p.z);
  p.y *= s;
  p.xz += uDeform.yz * u * u * uBodyH;
  return p;
}
vec3 wpDeformNormal(vec3 n, vec3 p) {
  float u = clamp(p.y / uBodyH, 0.0, 1.0);
  float s = uDeform.x;
  float xz = mix(1.0, inversesqrt(max(s, 0.2)), smoothstep(0.0, 0.35, u));
  n = vec3(n.x / xz, n.y / s, n.z / xz);
  float a = uDeform.w * u;
  float c = cos(a), sn = sin(a);
  n.xz = vec2(c * n.x - sn * n.z, sn * n.x + c * n.z);
  n.y -= dot(n.xz, uDeform.yz) * 2.0 * u / s;
  return normalize(n);
}
`,Ke=`
uniform vec3 uBase;
uniform vec3 uOutA;
uniform vec3 uOutB;
uniform vec3 uGlowCol;
uniform vec4 uStyle;   // kind, pattern, emblem, beltY
uniform vec4 uFace;    // eyeL, eyeR, mouthOpen, smile
uniform vec4 uFace2;   // happy, star, blush, lookX
uniform vec4 uFace3;   // lookY, beltGlow, emblemGlow, shine
uniform float uFaceY;  // eye height (normalised)
uniform float uFaceR;  // body radius at the eyes

float sdEllipse(vec2 p, vec2 r) {
  // Cheap ellipse distance (good near the boundary).
  float k = length(p / r);
  return (k - 1.0) * min(r.x, r.y);
}
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
float sdStar5(vec2 p, float r, float rf) {
  const vec2 k1 = vec2(0.809016994375, -0.587785252292);
  const vec2 k2 = vec2(-k1.x, k1.y);
  p.x = abs(p.x);
  p -= 2.0 * max(dot(k1, p), 0.0) * k1;
  p -= 2.0 * max(dot(k2, p), 0.0) * k2;
  p.x = abs(p.x);
  p.y -= r;
  vec2 ba = rf * vec2(-k1.y, k1.x) - vec2(0, 1);
  float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, r);
  return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}
float sdHeart(vec2 p, float s) {
  p /= s;
  p.x = abs(p.x);
  p.y += 0.6;
  float d;
  if (p.y + p.x > 1.0) d = sqrt(dot(p - vec2(0.25, 0.75), p - vec2(0.25, 0.75))) - sqrt(2.0) / 4.0;
  else d = sqrt(min(dot(p - vec2(0.0, 1.0), p - vec2(0.0, 1.0)), dot(p - 0.5 * max(p.x + p.y, 0.0), p - 0.5 * max(p.x + p.y, 0.0)))) * sign(p.x - p.y);
  return d * s;
}
float sdSeg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}
float sdBolt(vec2 p, float s) {
  p /= s;
  float d = sdSeg(p, vec2(0.25, 0.9), vec2(-0.2, 0.05));
  d = min(d, sdSeg(p, vec2(-0.2, 0.05), vec2(0.2, 0.05)));
  d = min(d, sdSeg(p, vec2(0.2, 0.05), vec2(-0.25, -0.9)));
  return (d - 0.14) * s;
}
float sdNote(vec2 p, float s) {
  p /= s;
  float d = sdEllipse(p - vec2(-0.25, -0.55), vec2(0.32, 0.24));
  d = min(d, sdBox(p - vec2(0.02, 0.1), vec2(0.07, 0.65)));
  d = min(d, sdSeg(p, vec2(0.02, 0.72), vec2(0.45, 0.35)) - 0.09);
  return d * s;
}
float sdW(vec2 p, float s) {
  p /= s;
  p.x = abs(p.x);
  float d = sdSeg(p, vec2(0.7, 0.6), vec2(0.42, -0.6));
  d = min(d, sdSeg(p, vec2(0.42, -0.6), vec2(0.0, 0.25)));
  return (d - 0.14) * s;
}
float sdSkull(vec2 p, float s) {
  p /= s;
  float d = sdCircle(p - vec2(0.0, 0.12), 0.62);
  d = min(d, sdBox(p - vec2(0.0, -0.45), vec2(0.34, 0.2)));
  float holes = min(sdCircle(vec2(abs(p.x), p.y) - vec2(0.25, 0.1), 0.17), sdBox(p - vec2(0.0, -0.18), vec2(0.06, 0.08)));
  return max(d, -holes) * s;
}
float fill(float d, float aa) { return 1.0 - smoothstep(-aa, aa, d); }

vec3 wobbleSurface(vec3 base, out float rough, out vec3 glow) {
  rough = 0.0;
  glow = vec3(0.0);
  float H = uBodyH;
  float u = vObj.y / H;
  float r = length(vObj.xz);
  float ang = atan(vObj.x, vObj.z);
  vec2 q = vec2(ang * r, vObj.y);           // surface coords, world units
  float aa = max(fwidth(q.x), fwidth(q.y)) * 0.9 + 1e-4;
  vec3 col = base;

  // ---------------- outfit
  float kind = uStyle.x;
  float beltY = uStyle.w * H;
  float belt = 0.035 * H;
  if (kind > 0.5 && kind < 3.5 && kind != 3.0) {
    if (vObj.y < beltY - belt) {
      vec3 pc = uOutA;
      float pat = uStyle.y;
      vec2 pq = q / H;
      if (pat > 0.5 && pat < 1.5) pc = mix(pc, uOutB, step(0.5, fract(pq.y * 9.0)));
      else if (pat > 1.5 && pat < 2.5) pc = mix(pc, uOutB, fill(length(fract(pq * 9.0) - 0.5) - 0.22, 0.06));
      else if (pat > 2.5 && pat < 3.5) pc = mix(pc, uOutB, step(0.5, fract(floor(pq.x * 8.0) * 0.5 + floor(pq.y * 8.0) * 0.5)));
      else if (pat > 3.5) pc = mix(pc, uOutB, step(abs(fract(pq.y * 7.0 + abs(fract(pq.x * 6.0) - 0.5)) - 0.5), 0.16));
      col = pc;
    }
  }
  if (kind > 1.5 && kind < 2.5) {
    float topEnd = beltY + 0.16 * H;
    if (vObj.y > beltY && vObj.y < topEnd) col = mix(uOutA, base, 0.25);
    // collar line
    col = mix(col, uOutB, fill(abs(vObj.y - topEnd) - 0.012 * H, aa));
  }
  if (kind > 3.5) {
    // overalls: bib in front, straps
    float bib = sdBox(q - vec2(0.0, beltY + 0.1 * H), vec2(0.13, 0.1) * H);
    if (vObj.y < beltY || bib < 0.0) col = uOutA;
    float strap = min(abs(abs(q.x) - 0.1 * H) - 0.018 * H, 1.0);
    if (vObj.y > beltY && vObj.y < beltY + 0.3 * H && abs(ang) < 1.4) col = mix(col, uOutA, fill(strap, aa));
  }
  if (kind > 0.5) {
    float b = abs(vObj.y - beltY) - belt * 0.5;
    float bm = fill(b, aa);
    col = mix(col, uOutB, bm);
    glow += uGlowCol * bm * uFace3.y;
    // buckle
    float buckle = sdBox(q - vec2(0.0, beltY), vec2(0.045, 0.028) * H);
    float bk = fill(abs(buckle) - 0.006 * H, aa) * step(0.0, cos(ang));
    col = mix(col, vec3(0.95, 0.85, 0.45), bk);
    glow += uGlowCol * bk * uFace3.y * 0.5;
  }

  // ---------------- emblem (chest)
  float em = uStyle.z;
  if (em > 0.5 && cos(ang) > 0.0) {
    // Shirts carry the emblem on the chest; otherwise it sits on the belly.
    bool chest = kind > 1.5 && kind < 2.5;
    vec2 ep = q - vec2(0.0, (chest ? uStyle.w + 0.075 : uStyle.w - 0.12) * H);
    float s = (chest ? 0.058 : 0.07) * H;
    float d = 1e3;
    if (em < 1.5) d = sdHeart(ep, s * 1.2);
    else if (em < 2.5) d = sdStar5(ep, s * 1.1, 0.45);
    else if (em < 3.5) d = sdBolt(ep, s);
    else if (em < 4.5) d = sdNote(ep, s);
    else if (em < 5.5) d = sdW(ep, s);
    else if (em < 6.5) d = sdSkull(ep, s * 0.9);
    else d = abs(sdCircle(ep, s * 0.8)) - s * 0.18;
    float m = fill(d, aa);
    vec3 ec = kind > 0.5 ? uOutB : uOutA;
    float lc = dot(col, vec3(0.3, 0.59, 0.11));
    if (abs(dot(ec, vec3(0.3, 0.59, 0.11)) - lc) < 0.18) ec = lc > 0.35 ? vec3(0.04, 0.03, 0.06) : vec3(1.0, 0.97, 0.9);
    col = mix(col, ec, m);
    glow += ec * m * uFace3.z;
  }

  // ---------------- face
  if (cos(ang) > 0.1) {
    float R = uFaceR;
    vec2 f = (q - vec2(0.0, uFaceY * H)) / R;
    vec2 look = vec2(uFace2.w, uFace3.x) * 0.05;
    // blush
    for (int i = 0; i < 2; i++) {
      float sx = i == 0 ? -1.0 : 1.0;
      float bl = sdEllipse(f - vec2(sx * 0.56, -0.2), vec2(0.16, 0.095));
      float bm = (1.0 - smoothstep(-0.03, 0.05, bl)) * uFace2.z;
      col = mix(col, vec3(1.0, 0.36, 0.48), bm * 0.6);
    }
    // eyes
    for (int i = 0; i < 2; i++) {
      float sx = i == 0 ? -1.0 : 1.0;
      float open = i == 0 ? uFace.x : uFace.y;
      vec2 e = f - vec2(sx * 0.32, 0.0);
      float eyeInk = 0.0;
      float shine = 0.0;
      if (uFace2.y > 0.5) {
        // star eyes
        float st = sdStar5(e * vec2(1.0, -1.0) - look, 0.2, 0.5);
        eyeInk = fill(st, aa / R);
        col = mix(col, vec3(1.0, 0.86, 0.3), eyeInk);
        glow += vec3(1.0, 0.8, 0.3) * eyeInk * 0.6;
        eyeInk = 0.0;
      } else if (uFace2.x > 0.5 || open < 0.2) {
        // happy ^^ (or closed-content arcs when blinking)
        float up = uFace2.x > 0.5 ? 1.0 : -1.0;
        vec2 a = e - vec2(0.0, -0.02 * up);
        float arc = abs(length(a - vec2(0.0, -0.11 * up)) - 0.125) - 0.03;
        arc = max(arc, -a.y * up - 0.0);
        eyeInk = fill(arc, aa / R);
      } else {
        vec2 ep = e - look;
        float d = sdEllipse(ep, vec2(0.145, 0.21 * open));
        eyeInk = fill(d, aa / R);
        shine = fill(sdCircle(ep - vec2(0.05, 0.085 * open), 0.058), aa / R) + fill(sdCircle(ep - vec2(-0.045, -0.08 * open), 0.026), aa / R);
        shine *= step(0.45, open) * uFace3.w;
      }
      col = mix(col, vec3(0.02, 0.015, 0.03), eyeInk);
      col = mix(col, vec3(1.0), clamp(shine, 0.0, 1.0));
      rough = max(rough, eyeInk);
    }
    // mouth
    vec2 m = f - vec2(0.0, -0.33);
    float open = uFace.z;
    float smile = uFace.w;
    m.y -= smile * 1.6 * m.x * m.x; // corners up = smile
    if (open < 0.06) {
      float w = 0.15;
      float arc = sdSeg(m, vec2(-w, 0.0), vec2(w, 0.0)) - 0.026;
      col = mix(col, vec3(0.08, 0.02, 0.04), fill(arc, aa / R));
    } else {
      vec2 mr = vec2(0.14 + 0.04 * open, 0.025 + 0.2 * open);
      vec2 mc = m + vec2(0.0, mr.y * 0.55);
      float d = sdEllipse(mc, mr);
      d = max(d, m.y - 0.012);                  // flat-ish top lip
      float mm = fill(d, aa / R);
      float tongue = fill(sdCircle(mc - vec2(0.0, -mr.y * 0.95), mr.x * 0.75), aa / R) * mm;
      col = mix(col, vec3(0.28, 0.03, 0.07), mm);
      col = mix(col, vec3(0.95, 0.38, 0.45), tongue);
      rough = max(rough, mm * 0.5);
    }
  }
  return col;
}
`;function qe(e){let t=new b({color:16777215,roughness:.34,metalness:0,clearcoat:+(e.quality===`high`),clearcoatRoughness:.14,sheen:0}),n={uDeform:{value:e.deform.v},uBodyH:{value:e.deform.height},uBase:{value:e.base},uOutA:{value:e.outA},uOutB:{value:e.outB},uGlowCol:{value:e.glow},uStyle:{value:new _(e.style.kind,e.style.pattern,e.style.emblem,e.style.beltY)},uFace:{value:e.face.face},uFace2:{value:e.face.face2},uFace3:{value:e.face.face3},uFaceY:{value:e.faceY},uFaceR:{value:e.faceR}};return t.onBeforeCompile=e=>{Object.assign(e.uniforms,n),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>\n${We}\n${Ge}`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
objectNormal = wpDeformNormal(objectNormal, position);`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vObj = position;
transformed = wpDeform(position);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>\n${We}\n${Ke}\nfloat wpRough; vec3 wpGlow;`).replace(`#include <color_fragment>`,`#include <color_fragment>
diffuseColor.rgb = wobbleSurface(uBase, wpRough, wpGlow);`).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.08, wpRough);`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += wpGlow;`)},t.customProgramCacheKey=()=>`wobbler-body-`+e.quality,t}function Je(e,t,n){let r=e.clone();r.color=e.color;let i={uDeform:{value:t.v},uBodyH:{value:t.height}};return r.onBeforeCompile=e=>{Object.assign(e.uniforms,i),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>\n${We}\n${Ge}`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
objectNormal = wpDeformNormal(objectNormal, position);`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vObj = position;
transformed = wpDeform(position);`)},r.customProgramCacheKey=()=>`wobbler-conform-`+n,r}function Ye(e,t,n=.32){return new b({color:e,roughness:n,clearcoat:+(t===`high`),clearcoatRoughness:.15})}var Xe=[[`cap`],[`capBack`],[`bow`],[`tuft`],[`mohawk`],[`beanie`],[`headband`],[`antenna`],[`pompadour`],[`bun`],[`crown`],[],[],[`tuft`,`roundGlasses`],[`headband`,`starGlasses`],[`cap`,`roundGlasses`],[`bow`],[`tuft`]];function Ze(e){let t=new I(e*9973+17),n=t.int(10),r=t.weighted([[1,3],[2,2],[3,2],[4,1],[0,1]]);return{shape:{height:t.range(.88,1.12),width:t.range(.92,1.12),pear:t.range(.18,.42),boxy:t.range(2,2.5)},body:n,outA:(n+1+t.int(9))%10,outB:10+t.int(10),jitter:t.range(-1,1),outfit:{kind:r,pattern:t.weighted([[H.Solid,4],[H.Stripes,2],[H.Dots,1.5],[H.Checker,1],[H.Zigzag,1]]),emblem:t.weighted([[V.None,3],[V.Heart,1.2],[V.Star,1.2],[V.Bolt,1.2],[V.Note,1.2],[V.W,.8],[V.Skull,.8],[V.Ring,.6]]),beltY:t.range(.28,.34)},accessories:t.pick(Xe),accColor:t.chance(.5)?(n+3)%10:10+t.int(10),trim:10+t.int(10),personality:Qe(t),scale:t.range(.9,1.08)}}function Qe(e){return{energy:e.range(.65,1.3),lag:e.range(-.04,.06),bounce:e.range(.3,1),sway:e.range(.2,1),arms:e.range(.2,1),jumpy:e.range(.1,1),shimmy:e.range(0,1),singer:e.range(.3,1),showoff:e.range(.05,.4)}}var U=e=>new T(e);function $e(){return{shape:{height:1.05,width:1.08,pear:.28,boxy:2.3},body:U(`#f3cf8e`),outA:U(`#4b2a8c`),outB:U(`#18152a`),jitter:0,outfit:{kind:2,pattern:H.Solid,emblem:V.W,beltY:.3},accessories:[`cap`,`headphones`],accColor:U(`#1b1830`),trim:U(`#2ec4c6`),personality:{energy:1.1,lag:0,bounce:.9,sway:.5,arms:1,jumpy:.4,shimmy:.5,singer:.8,showoff:.3},scale:1.55}}function et(){return[{shape:{height:1,width:1.05,pear:.34,boxy:2.2},body:U(`#ff4f86`),outA:U(`#e0336b`),outB:U(`#ffd166`),jitter:0,outfit:{kind:3,pattern:H.Solid,emblem:V.Heart,beltY:.36},accessories:[`bow`],accColor:U(`#ff2d6f`),trim:U(`#ffffff`),personality:{energy:1.15,lag:.02,bounce:1,sway:.8,arms:.9,jumpy:.6,shimmy:.8,singer:1,showoff:.35},scale:1.12},{shape:{height:1.08,width:1,pear:.26,boxy:2.4},body:U(`#2ec4c6`),outA:U(`#1f6f8b`),outB:U(`#ffcf3f`),jitter:0,outfit:{kind:2,pattern:H.Solid,emblem:V.Bolt,beltY:.3},accessories:[`pompadour`],accColor:U(`#7b4dff`),trim:U(`#ffffff`),personality:{energy:1.3,lag:-.01,bounce:.9,sway:.5,arms:1,jumpy:1,shimmy:.6,singer:.9,showoff:.45},scale:1.15},{shape:{height:.98,width:1.1,pear:.3,boxy:2.2},body:U(`#ffc93c`),outA:U(`#ff8a3d`),outB:U(`#ffe8a3`),jitter:0,outfit:{kind:3,pattern:H.Solid,emblem:V.Star,beltY:.38},accessories:[`starGlasses`],accColor:U(`#1b2d8f`),trim:U(`#ffffff`),personality:{energy:1.25,lag:.03,bounce:1,sway:.7,arms:1,jumpy:.8,shimmy:1,singer:.8,showoff:.5},scale:1.1},{shape:{height:1.04,width:1.02,pear:.3,boxy:2.3},body:U(`#9b6bff`),outA:U(`#7a4fe0`),outB:U(`#f2f2f2`),jitter:0,outfit:{kind:2,pattern:H.Solid,emblem:V.Skull,beltY:.3},accessories:[`tuft`],accColor:U(`#5b2fc9`),trim:U(`#ffffff`),personality:{energy:1,lag:0,bounce:.8,sway:.9,arms:.8,jumpy:.5,shimmy:.4,singer:.9,showoff:.3},scale:1.08},{shape:{height:.96,width:1.08,pear:.36,boxy:2.1},body:U(`#b8f2e6`),outA:U(`#3a86ff`),outB:U(`#effff9`),jitter:0,outfit:{kind:1,pattern:H.Stripes,emblem:V.None,beltY:.33},accessories:[`headband`],accColor:U(`#52d273`),trim:U(`#ffffff`),personality:{energy:1,lag:.02,bounce:.9,sway:.8,arms:.7,jumpy:.5,shimmy:.5,singer:.7,showoff:.25},scale:1.05}]}var tt=new Map;function W(e,t){let n=tt.get(e);return n||(n=t(),tt.set(e,n)),n}function nt(e,t,n,r,i=48){let a=[],o=e.height;for(let i=0;i<=24;i++){let s=i/24,c=t+(n-t)*(n>=1?Math.sin(s*Math.PI/2):s),l=c>=.999?0:B(e,c)+r,u=c*o+(c>=.999?r:r*.6*s);a.push(new N(l,u))}if(n<1)for(let r=24;r>=0;r-=24){let i=r/24,s=t+(n-t)*i;a.push(new N(B(e,s)-.004,s*o))}else a.unshift(new N(B(e,t)-.004,t*o));let s=new m(a,i,Math.PI,Math.PI*2);return s.computeVertexNormals(),s}function rt(e,t){let n=new E;for(let r=0;r<10;r++){let i=Math.PI/2+r*Math.PI/5,a=r%2==0?e:e*t,o=Math.cos(i)*a,s=Math.sin(i)*a;r===0?n.moveTo(o,s):n.lineTo(o,s)}return n.closePath(),n}function it(e,r){let i=[],{shape:a,color:o,dark:c,trim:l}=r,u=a.height,d=r.quality===`high`?48:24,f=(e,t)=>new w(e,t),p=(e,t,n,i)=>{let o=f(nt(a,e,t,n,d),r.conform(i));return o.frustumCulled=!1,r.addShell(o),o},m=e=>B(a,e);for(let a of e)switch(a){case`cap`:case`capBack`:{p(.74,1,.022,o);let e=a===`cap`?0:Math.PI,t=r.anchor(.75,e,.01),n=f(W(`capBrim`,()=>new j(1,1,1,40,1,!1,-Math.PI/2,Math.PI)),l);n.scale.set(m(.75)*.95,.024,.2),n.rotation.x=.12,n.position.set(0,0,.02),t.add(n);let i=r.anchor(1,0,.02),s=f(W(`btn`,()=>new M(1,12,8)),c);s.scale.set(.04,.025,.04),i.add(s);break}case`headphones`:{let e=r.anchor(1,0,0),t=.7,n=m(t)+.05,a=.30000000000000004*u,o=f(W(`hpBand`,()=>new s(1,.045,10,48,Math.PI)),c);o.scale.set(n,a+.05,1),o.position.y=-a,e.add(o);for(let e of[-1,1]){let n=r.anchor(t,e*Math.PI/2,.035),a=f(W(`hpCup`,()=>new j(1,1,1,28)),c);a.scale.set(.13,.08,.13),a.rotation.x=Math.PI/2,n.add(a);let o=new O({color:1118481,emissive:16777215,emissiveIntensity:1,roughness:.4});i.push(o);let l=f(W(`hpRing`,()=>new s(1,.16,8,28)),o);l.scale.setScalar(.1),l.position.z=.042,n.add(l)}break}case`bow`:{let e=r.anchor(.9,.55,.02);for(let t of[-1,1]){let n=f(W(`bowLobe`,()=>new M(1,20,14)),o);n.scale.set(.12,.085,.055),n.position.set(t*.1,0,0),n.rotation.z=t*.4,e.add(n)}let t=f(W(`bowKnot`,()=>new M(1,14,10)),o);t.scale.set(.05,.055,.045),e.add(t),e.children.forEach(e=>e.rotation.x-=.3);break}case`tuft`:{let e=r.anchor(1,0,-.01);for(let t=0;t<3;t++){let n=f(W(`tuft`,()=>new ie(1,1,12)),o);n.scale.set(.045,.17,.045),n.position.set((t-1)*.04,.07,0),n.rotation.z=(1-t)*.5,n.rotation.x=-.2,e.add(n)}break}case`mohawk`:for(let e=0;e<5;e++){let t=e/4,n=t<.5?0:Math.PI,i=t<.5?.86+t*.28:1-(t-.5)*.28,a=r.anchor(i,n,-.01),s=f(W(`mohawk`,()=>new ie(1,1,10)),o);s.scale.set(.035,.15-Math.abs(t-.5)*.08,.06),s.position.y=.05,a.add(s)}break;case`beanie`:{p(.7,1,.03,o),p(.68,.76,.045,o);let e=r.anchor(1,0,.03),t=f(W(`pom`,()=>new n(1,2)),c);t.scale.setScalar(.075),t.position.y=.05,e.add(t);break}case`headband`:p(.8,.86,.022,o);break;case`antenna`:{let e=r.anchor(1,0,0),t=f(W(`stalk`,()=>new j(.012,.016,.22,8)),c);t.position.y=.1;let n=f(W(`ball`,()=>new M(1,16,12)),o);n.scale.setScalar(.05),n.position.y=.22,e.add(t,n);break}case`crown`:{let e=r.anchor(1,0,0),t=new b({color:16762941,metalness:1,roughness:.25,emissive:3810304}),n=f(W(`crownRing`,()=>new j(1,1,1,24,1,!0)),t),i=m(.95)*.9;n.scale.set(i,.06,i),n.position.y=-.02,e.add(n);for(let n=0;n<6;n++){let r=n/6*Math.PI*2,a=f(W(`crownSpike`,()=>new ie(1,1,8)),t);a.scale.set(.035,.09,.035),a.position.set(Math.sin(r)*i,.05,Math.cos(r)*i),e.add(a)}e.rotation.z=.12;break}case`pompadour`:{p(.82,1,.025,o);let e=r.anchor(.9,0,0),t=f(W(`quiff`,()=>new M(1,28,18)),o);t.scale.set(m(.88)*.95,.13,.2),t.position.set(0,.1,.04),t.rotation.x=-.75,e.add(t);let n=f(W(`quiff`,()=>new M(1,28,18)),o);n.scale.set(m(.88)*.7,.09,.14),n.position.set(0,.17,-.02),n.rotation.x=-.25,e.add(n);break}case`bun`:{let e=r.anchor(1,0,-.02),t=f(W(`bun`,()=>new M(1,20,14)),o);t.scale.set(.11,.1,.11),t.position.y=.06,e.add(t);break}case`starGlasses`:case`roundGlasses`:{let e=r.anchor(.64,0,.03),n=a===`starGlasses`?o:c,i=new b({color:a===`starGlasses`?2768064:1118498,roughness:.05,clearcoat:1,transparent:!0,opacity:.88}),l=.123;for(let r of[-1,1])if(a===`starGlasses`){let a=f(W(`starFrame`,()=>new t(rt(.13,.5),{depth:.02,bevelEnabled:!0,bevelSize:.012,bevelThickness:.01,bevelSegments:2})),n);a.position.set(r*l,0,-.01),a.rotation.y=r*.28;let o=f(W(`starLens`,()=>new ne(rt(.095,.5))),i);o.position.set(r*l,0,.024),o.rotation.y=r*.28,e.add(a,o)}else{let t=f(W(`rim`,()=>new s(.085,.013,8,28)),n);t.position.set(r*l,0,0),t.rotation.y=r*.28;let a=f(W(`rimLens`,()=>new le(.082,28)),i);a.position.set(r*l,0,.002),a.rotation.y=r*.28,e.add(t,a)}let u=f(W(`bridge`,()=>new j(.01,.01,.07,6)),n);u.rotation.z=Math.PI/2,u.position.set(0,.015,.012),e.add(u);break}}return{glowMats:i}}var G=class{x;spec;v=0;target=0;constructor(e,t){this.x=e,this.spec=t,this.target=e}step(e,t=0){let n=2*Math.PI*this.spec.hz,r=-n*n*(this.x-this.target)-2*this.spec.zeta*n*this.v+t;this.v+=r*e,this.x+=this.v*e}},at=16,ot=class{rollRadius;tiltX;tiltZ;bendX=new G(0,{hz:2.6,zeta:.22});bendZ=new G(0,{hz:2.6,zeta:.22});stretch=new G(1,{hz:3.8,zeta:.28});twist=new G(0,{hz:5,zeta:.35});yaw=new G(0,{hz:1.6,zeta:.75});y=0;vy=0;airborne=!1;sinceLand=10;tqX=0;tqZ=0;stretchF=0;twistF=0;onLand=null;constructor(e,t=1){this.rollRadius=e;let n=1.55/Math.sqrt(e/.4);this.tiltX=new G(0,{hz:n,zeta:.16/t}),this.tiltZ=new G(0,{hz:n,zeta:.16/t})}torque(e,t){this.tqX+=e,this.tqZ+=t}kick(e,t){this.tiltX.v+=e,this.tiltZ.v+=t}squashKick(e){this.stretch.v+=e}stretchForce(e){this.stretchF+=e}twistForce(e){this.twistF+=e}hop(e){if(this.airborne){this.vy=Math.max(this.vy,e*.6);return}this.airborne=!0,this.vy=e,this.stretch.v+=e*1.2}static hopSpeed(e){return at*e/2}step(e){let t=Math.max(1,Math.ceil(e/(1/240))),n=e/t;for(let e=0;e<t;e++)this.substep(n);this.tqX=this.tqZ=this.stretchF=this.twistF=0}substep(e){let t=this.tiltX.v,n=this.tiltZ.v,r=this.airborne?.25:1;this.tiltX.step(e,this.tqX),this.tiltZ.step(e,this.tqZ),r<1&&(this.tiltX.v=t+(this.tiltX.v-t)*r,this.tiltZ.v=n+(this.tiltZ.v-n)*r);let i=.75;Math.abs(this.tiltX.x)>i&&(this.tiltX.x=Math.sign(this.tiltX.x)*i,this.tiltX.v*=-.3),Math.abs(this.tiltZ.x)>i&&(this.tiltZ.x=Math.sign(this.tiltZ.x)*i,this.tiltZ.v*=-.3);let a=(this.tiltX.v-t)/e,o=(this.tiltZ.v-n)/e;if(this.bendX.step(e,o*.022),this.bendZ.step(e,-a*.022),this.stretch.step(e,this.stretchF),this.twist.step(e,this.twistF),this.yaw.step(e),this.stretch.x<.55&&(this.stretch.x=.55,this.stretch.v=Math.max(0,this.stretch.v)),this.airborne&&(this.vy-=at*e,this.y+=this.vy*e,this.y<=0)){let e=-this.vy;this.y=0,this.vy=0,this.airborne=!1,this.sinceLand=0,this.stretch.v-=e*1.6,this.onLand?.(e)}this.sinceLand+=e}},st={hz:3.6,zeta:.42},ct=class{side;shoulder=new C;elbowJ=new C;hand;raise=new G(.5,st);fwd=new G(.1,st);inward=new G(0,st);elbow=new G(.35,{hz:4.5,zeta:.38});add={raise:0,fwd:0,inward:0,elbow:0};constructor(e,t,n,r){this.side=e;let i=r===`high`?12:8,a=new w(ut(`upper`,.058*n,.16,i),t);a.position.y=-.08,this.shoulder.add(a),this.elbowJ.position.y=-.16,this.shoulder.add(this.elbowJ);let o=new w(ut(`fore`,.052*n,.13,i),t);o.position.y=-.065,this.elbowJ.add(o),this.hand=new w(ut(`hand`,.075*n,0,i),t),this.hand.scale.set(1,1.1,.85),this.hand.position.y=-.15,this.elbowJ.add(this.hand)}target(e){e.raise!==void 0&&(this.raise.target=e.raise),e.fwd!==void 0&&(this.fwd.target=e.fwd),e.inward!==void 0&&(this.inward.target=e.inward),e.elbow!==void 0&&(this.elbow.target=e.elbow)}update(e){for(let t of[this.raise,this.fwd,this.inward,this.elbow])t.step(e);let t=this.raise.x+this.add.raise,n=this.fwd.x+this.add.fwd,r=this.inward.x+this.add.inward,i=this.elbow.x+this.add.elbow;this.shoulder.rotation.set(-n,-this.side*r,this.side*t,`YZX`),this.elbowJ.rotation.set(-Math.max(0,i),0,0),this.add.raise=this.add.fwd=this.add.inward=this.add.elbow=0}},lt=new Map;function ut(e,t,n,r){let i=`${e}:${t.toFixed(3)}:${n}:${r}`,a=lt.get(i);return a||(a=n>0?new te(t,n,4,r):new M(t,r+4,r),lt.set(i,a)),a}var dt=null;function ft(){if(dt)return dt;let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(64,64,0,64,64,64);return n.addColorStop(0,`rgba(0,0,0,0.85)`),n.addColorStop(.45,`rgba(0,0,0,0.5)`),n.addColorStop(1,`rgba(0,0,0,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),dt=new ce(e),dt}var pt=class{look;root=new l;tilt=new l;lower=new l;spin=new l;anchors=[];shadow;body;rig;deform;faceParams=new Ue;arms;expr={mouth:0,smile:.6,happy:!1,star:!1,blush:.55,lookX:0,lookY:0,closed:!1,wink:0,glowBelt:0,glowEmblem:0};colBody=new T;colOutA=new T;colOutB=new T;colAcc=new T;colTrim=new T;colGlow=new T;glowMats;home=new r;offset=new N;height;rollR;rng;blinkT=0;blinkDur=0;nextBlink;eyeL=1;eyeR=1;mouth=0;shoulderRest;tmp=new r;faceY;faceR;qa=new y;qb=new y;eul=new i;constructor(e,t,n){this.look=e,this.rng=new I(t);let i=e.shape;this.height=i.height*1,this.deform=new Ve(this.height),this.rollR=B(i,.3)*.95,this.rig=new ot(this.rollR*e.scale,.9+.3*e.personality.energy),this.nextBlink=this.rng.range(.5,4),this.faceY=.64,this.faceR=B(i,this.faceY);let a=qe({base:this.colBody,outA:this.colOutA,outB:this.colOutB,glow:this.colGlow,style:e.outfit,deform:this.deform,face:this.faceParams,faceY:this.faceY,faceR:this.faceR,quality:n});this.body=new w(Be(i,n===`high`?56:32),a),this.body.frustumCulled=!1;let o=Ye(this.colBody,n);o.color=this.colBody,this.arms=[new ct(-1,o,i.width,n),new ct(1,o,i.width,n)];let s=.5,c=B(i,s),u=1.32;this.shoulderRest=[-1,1].map(e=>new r(e*c*Math.sin(u)*.96,s*this.height,c*Math.cos(u)));let d=Ye(this.colAcc,n,.3);d.color=this.colAcc;let f=Ye(new T(1512735),n,.35),p=Ye(this.colTrim,n,.3);p.color=this.colTrim,this.spin.add(this.body,...this.arms.map(e=>e.shoulder));let m=it(e.accessories,{shape:{...i,height:this.height},color:d,dark:f,trim:p,quality:n,conform:e=>Je(e,this.deform,n),addShell:e=>this.spin.add(e),anchor:(e,t,n=0)=>{let r=new l;return this.anchors.push({obj:r,u:e,ang:t,out:n}),this.spin.add(r),r}});this.glowMats=m.glowMats,this.lower.add(this.spin),this.tilt.add(this.lower),this.root.add(this.tilt),this.lower.position.y=-this.rollR,this.root.scale.setScalar(e.scale),this.shadow=new w(gt(),new A({map:ft(),transparent:!0,depthWrite:!1,opacity:.8})),this.shadow.rotation.x=-Math.PI/2,this.shadow.renderOrder=1}applyPalette(e){let t=(t,n)=>{if(typeof t!=`number`)return n.copy(t);let r=t<10?e.crowd[t]:e.outfit[t-10];return n.copy(r),this.look.jitter&&n.offsetHSL(this.look.jitter*.02,0,this.look.jitter*.05),n};t(this.look.body,this.colBody),t(this.look.outA,this.colOutA),t(this.look.outB,this.colOutB),t(this.look.accColor,this.colAcc),t(this.look.trim,this.colTrim),this.colGlow.copy(e.lights[Math.abs(Math.floor(this.look.jitter*97))%e.lights.length])}placeAt(e,t,n){this.home.set(e,0,t),this.rig.yaw.x=this.rig.yaw.target=n}update(e){let t=this.rig;t.step(e);let n=this.rollR*this.look.scale,r=-n*t.tiltZ.x,i=n*t.tiltX.x;this.root.position.set(this.home.x+this.offset.x+r,this.home.y+n+t.y,this.home.z+this.offset.y+i),this.tilt.rotation.set(t.tiltX.x,0,t.tiltZ.x),this.spin.rotation.y=t.yaw.x;let a=Math.cos(-t.yaw.x),o=Math.sin(-t.yaw.x),s=t.bendX.x,c=t.bendZ.x;this.deform.v.set(t.stretch.x,a*s-o*c,o*s+a*c,t.twist.x);let l=1/Math.sqrt(Math.max(t.stretch.x,.2));for(let e of this.anchors){let n=e.u>=.995,r=n?0:B(this.look.shape,e.u)+e.out;this.tmp.set(Math.sin(e.ang)*r,e.u*this.height+(n?e.out:0),Math.cos(e.ang)*r),this.deform.apply(this.tmp,e.obj.position);let i=this.deform.slope(Math.min(e.u,1));this.qa.setFromEuler(this.eul.set(i.ax,0,i.az)),this.qb.setFromAxisAngle(mt,e.ang+t.twist.x*e.u),e.obj.quaternion.multiplyQuaternions(this.qa,this.qb),e.obj.scale.set(l,t.stretch.x,l)}this.arms.forEach((t,n)=>{this.deform.apply(this.shoulderRest[n],t.shoulder.position),t.update(e)});let u=t.y,d=.95*this.look.shape.width*this.look.scale/(1+u*1.2);this.shadow.position.set(this.root.position.x,this.home.y+.012,this.root.position.z),this.shadow.scale.set(d,d,1),this.shadow.material.opacity=.75/(1+u*2.5),this.updateFace(e)}updateFace(e){let t=this.expr;this.nextBlink-=e,this.nextBlink<=0&&this.blinkT<=0&&(this.blinkDur=this.rng.range(.1,.16),this.blinkT=this.blinkDur,this.nextBlink=this.rng.range(1.8,5.5));let n=1;if(this.blinkT>0){this.blinkT-=e;let t=1-this.blinkT/this.blinkDur;n=Math.abs(Math.cos(Math.PI*t))}let r=+!t.closed,i=Math.min(n,r,t.wink===-1?0:1),a=Math.min(n,r,t.wink===1?0:1);this.eyeL=R(this.eyeL,i,30,e),this.eyeR=R(this.eyeR,a,30,e),this.mouth=R(this.mouth,t.mouth,t.mouth>this.mouth?40:22,e);let o=this.faceParams;o.face.set(this.eyeL,this.eyeR,L(this.mouth),t.smile),o.face2.set(+!!t.happy,+!!t.star,t.blush,t.lookX),o.face3.set(t.lookY,t.glowBelt,t.glowEmblem,1)}dispose(){this.body.geometry.dispose()}},mt=new r(0,1,0),ht=null;function gt(){return ht??=new D(1,1)}var K={h:0,s:0,l:0};function q(e,t){let n=new T;try{n.setStyle(e&&/^#?[0-9a-f]{6}$/i.test(e.replace(`#`,``))?e.startsWith(`#`)?e:`#`+e:t)}catch{n.setStyle(t)}return n}function _t(e){return e.getHSL(K),K.s*(1-Math.abs(K.l-.5)*1.6)}function J(e,t){e.getHSL(K);let[n,r,i]=t(K.h,K.s,K.l);return new T().setHSL(n,r,i)}var vt={background:`#1a1b26`,foreground:`#a9b1d6`,accent:`#7aa2f7`,red:`#f7768e`,green:`#9ece6a`,yellow:`#e0af68`,blue:`#7aa2f7`,magenta:`#bb9af7`,cyan:`#7dcfff`,orange:`#ff9e64`},yt=[`#ff5c8a`,`#ffc93c`,`#2ec4c6`,`#9b6bff`,`#ff8a3d`,`#52d273`,`#5b8cff`,`#f26bd6`,`#b8f2e6`,`#ff4f5e`];function bt(e){let t={...vt,...e.colors},n=q(t.background,`#101014`),r=q(t.foreground,`#e0e0e0`),i=q(t.accent??t.blue,`#7aa2f7`);n.getHSL(K);let a=(t.mode??``).toLowerCase()===`light`||K.l>.6,o=[`accent`,`magenta`,`blue`,`cyan`,`green`,`yellow`,`orange`,`red`,`bright_magenta`,`bright_blue`,`bright_cyan`,`bright_green`,`bright_yellow`,`bright_red`].filter(e=>t[e]).map(e=>q(t[e],`#888`)),s=o.filter(e=>_t(e)>.12),c=s.length<3,l=[];if(c){let e=[r,i,q(t.bright_foreground??t.foreground,`#fff`),q(t.light_foreground??t.foreground,`#ddd`)];for(let t=0;t<6;t++)l.push(J(e[t%e.length],(e,n)=>[e,n*.3,.42+.26*(t*.37%1)]))}else{let e=[...s].sort((e,t)=>_t(t)-_t(e)),t=[];for(let n of e)if(n.getHSL(K),t.every(e=>Math.min(Math.abs(e-K.h),1-Math.abs(e-K.h))>.07)&&(t.push(K.h),l.push(J(n,(e,t,n)=>[e,Math.min(1,Math.max(t,.75)),Math.min(.68,Math.max(n,.55))]))),l.length>=6)break;let n=J(i,(e,t,n)=>[e,Math.min(1,Math.max(t,.7)),Math.min(.68,Math.max(n,.55))]);for(l.unshift(n),l.length=Math.min(l.length,6);l.length<6;)l.push(l[l.length%Math.max(1,l.length-1)].clone())}let u=[];for(let e=0;e<10;e++)if(c)u.push(new T(yt[e%yt.length]));else{let t=(s.length?s:o)[e%Math.max(1,s.length||o.length)],n=[.55,.62,.48,.66,.52][e%5];u.push(J(t,(t,r)=>[(t+(e>=s.length?.03:0))%1,Math.min(.85,Math.max(.45,r)),n]))}let d=u.map((e,t)=>c?new T().setHSL(0,0,t%2?.08:.95):J(e,(e,t,n)=>[(e+.5)%1,t*.8,n>.5?n-.3:n+.3])),f=J(n,(e,t,n)=>[e,t,a?n*.9:Math.max(.012,n*.45)]),p=J(n,(e,t,n)=>[e,t*.5,a?n*.55:Math.min(.2,n+.1)]),m=J(n,(e,t,n)=>[e,t*.8,a?n*(c?.6:.75):Math.max(.02,n*.7)]),h=J(l[0],(e,t,n)=>[e,t*.6,a?.8:n*.35]),g=l[1%l.length].clone(),_=l[0].clone(),v=a&&c;return{name:e.name,light:a,mono:c,ink:v,bg:n,bgDeep:f,fg:r,accent:i,neon:g,neon2:_,metal:p,floor:m,haze:h,lights:l,crowd:u,outfit:d}}var xt=class{p;target;listeners=[];fade=1;constructor(e){this.p=e,this.target=e}onChange(e){this.listeners.push(e)}set(e,t=!1){this.target=e,this.fade=+!!t,t&&this.update(1e3)}update(e){if(this.fade>=1&&this.target===this.p)return;let t=1-Math.exp(-e*2.2);this.fade=Math.min(1,this.fade+e/1.6);let n=this.p,r=this.target,i=(e,n)=>e.lerp(n,this.fade>=1?1:t);for(let e of[`bg`,`bgDeep`,`fg`,`accent`,`neon`,`neon2`,`metal`,`floor`,`haze`])i(n[e],r[e]);n.lights.forEach((e,t)=>i(e,r.lights[t])),n.crowd.forEach((e,t)=>i(e,r.crowd[t])),n.outfit.forEach((e,t)=>i(e,r.outfit[t])),this.fade>.5&&(n.name=r.name,n.light=r.light,n.mono=r.mono,n.ink=r.ink),this.fade>=1&&(this.target=n);for(let e of this.listeners)e(n)}};function St(e,t){let n=new oe;n.background=new T(2762803),n.environment=new Ce(e).fromScene(new _e,.04).texture,n.environmentIntensity=.8;let r=new p(16777215,2.2);r.position.set(3,6,5),n.add(r,new fe(12571903,3156024,.9));let i=new w(new le(12,64),new O({color:3815492,roughness:.6}));i.rotation.x=-Math.PI/2,n.add(i);let a=bt({name:t.get(`theme`)??`default`,colors:{}}),o=[$e(),...et(),...Array.from({length:6},(e,t)=>Ze(t+1))].map((e,t)=>{let r=new pt(e,t+1,`high`);r.applyPalette(a);let i=(t%6-5/2)*1.25,o=-Math.floor(t/6)*1.5;return r.placeAt(i,o,0),n.add(r.root,r.shadow),r}),s=new se(30,innerWidth/innerHeight,.1,100);s.position.set(0,2.2,9.5),s.lookAt(0,.4,-.8);let c=t.get(`pose`)??`idle`,l=0,u=e=>{l+=e,o.forEach((t,n)=>{let r=t.expr,i=l*2+n*.7;switch(c){case`up`:t.arms[0].target({raise:2.7,elbow:.3}),t.arms[1].target({raise:2.7,elbow:.3}),r.happy=!0,r.mouth=.7;break;case`sing`:r.mouth=.5+.5*Math.sin(i*3),r.closed=n%2==0,t.rig.tiltZ.target=.15*Math.sin(i);break;case`lean`:t.rig.tiltZ.target=.35,t.rig.stretch.target=1.15;break;case`squash`:t.rig.stretch.target=.75;break;default:t.rig.tiltZ.target=.06*Math.sin(i),r.mouth=n%3==0?.4:0,r.star=n===3,r.wink=+(n===1)}t.update(e)})};for(let e=0;e<240;e++)u(1/120);window.__wp={ready:!0,step:(t,r=1/60)=>{for(let e=0;e<t;e++)u(r);e.render(n,s)}},e.setAnimationLoop(()=>{t.has(`frozen`)||(u(1/60),e.render(n,s))}),addEventListener(`resize`,()=>{s.aspect=innerWidth/innerHeight,s.updateProjectionMatrix()})}var Ct=class{w;p;base;crowd=!1;hops=0;twitches=0;rng;routine=`rest`;side=1;swayOffset=0;swayGain=1;pending=[];starUntil=0;happyUntil=0;wooUntil=0;closedSinging=!1;glanceUntil=0;glance=0;armPop=[0,0];lastPhase=0;nextIdle=0;hopEveryBeat=!1;hoppedBeat=-1;swirl=null;swirlEnv=0;get swirling(){return this.swirlEnv>0}lookAtCamera=0;glowScale=1;constructor(e,t){this.w=e,this.base=e.look.personality,this.p={...this.base},this.rng=new I(t*31+7),this.side=this.rng.chance(.5)?1:-1,this.swayOffset=this.rng.range(-.08,.08)}retune(){if(!this.crowd)return;let e=this.base,t=this.p,n=e=>L(e,0,1);t.energy=L(e.energy+F.energy,.3,1.9),t.bounce=n(e.bounce+F.bounce),t.jumpy=n(e.jumpy+F.jumpy),t.shimmy=n(e.shimmy+F.shimmy),t.showoff=n(e.showoff+F.showoff)}jump(e,t,n){this.pending.push({at:e+t,kind:`jump`,v:ot.hopSpeed(n)})}startSwirl(e,t=0,n=2,r=this.rng.chance(.5)?1:-1){if(this.swirl||e.presence<.5)return;let i=Math.ceil(e.danceBeatPos-this.p.lag)+t;this.swirl={start:i,loops:n,dir:r,amp:(.17+.1*this.p.showoff)*(.8+.4*this.p.sway)}}onEvent(e,t){let{music:n,time:r}=t,i=this.w.rig,a=n.hype*this.p.energy;switch(e.type){case`danceBeat`:e.beat%8==0&&(this.chooseRoutine(n),(n.section===z.Peak||n.section===z.Groove)&&this.rng.chance((.03+.1*this.p.showoff*L(a))*F.swirl)&&this.startSwirl(n,0,this.rng.chance(.5)?1:2)),i.kick(-(.5+.9*a)*(.5+this.p.bounce)*this.w.look.scale,0),this.hopEveryBeat=a*this.p.jumpy>F.hop||n.section===z.Build&&n.build>.75;break;case`beat`:e.barBeat%2==1&&i.kick(0,(e.barBeat===1?1:-1)*.5*a*this.p.sway);break;case`kick`:i.squashKick(-.9*e.strength*(.4+this.p.bounce)*(.3+a));break;case`snare`:this.armPop[this.rng.int(2)]=Math.max(.35,e.strength)*this.p.arms*(.4+a);break;case`hat`:this.p.shimmy>F.twitchGate&&n.hype>F.twitchHype&&(i.kick(this.rng.range(-.3,.3),this.rng.range(-.3,.3)),this.twitches++);break;case`drop`:{let e=this.rng.range(0,.18);this.jump(r,e,.42+.25*this.p.jumpy),this.rng.chance(.25+.5*this.p.jumpy)&&this.pending.push({at:r+e+.05,kind:`spin`,v:this.rng.chance(.5)?1:-1}),this.routine=this.rng.chance(.6)?`handsUp`:`wave`,this.rng.chance(.35+.4*this.p.showoff)&&(this.starUntil=r+240/n.danceBpm),this.wooUntil=r+.7,this.rng.chance((.2+.4*this.p.showoff)*F.swirl)&&this.startSwirl(n,3);break}case`phraseStart`:i.kick(-.9*this.p.singer,0),this.swayOffset=n.danceBeatPos/8%1,this.swayGain=1.4,this.closedSinging=n.calm>.3&&this.rng.chance(this.p.singer*.6),n.vocal>.5&&this.rng.chance(this.p.singer*.5)&&(this.routine=`sing`);break;case`phraseEnd`:i.squashKick(1.2*this.p.singer),i.kick(.5,this.rng.range(-.4,.4)),this.swayGain=.8,this.closedSinging=!1,this.rng.chance(.3)&&(this.happyUntil=r+.9);break;case`section`:this.chooseRoutine(n)}}chooseRoutine(e){let t=this.p,n=e.vocal,r=e.presence<.3?[[`rest`,1]]:e.section===z.Calm?[[`rest`,2],[`swing`,3],[`sing`,3*t.singer*n],[`wave`,.6]]:e.section===z.Build?[[`raise`,5],[`clap`,2*t.arms],[`shake`,1.5*t.shimmy]]:e.section===z.Peak?[[`handsUp`,3],[`wave`,3],[`pump`,3*t.arms],[`roof`,2],[`disco`,1.2*t.showoff*3]]:[[`swing`,2],[`pump`,2*t.arms],[`clap`,1.4],[`point`,1],[`disco`,t.showoff*3],[`rest`,1.2],[`sing`,2*t.singer*n],[`shake`,t.shimmy]];this.routine=this.rng.weighted(r),this.side=this.rng.chance(.5)?1:-1}update(e,t){let{music:n,time:r}=t,i=this.w.rig,a=this.p,o=n.presence,s=L(n.hype*a.energy,0,1.3),c=60/Math.max(40,n.danceBpm),l=n.danceBeatPos-a.lag,u=(l%1+1)%1;for(let e=this.pending.length-1;e>=0;e--){let t=this.pending[e];t.at<=r&&(t.kind===`jump`||t.kind===`hop`?i.hop(t.v):t.kind===`spin`&&(i.yaw.target+=Math.PI*2*t.v,i.yaw.v+=9*t.v,i.stretchForce(40)),this.pending.splice(e,1))}let d=(u+.06)%1,f=Math.exp(-d*7)+.5*Math.exp(-(1-d)*16),p=(.03+.09*s*a.bounce)*o*F.bob,m=n.section===z.Build?n.build:n.build*.5,h=.018*Math.sin(r*1.7+a.lag*40)*(1-o);i.stretch.target=1-p*f+p*.4+.12*m*o+.1*n.pitch*n.vocal*a.singer+h-.04*n.calm;let g=1-Math.min(.3,.42*c)*(.6+.4*L(s))/c,_=Math.floor(l);if(o>.5&&this.swirlEnv<.3&&this.lastPhase<g&&u>=g&&!i.airborne&&this.hoppedBeat!==_){let e=this.hopEveryBeat||s*a.bounce>.75&&n.section===z.Peak,t=(_+1)%2==0&&s*a.jumpy>F.hopDown;(e||t)&&(i.hop(ot.hopSpeed((1-u)*c)),this.hoppedBeat=_,this.hops++)}this.lastPhase=u,this.swayGain+=(1-this.swayGain)*(1-Math.exp(-e*.8));let v=n.section===z.Calm?8:4,y=Math.sin(2*Math.PI*(l/v-this.swayOffset)),ee=(.035+.08*a.sway)*(.5+.8*n.calm+.5*n.vocal*a.singer)*this.swayGain*o;i.tiltZ.target=y*ee,i.tiltX.target=-.07*n.vocal*a.singer*o+.08*n.pitch*n.vocal*a.singer,this.swirlEnv=0;let b=this.swirl;if(b){let e=(l+.08-b.start)/4;if(e>=b.loops||o<.3)this.swirl=null;else if(e>0){this.swirlEnv=Fe(0,.3,e)*Fe(b.loops,b.loops-.3,e)*o;let t=2*Math.PI*e*b.dir,n=b.amp*this.swirlEnv;i.tiltX.target+=n*Math.cos(t),i.tiltZ.target=i.tiltZ.target*(1-this.swirlEnv)+n*Math.sin(t)}}let x=a.shimmy*L(n.high*1.2+n.density-.6)*s;if(i.twist.target=.3*x*Math.sin(2*Math.PI*l*2),m>.2&&o>.5){let e=m*m*26*(.5+a.energy*.5);i.torque(this.rng.range(-e,e),this.rng.range(-e,e))}this.glanceUntil-=e,this.glanceUntil<0&&this.rng.chance(e*.08)&&(this.glance=this.rng.range(-.6,.6),this.glanceUntil=this.rng.range(.6,1.6));let te=this.glanceUntil>0?this.glance:0;this.lookAtCamera-=e;let S=this.lookAtCamera>0&&t.cameraYaw!==null?t.cameraYaw:t.stageYaw+te*.6,C=S+Math.round((i.yaw.target-S)/(Math.PI*2))*Math.PI*2;if(Math.abs(i.yaw.target-C)>.02&&Math.abs(i.yaw.x-i.yaw.target)<.5&&(i.yaw.target=C),o<.3&&(this.nextIdle-=e,this.nextIdle<=0)){this.nextIdle=this.rng.range(2,7);let e=this.rng.next();e<.3?i.kick(this.rng.range(-.6,.6),this.rng.range(-.6,.6)):e<.4?i.hop(1.2):(this.glance=this.rng.range(-1,1),this.glanceUntil=this.rng.range(1,2.5))}this.arms(e,t,l,u),this.face(t,s)}arms(e,t,n,r){let{music:i}=t,[a,o]=this.w.arms,s=this.side,c=s>0?o:a,l=s>0?a:o,u=Math.exp(-r*8),d=(e,t=1)=>e.target({raise:.5+.06*t,fwd:.08,inward:0,elbow:.45});switch(i.presence<.3?`rest`:this.routine){case`rest`:d(a),d(o);break;case`swing`:{let e=Math.sin(Math.PI*n);a.target({raise:.55,fwd:.55*e,inward:0,elbow:.7}),o.target({raise:.55,fwd:-.55*e,inward:0,elbow:.7});break}case`pump`:c.target({raise:2.25+.3*u,fwd:.35,inward:.1,elbow:1.35-1.15*u}),d(l);break;case`clap`:{let e=Math.exp(-((r+.9)%1)*9);for(let t of[a,o])t.target({raise:.7,fwd:1.15,inward:.35+.75*e,elbow:.55});break}case`wave`:{let e=Math.sin(Math.PI*n/2);a.target({raise:2.55-.35*e,fwd:.25,inward:0,elbow:.25}),o.target({raise:2.55+.35*e,fwd:.25,inward:0,elbow:.25});break}case`roof`:for(let e of[a,o])e.target({raise:2.2,fwd:.2,inward:.1,elbow:1.45-1.2*u});break;case`point`:c.target({raise:1.75+.25*u,fwd:1,inward:.25,elbow:.05}),d(l,1);break;case`disco`:{let e=Math.floor(n)%2==0;c.target(e?{raise:2.6,fwd:.35,inward:0,elbow:.05}:{raise:.35,fwd:.7,inward:.9,elbow:.15}),d(l);break}case`handsUp`:{let e=.1*Math.sin(t.time*11);a.target({raise:2.75+e,fwd:.15,inward:0,elbow:.15}),o.target({raise:2.75-e,fwd:.15,inward:0,elbow:.15});break}case`sing`:c.target({raise:.3,fwd:1.45,inward:1.05,elbow:1.95}),l.target({raise:.8+1.2*L(i.pitch+.3)*i.vocal,fwd:.6,inward:0,elbow:.25});break;case`raise`:{let e=Fe(0,1,i.build),n=.15*e*Math.sin(t.time*20);a.target({raise:.5+2.2*e+n,fwd:.3,inward:0,elbow:.3}),o.target({raise:.5+2.2*e-n,fwd:.3,inward:0,elbow:.3});break}case`shake`:{let e=Math.sin(2*Math.PI*n*2);a.target({raise:1,fwd:.45*e,inward:.2,elbow:.6}),o.target({raise:1,fwd:-.45*e,inward:.2,elbow:.6});break}}for(let t=0;t<2;t++){let n=this.w.arms[t];n.add.raise+=this.armPop[t]*.5,n.add.elbow-=this.armPop[t]*.3,this.armPop[t]*=Math.exp(-e*12)}}face(e,t){let{music:n,time:r}=e,i=this.w.expr,a=this.p,o=n.vocal*(.25+.75*a.singer),s=r<this.wooUntil?.85:0;i.mouth=Math.max(s,L(n.mouth*o*1.1)),i.smile=.5+.35*L(t),i.star=r<this.starUntil,i.happy=!i.star&&(r<this.happyUntil||this.swirlEnv>.5||n.section===z.Peak&&t>.9&&Math.sin(r*.7+a.lag*50)>.6),i.closed=this.closedSinging&&n.vocal>.4,i.blush=.45+.4*L(t),i.lookX=this.glanceUntil>0?this.glance:0,i.lookY=.3*n.pitch*n.vocal,i.glowBelt=(.25*n.hype+1.1*n.kickPulse*n.presence)*this.glowScale,i.glowEmblem=(.2*n.hype+.7*n.snarePulse*n.presence)*this.glowScale}};function wt(e){return{uTime:{value:0},uBands:{value:[0,0,0,0,0,0]},uBeat:{value:0},uBeatPos:{value:0},uKick:{value:0},uSnare:{value:0},uHat:{value:0},uHype:{value:0},uBuild:{value:0},uDrop:{value:0},uVocal:{value:0},uPresence:{value:0},uKicks:{value:new _(99,99,99,99)},uLights:{value:e.lights},uBg:{value:e.bgDeep},uLightMode:{value:0},uInk:{value:0},uMode:{value:0},uModePrev:{value:0},uModeMix:{value:1},uMarquee:{value:null},uMarqueeMix:{value:0},uMarqueeAspect:{value:8},uMarqueeScroll:{value:0},uArt:{value:null},uArtMix:{value:0},uLogo:{value:null},uLogoMix:{value:0},uLogoAspect:{value:4}}}function Tt(e,t,n,r,i){e.uTime.value=r;let a=e.uBands.value;a[0]=t.sub,a[1]=t.bass,a[2]=t.lowMid,a[3]=t.mid,a[4]=t.highMid,a[5]=t.high,e.uBeat.value=t.beatPhase,e.uBeatPos.value=t.beatPos,e.uKick.value=t.kickPulse*t.presence,e.uSnare.value=t.snarePulse*t.presence,e.uHat.value=t.hatPulse*t.presence,e.uHype.value=t.hype,e.uBuild.value=t.build,e.uDrop.value=t.dropPulse,e.uVocal.value=t.vocal,e.uPresence.value=t.presence;let o=e.uKicks.value;o.set(o.x+i,o.y+i,o.z+i,o.w+i),e.uLightMode.value=+!!n.light,e.uInk.value+=(+!!n.ink-e.uInk.value)*Math.min(1,i*3),e.uModeMix.value=Math.min(1,e.uModeMix.value+i/.8)}function Et(e){let t=e.uKicks.value;t.set(0,t.x,t.y,t.z)}function Y(e,t){t!==e.uMode.value&&(e.uModePrev.value=e.uMode.value,e.uMode.value=t,e.uModeMix.value=0)}var Dt=`
uniform float uTime;
uniform float uBands[6];
uniform float uBeat;
uniform float uBeatPos;
uniform float uKick;
uniform float uSnare;
uniform float uHat;
uniform float uHype;
uniform float uBuild;
uniform float uDrop;
uniform float uVocal;
uniform float uPresence;
uniform vec4 uKicks;
uniform vec3 uLights[6];
uniform vec3 uBg;
uniform float uLightMode;
uniform float uInk;
uniform float uMode;
uniform float uModePrev;
uniform float uModeMix;
uniform sampler2D uMarquee;
uniform float uMarqueeMix;
uniform float uMarqueeAspect;
uniform float uMarqueeScroll;
uniform sampler2D uArt;
uniform float uArtMix;
uniform sampler2D uLogo;
uniform float uLogoMix;
uniform float uLogoAspect;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), u.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), u.x), u.y);
}
vec3 lightAt(float t) {
  // Smoothly cycle through the 6 theme light colours.
  float x = fract(t) * 6.0;
  int i = int(floor(x));
  float f = smoothstep(0.0, 1.0, fract(x));
  vec3 a = uLights[0], b = uLights[1];
  for (int k = 0; k < 6; k++) {
    if (k == i) { a = uLights[k]; b = uLights[(k + 1) - 6 * ((k + 1) / 6)]; }
  }
  return mix(a, b, f);
}
float band(float x) {
  // Interpolate the 6 bands across 0..1.
  float p = clamp(x, 0.0, 1.0) * 5.0;
  int i = int(floor(p));
  float f = fract(p);
  float a = uBands[0], b = uBands[1];
  for (int k = 0; k < 6; k++) {
    if (k == i) { a = uBands[k]; b = uBands[min(k + 1, 5)]; }
  }
  return mix(a, b, f);
}
`,X={eq:0,tunnel:1,wave:2,plasma:3,checker:4},Ot=`
${Dt}
uniform vec2 uRes;       // LED pixel grid
uniform float uGain;
uniform float uSeed;
uniform float uLogoHost; // 1 on the surface that shows logos
varying vec2 vUv;

vec3 programme(float mode, vec2 uv) {
  vec2 c = uv - 0.5;
  if (mode < 0.5) {
    // Mirrored EQ bars with peak caps.
    float x = abs(c.x) * 2.0;
    float cols = uRes.x * 0.5;
    float col = floor(x * cols) / cols;
    float h = band(1.0 - col) * (0.35 + 0.65 * uPresence);
    h = h * (0.8 + 0.4 * uKick);
    float bar = step(uv.y, h);
    float cap = step(abs(uv.y - h - 0.03), 0.012);
    vec3 colr = mix(uLights[0], uLights[2], uv.y);
    return colr * bar * (0.35 + 0.65 * uv.y) + vec3(1.0) * cap * 0.8;
  } else if (mode < 1.5) {
    // Tunnel: rings flying outward on the beat.
    float r = length(c * vec2(uRes.x / uRes.y, 1.0));
    float a = atan(c.y, c.x);
    float rings = fract(r * 5.0 - uBeatPos * 0.5);
    float ring = smoothstep(0.35, 0.0, abs(rings - 0.5) - 0.12);
    float spokes = 0.5 + 0.5 * cos(a * 8.0 + uTime * 0.6);
    vec3 colr = lightAt(r * 0.8 - uBeatPos * 0.125);
    return colr * ring * (0.4 + 0.6 * spokes) * (0.5 + 0.8 * uKick + 0.3 * uHype);
  } else if (mode < 2.5) {
    // Waveform ribbons, amplitude from the bands.
    vec3 acc = vec3(0.0);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float amp = (0.08 + 0.3 * uBands[i * 2 + 1]) * (0.5 + 0.5 * uPresence);
      float y = 0.5 + amp * sin(uv.x * (6.0 + fi * 5.0) + uTime * (1.5 + fi) + fi * 2.0) * sin(uv.x * 3.14159);
      float d = abs(uv.y - y);
      acc += uLights[i * 2] * smoothstep(0.035, 0.0, d);
    }
    return acc * (0.8 + 0.5 * uSnare);
  } else if (mode < 3.5) {
    // Calm plasma in the palette.
    float n = noise2(uv * vec2(3.0, 2.0) + vec2(uTime * 0.05, -uTime * 0.04));
    float n2 = noise2(uv * vec2(5.0, 3.0) - vec2(uTime * 0.07, uTime * 0.02));
    vec3 colr = lightAt(n * 0.6 + n2 * 0.4 + uTime * 0.01);
    return colr * (0.18 + 0.35 * n2) * (0.6 + 0.6 * uVocal);
  } else {
    // Checker slam on each beat.
    vec2 g = floor(uv * vec2(8.0, 4.0));
    float on = mod(g.x + g.y + floor(uBeatPos), 2.0);
    vec3 colr = uLights[int(mod(g.x + floor(uBeatPos), 6.0))];
    return colr * on * (0.3 + 0.9 * exp(-uBeat * 4.0));
  }
}

void main() {
  vec2 cell = fract(vUv * uRes);
  vec2 uv = (floor(vUv * uRes) + 0.5) / uRes;
  float dotMask = smoothstep(0.5, 0.32, length(cell - 0.5));
  vec3 a = programme(uMode, uv);
  vec3 b = programme(uModePrev, uv);
  vec3 col = mix(b, a, smoothstep(0.0, 1.0, uModeMix));
  // Cover art, square and centred, as LED pixels.
  if (uArtMix > 0.001) {
    float wa = uRes.x / uRes.y;
    vec2 au = vec2((uv.x - 0.5) * wa + 0.5, uv.y);
    float inside = step(0.0, au.x) * step(au.x, 1.0);
    vec3 art = texture2D(uArt, au).rgb;
    col = mix(col, art * (0.9 + 0.3 * uKick), uArtMix * inside);
  }
  // Logo, fitted and sat a little high (clear of the DJ's head), lit in the
  // palette. Four taps per LED so thin strokes don't flicker between pixels.
  if (uLogoMix > 0.001 && uLogoHost > 0.5) {
    float wa = uRes.x / uRes.y;
    float lw = min(0.88, 0.76 * uLogoAspect / wa);
    float lh = lw * wa / uLogoAspect;
    vec2 lu = (uv - vec2(0.5, 0.56)) / vec2(lw, lh) + 0.5;
    vec2 d = 0.25 / (uRes * vec2(lw, lh));
    float a = 0.0;
    for (int i = 0; i < 4; i++) {
      vec2 q = lu + d * vec2(i == 0 || i == 2 ? -1.0 : 1.0, i < 2 ? -1.0 : 1.0);
      float inside = step(0.0, q.x) * step(q.x, 1.0) * step(0.0, q.y) * step(q.y, 1.0);
      a += texture2D(uLogo, q).a * inside * 0.25;
    }
    a = smoothstep(0.2, 0.7, a);
    vec3 lc = (lightAt(uv.x * 0.6 + uv.y * 0.25 - uTime * 0.06) * 1.3 + 0.3) * (0.85 + 0.4 * uKick);
    col = mix(col * (1.0 - 0.8 * uLogoMix), lc, a * uLogoMix);
  }
  // Now-playing marquee across the middle band.
  if (uMarqueeMix > 0.001) {
    float band = 0.42;
    float tv = (uv.y - (0.5 - band / 2.0)) / band;
    if (tv > 0.0 && tv < 1.0) {
      float wa = uRes.x / uRes.y;
      float tu = uv.x * wa / (band * uMarqueeAspect) + uMarqueeScroll;
      float a = texture2D(uMarquee, vec2(fract(tu), tv)).a;
      vec3 tc = lightAt(uv.x * 0.5 + uTime * 0.05) * 1.3 + 0.25;
      col = mix(col * (1.0 - 0.75 * uMarqueeMix), tc, a * uMarqueeMix);
    } else {
      col *= 1.0 - 0.6 * uMarqueeMix;
    }
  }
  col += uLights[1] * 0.05 * uDrop;
  vec3 base = uBg * 0.6 + 0.012;
  vec3 lit = (base + col * uGain) * (0.25 + 0.75 * dotMask);
  // Ink mode: e-paper LEDs — dark dots on a pale panel.
  float lum = smoothstep(0.015, 0.14, dot(col * uGain, vec3(0.3, 0.59, 0.11)));
  vec3 paper = mix(vec3(0.86), vec3(0.04), lum * dotMask);
  gl_FragColor = vec4(mix(lit, paper, uInk), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}
`,kt=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;function At(e,t,n=2.2,r=0,i=!1){return new ae({uniforms:{...e,uRes:{value:new N(...t)},uGain:{value:n},uSeed:{value:r},uLogoHost:{value:+!!i}},vertexShader:kt,fragmentShader:Ot,toneMapped:!0})}function jt(e,t){let n=new O({color:t,roughness:.3,metalness:.2});return n.color=t,n.onBeforeCompile=t=>{Object.assign(t.uniforms,e),t.vertexShader=t.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vWorldP;`).replace(`#include <worldpos_vertex>`,`#include <worldpos_vertex>
vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;`),t.fragmentShader=t.fragmentShader.replace(`#include <common>`,`#include <common>\n${Dt}\nvarying vec3 vWorldP;`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
        {
          vec2 p = vWorldP.xz;
          vec2 id = floor(p / 1.2);
          vec2 f = fract(p / 1.2);
          float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
          float tile = smoothstep(0.02, 0.06, edge);
          float gap = 1.0 - smoothstep(0.0, 0.03, edge);
          float h = hash12(id);
          vec3 tc = uLights[int(mod(h * 6.0 + floor(uBeatPos / 4.0), 6.0))];
          // Kick ripples from the booth.
          float d = length(p - vec2(0.0, -4.0));
          float ripple = 0.0;
          for (int i = 0; i < 4; i++) {
            float t = uKicks[i];
            float r = t * 11.0;
            ripple += smoothstep(1.4, 0.0, abs(d - r)) * exp(-t * 2.2);
          }
          float sparkle = step(0.965, hash12(id + floor(uTime * 7.0))) * uHat;
          float checker = mod(id.x + id.y + floor(uBeatPos), 2.0) * smoothstep(0.75, 1.0, uHype) * (0.2 + 0.8 * exp(-uBeat * 5.0));
          float glow = (ripple * 0.9 + sparkle * 1.0 + checker * 0.35) * uPresence + 0.015;
          glow *= smoothstep(26.0, 6.0, d);
          // Ink mode draws the pattern by darkening tiles instead of lighting them.
          totalEmissiveRadiance += tc * glow * tile * 0.7 * (1.0 - uInk);
          totalEmissiveRadiance += uLights[0] * gap * 0.05 * (0.4 + uHype) * (1.0 - uInk);
          diffuseColor.rgb *= 1.0 - uInk * clamp(glow * 1.6 * tile + gap * 0.5, 0.0, 0.85);
        }`)},n.customProgramCacheKey=()=>`wobble-floor`,n}var Mt=-5.2,Nt=-6.2,Pt=.5,Ft=-9.6,It=class{palette;u;group=new l;djSpot=new r(0,1,Nt);trussY=8.6;fixtures=[];platters=[];cones=[];neonMats=[];faceMats=[];metal;stageMat;faders=[];constructor(e,t,n){this.palette=e,this.u=t;let r=e;this.metal=new O({color:r.metal,roughness:.35,metalness:.85}),this.metal.color=r.metal,this.stageMat=new O({color:r.floor,roughness:.5,metalness:.3}),this.stageMat.color=r.floor,this.buildFloor(),this.buildStage(),this.buildBooth(n),this.buildWall(),this.buildSpeakers(),this.buildTruss(),this.buildHouse(),this.loadSign()}buildFloor(){let e=new w(new D(80,60),jt(this.u,this.palette.floor));e.rotation.x=-Math.PI/2,e.position.z=12,e.receiveShadow=!1,this.group.add(e)}buildStage(){let e=new w(new k(22,1,8),this.stageMat);e.position.set(0,1/2,-7),this.group.add(e);let t=new A({color:this.palette.lights[0]});t.color=this.palette.lights[0];let n=new w(new k(22,.06,.06),t);n.position.set(0,.95,-2.98),this.group.add(n);let r=n.clone();r.position.y=.05,this.group.add(r);for(let e of[-1,1]){let t=new w(new k(2,1/2,1),this.stageMat);t.position.set(e*9.5,1/4,-2.5),this.group.add(t)}}buildBooth(e){let t=new l;t.position.set(0,1,Mt);let n=.95,r=new w(new k(3.6,n,1.1),new O({color:789266,roughness:.4,metalness:.5}));r.position.y=n/2,t.add(r);let i=new w(new D(3.4,.75),At(this.u,[72,18],1.1,1));i.position.set(0,n/2,.555),t.add(i);let a=new w(new k(3.7,.06,1.2000000000000002),this.metal);a.position.y=.98,t.add(a);let o=new O({color:1710626,roughness:.5,metalness:.4}),s=new O({color:328967,roughness:.25,metalness:.1}),c=new O({color:this.palette.lights[1],emissive:this.palette.lights[1],emissiveIntensity:.6});c.color=this.palette.lights[1],c.emissive=this.palette.lights[1];for(let n of[-1,1]){let r=new w(new k(1.2,.1,.95),o);r.position.set(n*1.05,1.06,0),t.add(r);let i=new w(new j(.42,.42,.04,e===`high`?48:24),s);i.position.set(n*1.05,1.13,0);let a=new w(new j(.13,.13,.045,24),c);i.add(a);let l=new w(new k(.3,.046,.025),new A({color:4473941}));l.position.x=.24,i.add(l),t.add(i),this.platters.push(i);let u=new w(new k(.04,.03,.5),this.metal);u.position.set(n*1.05+.45,1.19,-.05),u.rotation.y=.35,t.add(u)}let u=new w(new k(.55,.12,.85),o);u.position.set(0,1.0699999999999998,0),t.add(u);let d=new O({color:14540253,roughness:.3});for(let e=0;e<3;e++){let n=new w(new k(.05,.05,.08),d);n.position.set(-.15+e*.15,1.15,.1),t.add(n),this.faders.push(n)}this.group.add(t);let f=new w(new k(3.2,Pt,1.6),this.stageMat);f.position.set(0,1.25,-6.4),this.group.add(f)}buildWall(){let e=new w(new D(13,5.6),At(this.u,[104,45],.9,2,!0));e.position.set(0,4.2,Ft),this.group.add(e);let t=new w(new k(13.4,6,.3),this.metal);t.position.set(0,4.2,-9.799999999999999),this.group.add(t);for(let e of[-8.2,-7.2,7.2,8.2]){let t=new w(new D(.7,6.4),At(this.u,[5,44],1,e));t.position.set(e,4.3,-9),this.group.add(t)}let n=new w(new D(120,50),new A({color:this.palette.bgDeep}));n.material.color=this.palette.bgDeep,n.position.set(0,15,-22),this.group.add(n)}buildSpeakers(){let e=new O({color:1184280,roughness:.6,metalness:.2}),t=new O({color:2763315,roughness:.8}),n=new O({color:7829384,metalness:.9,roughness:.3});for(let r of[-1,1])for(let i=0;i<3;i++){let a=new w(new k(2,1.6,1.4),e),o=1.8+i*1.62;a.position.set(r*10.2,o,-5.2),a.rotation.y=-r*.25,this.group.add(a);let c=new w(new j(.55,.3,.2,32),t);c.rotation.x=Math.PI/2,c.position.set(0,0,.72);let l=new w(new s(.58,.05,8,32),n);l.position.z=.72,a.add(c,l),this.cones.push(c)}}buildTruss(){let t=t=>{let n=new l,a=.05,o=.45,s=new j(a,a,t,8);for(let[e,t]of[[-.45/2,-.45/2],[o/2,-.45/2],[-.45/2,o/2],[o/2,o/2]]){let r=new w(s,this.metal);r.position.set(e,0,t),n.add(r)}let c=Math.floor(t/.5),u=new j(.02,.02,Math.hypot(.5,o),5),d=new g(u,this.metal,c*4),f=new e,p=new y,m=0;for(let e=0;e<c;e++){let n=-t/2+(e+.5)*.5,a=Math.atan2(o,.5)*(e%2?1:-1);for(let e=0;e<4;e++){let t=e*Math.PI/2;p.setFromEuler(new i(0,t,a,`YXZ`));let s=new r(0,0,o/2).applyAxisAngle(new r(0,1,0),t);f.compose(new r(s.x,n,s.z),p,new r(1,1,1)),d.setMatrixAt(m++,f)}}return n.add(d),n},n=this.trussY;for(let e of[-1,1]){let r=t(n);r.position.set(e*11.8,n/2,-3.6),this.group.add(r);let i=t(n);i.position.set(e*11.8,n/2,-9.4),this.group.add(i);let a=t(5.8);a.rotation.x=Math.PI/2,a.position.set(e*11.8,n,-6.5),this.group.add(a)}for(let e of[-3.6,-9.4]){let r=t(23.6);r.rotation.z=Math.PI/2,r.position.set(0,n,e),this.group.add(r)}for(let e=0;e<8;e++)this.fixtures.push(new r(-9.8+e*2.8,n-.35,-3.6));for(let e=0;e<6;e++)this.fixtures.push(new r(-8.5+e*3.4,n-.35,-9.4))}buildHouse(){let e=new A({color:this.palette.bgDeep,fog:!0});e.color=this.palette.bgDeep;let t=new w(new D(60,16),e);t.position.set(0,8,22),t.rotation.y=Math.PI,this.group.add(t);for(let t of[-1,1]){let n=new w(new D(40,16),e);n.position.set(t*20,8,4),n.rotation.y=-t*Math.PI/2,this.group.add(n)}let n=(e,t,n,i,o)=>{let s=e.getSpacedPoints(120).map(e=>new r(e.x,e.y,0)),c=new a(new re(s,!0),240,.05,8,!0),l=new O({color:1118481,emissive:t,emissiveIntensity:2.2});l.emissive=t,this.neonMats.push(l);let u=new w(c,l);u.position.copy(n),u.rotation.y=i,u.scale.setScalar(o),this.group.add(u)},i=new E;for(let e=0;e<10;e++){let t=Math.PI/2+e*Math.PI/5,n=e%2?.45:1;e===0?i.moveTo(Math.cos(t)*n,Math.sin(t)*n):i.lineTo(Math.cos(t)*n,Math.sin(t)*n)}i.closePath();let o=new E;[[.2,1],[-.45,-.05],[0,-.05],[-.25,-1],[.5,.15],[.05,.15],[.35,1]].forEach(([e,t],n)=>n?o.lineTo(e,t):o.moveTo(e,t)),o.closePath();let s=new E;s.moveTo(0,-.9),s.bezierCurveTo(-1.2,-.1,-.9,.9,0,.45),s.bezierCurveTo(.9,.9,1.2,-.1,0,-.9),n(i,this.palette.lights[2],new r(-13.5,5.2,-8.2),.35,1.2),n(o,this.palette.lights[4],new r(13.5,5.2,-8.2),-.35,1.2),n(s,this.palette.lights[1],new r(-8,6,21.9),Math.PI,1.6),n(i,this.palette.lights[3],new r(8,6,21.9),Math.PI,1.4),n(o,this.palette.lights[0],new r(19.9,6,8),-Math.PI/2,1.5),n(s,this.palette.lights[5],new r(-19.9,6,8),Math.PI/2,1.5);let c=new w(new k(14,1.1,1.2),new O({color:855058,roughness:.4,metalness:.4}));c.position.set(0,.55,20.8),this.group.add(c);let l=new w(new k(14,.05,.05),new A({color:this.palette.lights[0]}));l.material.color=this.palette.lights[0],l.position.set(0,1.12,20.2),this.group.add(l)}async loadSign(){let e=await new me().loadAsync(new URL(`fonts/wobble-sign.typeface.json`,document.baseURI).href),t=(t,n,i,o)=>{let s=new xe(t,{font:e,size:n,depth:.16,curveSegments:10,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:3});s.computeBoundingBox();let c=s.boundingBox,l=-(c.max.x+c.min.x)/2;s.translate(l,0,0);let u=new O({color:1315100,emissive:i,emissiveIntensity:.28,roughness:.35,metalness:.2});u.emissive=i,this.faceMats.push(u);let d=new w(s,u);d.position.set(0,o,-8.7);let f=[];for(let i of e.generateShapes(t,n))for(let e of[i,...i.holes]){let t=e.getSpacedPoints(Math.max(24,Math.round(e.getLength()*40))),n=new re(t.map(e=>new r(e.x+l,e.y,.21000000000000002)),!0);f.push(new a(n,t.length*2,.034,6,!0))}let p=new O({color:1118481,emissive:i,emissiveIntensity:2.4,roughness:.3});p.emissive=i,this.neonMats.push(p);let m=new w(ye(f),p);m.position.copy(d.position),this.group.add(d,m)};t(`WOBBLE`,1.35,this.palette.neon2,7.45),t(`PARTY`,1.35,this.palette.neon,5.95)}update(e,t,n){let r=(.9+.4*t.hype)*t.presence;for(let t of this.platters)t.rotation.y+=r*Math.PI*2*e;let i=1+.25*t.kickPulse+.12*t.bass;for(let e of this.cones)e.scale.set(i,1,i);let a=+!this.palette.ink;for(let[e,n]of this.neonMats.entries())n.emissiveIntensity=a*(2+.6*t.hype+1.2*t.dropPulse+(e%2==0?.6*t.kickPulse:.6*t.snarePulse));for(let e of this.faceMats)e.emissiveIntensity=a*(.22+.25*t.vocal+.3*t.dropPulse);for(let e of this.faders)e.position.z=.1+.12*Math.sin(n*.7+e.position.x*20)}},Lt=new r(0,1+Pt,Nt),Rt=class extends Ct{djRoutine=`decks`;scratch=0;onEvent(e,t){let n=this.w.rig,r=t.music;switch(e.type){case`danceBeat`:n.kick(-(.9+1.3*r.hype),0),e.beat%8==0&&(this.chooseDJ(r),(r.section===z.Peak||r.section===z.Groove)&&this.rng.chance(.12+.2*r.hype)&&this.startSwirl(r,0,2));return;case`hat`:this.scratch=e.strength;return;case`drop`:this.djRoutine=`hype`,this.jump(t.time,0,.3),this.wooUntil=t.time+1,this.rng.chance(.6)&&this.startSwirl(r,3,2);return;case`phraseStart`:this.rng.chance(.5)&&(this.djRoutine=`point`);break;case`section`:this.chooseDJ(r)}super.onEvent(e,t)}chooseDJ(e){let t=e.section===z.Calm?[[`decks`,3],[`headphone`,2]]:e.section===z.Build?[[`headphone`,3],[`point`,1.5],[`decks`,1]]:e.section===z.Peak?[[`fist`,3],[`hype`,2],[`wave`,2],[`decks`,1]]:[[`decks`,4],[`fist`,1.5],[`headphone`,1]];this.djRoutine=this.rng.weighted(t),this.side=this.rng.chance(.5)?1:-1}arms(e,t,n,r){let[i,a]=this.w.arms,o=this.side>0?a:i,s=this.side>0?i:a,c=Math.exp(-r*8),l=(e,n)=>e.target({raise:.3,fwd:1.1+.16*this.scratch*Math.sin(t.time*30+n),inward:.4,elbow:.25});if(this.scratch*=Math.exp(-e*6),t.music.presence<.3){l(i,0),l(a,1);return}switch(this.djRoutine){case`decks`:l(i,0),l(a,1.3);break;case`headphone`:o.target({raise:1.9,fwd:.2,inward:.55,elbow:2.4}),l(s,0);break;case`fist`:o.target({raise:2.3+.3*c,fwd:.3,inward:.1,elbow:1.3-1.1*c}),l(s,0);break;case`hype`:{let e=.12*Math.sin(t.time*10);i.target({raise:2.7+e,fwd:.2,inward:0,elbow:.2}),a.target({raise:2.7-e,fwd:.2,inward:0,elbow:.2});break}case`point`:o.target({raise:1.7+.2*c,fwd:1.1,inward:-.1,elbow:.05}),l(s,0);break;case`wave`:{let e=Math.sin(Math.PI*n/2);i.target({raise:2.5-.35*e,fwd:.3,inward:0,elbow:.25}),a.target({raise:2.5+.35*e,fwd:.3,inward:0,elbow:.25});break}}}},zt=class{group=new l;shadows=new l;all=[];dancers=[];heroes=[];dj;targets=[];yawToStage=new Map;rng=new I(2024);meter=new Vt;constructor(e,t,n){let i=new pt($e(),1,t);i.placeAt(Lt.x,Lt.z,0),i.home.y=Lt.y,this.dj=new Rt(i,1),this.add(this.dj,0);let a=[[-1.3,-1.1],[1.3,-1.1],[-3.8,-.8],[3.8,-.8],[0,-.7]];et().forEach((e,n)=>{let r=new pt(e,100+n,t),[i,o]=a[n],s=new Ct(r,100+n);this.place(s,i,o),this.heroes.push(s)});let o=[];for(let t=0;o.length<e&&t<14;t++){let e=.35+t*1.35,n=5+t*.75,r=Math.round(n*2/1.45);for(let i=0;i<=r;i++){let s=-n+i/r*n*2+this.rng.range(-.3,.3)+t%2*.35,c=e+this.rng.range(-.35,.35);a.some(([e,t])=>Math.hypot(e-s,t-c)<1.3)||o.push([s,c])}}o.sort((e,t)=>Math.hypot(e[0],e[1]+1)-Math.hypot(t[0],t[1]+1));for(let n=0;n<Math.min(e,o.length);n++){let[e,i]=o[n],a=new Ct(new pt(Ze(n+1),500+n,n<30?t:`low`),500+n);a.crowd=!0,a.retune(),this.place(a,e,i),n%3==0&&this.targets.push(new r(e,.8,i))}this.applyPalette(n),Ee(()=>{for(let e of this.dancers)e.retune()})}activity(){return this.meter.value}place(e,t,n){let r=Math.atan2(Lt.x-t,Lt.z-n);e.w.placeAt(t,n,r),this.add(e,r)}add(e,t){this.all.push(e.w),this.dancers.push(e),this.yawToStage.set(e,t),this.group.add(e.w.root),this.shadows.add(e.w.shadow)}applyPalette(e){for(let t of this.all)t.applyPalette(e)}onEvent(e,t){for(let n of this.dancers)n.onEvent(e,{...t,stageYaw:this.yawToStage.get(n)})}wave(e,t,n){for(let r of this.dancers){if(r===this.dj)continue;let i=r.w.home.x,a=L(((t?i:-i)+14)/28)*n*4;r.jump(e,a,.32)}}swirlRipple(e,t){for(let n of this.dancers){if(n===this.dj)continue;let r=Math.hypot(n.w.home.x,n.w.home.z+1);n.startSwirl(e,Math.min(6,Math.round(r/2.5)),2,t)}}update(e,t,n,r){for(let i of this.dancers){let a=i.lookAtCamera>0?Math.atan2(r.position.x-i.w.home.x,r.position.z-i.w.home.z):null;i.update(e,{music:t,time:n,stageYaw:this.yawToStage.get(i),cameraYaw:a}),i.w.update(e)}this.meter.update(e,t,{crowd:this.dancers.filter(e=>e.crowd),heroes:this.heroes,yellow:this.heroes.slice(2,3)})}},Bt=4,Vt=class{value={crowd:Ht(),heroes:Ht(),yellow:Ht()};snaps=[];t=0;sinceSnap=1;update(e,t,n){this.t+=e;let r=Object.keys(n),i=1-Math.exp(-e*1.5);for(let e of r){let t=n[e];if(!t.length)continue;let r=0,a=0,o=0;for(let e of t){let t=e.w.rig;r+=Math.abs(t.tiltX.v)+Math.abs(t.tiltZ.v)+Math.abs(t.stretch.v)+Math.abs(t.twist.v)+.3*Math.abs(t.vy),e.swirling&&a++,t.airborne&&o++}let s=this.value[e];s.motion+=(r/t.length-s.motion)*i,s.swirling=a/t.length,s.airborne=o/t.length}if(this.sinceSnap+=e,this.sinceSnap<.25)return;this.sinceSnap=0;let a={};for(let e of r)a[e]=n[e].reduce((e,t)=>[e[0]+t.hops,e[1]+t.twitches],[0,0]);for(this.snaps.push({t:this.t,beat:t.danceBeatPos,counts:a});this.snaps.length>2&&this.t-this.snaps[1].t>=Bt;)this.snaps.shift();let o=this.snaps[0],s=this.snaps[this.snaps.length-1],c=s.beat-o.beat;for(let e of r){let r=n[e].length;if(!r)continue;let i=c>.5&&t.playing;this.value[e].hops=i?(s.counts[e][0]-o.counts[e][0])/(r*c):0,this.value[e].twitch=i?(s.counts[e][1]-o.counts[e][1])/(r*c):0}}};function Ht(){return{hops:0,twitch:0,motion:0,swirling:0,airborne:0}}var Ut=new r(0,1+Pt+1,Nt);function Wt(e){e.y<1.3&&e.z<-2.75&&(e.z=-2.75)}function Gt(e,t){let n=16/9;if(t>=n)return e;t=Math.max(t,1);let r=Math.tan(v.degToRad(e)/2)*n;return Math.min(100,v.radToDeg(2*Math.atan(r/t)))}var Kt=class{crowd;camera;current;prev=null;blend=1;blendDur=0;rng=new I(77);shake=0;fovPunch=0;barsInShot=0;recent=[];locked=null;tmpE=new r;tmpT=new r;constructor(e,t){this.crowd=t,this.camera=new se(42,e,.1,200),this.current=this.makeShot(`wide`,16),this.evaluate(this.current)}makeShot(e,t){return{kind:e,t:0,dur:t,seed:this.rng.next(),hero:this.rng.int(this.crowd.heroes.length),eye:new r,target:new r,fov:42}}go(e,t,n){this.prev=n>0?{...this.current,eye:this.current.eye.clone(),target:this.current.target.clone()}:null,this.current=this.makeShot(e,t),this.blend=n>0?0:1,this.blendDur=n,this.barsInShot=0,this.recent.push(e),this.recent.length>4&&this.recent.shift(),e===`heroClose`&&(this.crowd.heroes[this.current.hero].lookAtCamera=t)}onBar(e){if(this.locked)return;this.barsInShot++;let t=e.section,n=e.playing?t===z.Calm?8:t===z.Build?4:t===z.Peak?2:4:8;if(this.barsInShot<n)return;let r=60/e.bpm,i=e.playing?t===z.Calm?[[`orbit`,2],[`djClose`,2],[`heroClose`,3*e.vocal],[`wide`,2],[`crowdDolly`,2]]:t===z.Build?[[`djClose`,3],[`stageSide`,2],[`crowdDolly`,2],[`wide`,1]]:t===z.Peak?[[`overhead`,2],[`crowdDolly`,3],[`djReverse`,2],[`wide`,2],[`heroClose`,1.5],[`orbit`,1]]:[[`crowdDolly`,3],[`djClose`,2],[`djReverse`,1.5],[`heroClose`,2*(.3+e.vocal)],[`wide`,2],[`stageSide`,1.5],[`orbit`,1.2]]:[[`orbit`,3],[`wide`,2],[`crowdDolly`,1]],a=i.filter(([e])=>!this.recent.slice(-2).includes(e)),o=this.rng.weighted(a.length?a:i),s=!e.playing||t===z.Calm?2.5:t===z.Build?1.2:0;this.go(o,n*4*r+2,s)}onDrop(){this.locked||(this.go(this.rng.chance(.5)?`crane`:`overhead`,10,0),this.shake=1,this.fovPunch=1)}onPhraseStart(e){!this.locked&&e.playing&&this.barsInShot>=2&&this.rng.chance(.35)&&this.go(this.rng.chance(.6)?`heroClose`:`djClose`,8,e.section===z.Calm?1.5:0)}evaluate(e){let t=e.t,n=L(t/Math.max(1,e.dur)),r=e.seed,i=e.eye,a=e.target;switch(e.fov=42,e.kind){case`wide`:{let t=(r-.5)*8;i.set(t*(1-n*.5),6.2-n*.8,19-n*3),a.set(t*.2,2.4,-3),e.fov=40;break}case`djClose`:{let o=(r-.5)*.9+Math.sin(t*.15)*.25,s=4.4-n*.9;i.set(Math.sin(o)*s,Ut.y+.15+.2*Math.sin(t*.2),Nt+Math.cos(o)*s),a.copy(Ut).add(this.tmpT.set(0,-.15,0)),e.fov=34;break}case`djReverse`:{let t=r>.5?1:-1;i.set(t*(1.3+.3*n),3.4,Nt-2.2),a.set(t*-1.5,.9,5),e.fov=48;break}case`crowdDolly`:{let t=r>.5?1:-1,o=t*(-6+12*n);i.set(o,1.55,-2.75),a.set(o*.7+t*1.5,.7,4),e.fov=46;break}case`heroClose`:{let t=this.crowd.heroes[e.hero].w,o=t.home,s=t.height*t.look.scale*.62,c=Math.atan2(-o.x,Nt-o.z),l=1.75-n*.25,u=(r-.5)*.7,d=t.rig.y*.35;i.set(o.x+Math.sin(c+u)*l,s+.28+d*.5,o.z+Math.cos(c+u)*l),a.set(o.x,s-.05+d,o.z),e.fov=38;break}case`crane`:{let n=Ie(L(t/6));i.set(Math.sin(t*.2)*2,1.2+n*9,-1.5+n*11),a.set(0,.5,2-n*2),e.fov=50;break}case`overhead`:{let n=t*.12+r*6;i.set(Math.sin(n)*3,13.5,6+Math.cos(n)*3),a.set(0,0,4.5),e.fov=52;break}case`orbit`:{let n=(r-.5)*2+t*.07*(r>.5?1:-1);i.set(Math.sin(n)*11,4.2,5+Math.cos(n)*11),a.set(0,1.2,1),e.fov=44;break}case`stageSide`:{let t=r>.5?1:-1;i.set(t*(8.5-n),3.2,-4.8+n*.6),a.set(-t*1,1.6,-1.5),e.fov=44;break}}}update(e,t,n){this.current.t+=e,this.evaluate(this.current),Wt(this.current.eye);let r=this.tmpE.copy(this.current.eye),i=this.tmpT.copy(this.current.target),a=this.current.fov;if(this.prev&&this.blend<1){this.prev.t+=e,this.evaluate(this.prev),this.blend=Math.min(1,this.blend+e/this.blendDur);let t=Ie(this.blend);r.lerpVectors(this.prev.eye,this.current.eye,t),i.lerpVectors(this.prev.target,this.current.target,t),a=this.prev.fov+(this.current.fov-this.prev.fov)*t}let o=.06;r.x+=Math.sin(n*.53)*o+Math.sin(n*1.31)*o*.4,r.y+=Math.sin(n*.71)*o*.6+t.kickPulse*.03*t.hype,this.shake=Math.max(this.shake*Math.exp(-e*2.5),t.section===z.Peak?.12*t.kickPulse:0),this.shake>.001&&(r.x+=(Math.sin(n*37)+Math.sin(n*23))*.06*this.shake,r.y+=(Math.sin(n*41)+Math.sin(n*29))*.05*this.shake),this.fovPunch*=Math.exp(-e*3),this.camera.position.copy(r),this.camera.lookAt(i),this.camera.fov=Gt(a-6*this.fovPunch,this.camera.aspect),this.camera.updateProjectionMatrix()}},qt=class{rig;u;crowd;confetti;cam;rng=new I(314);bar=0;forceSwirl=!1;constructor(e,t,n,r,i){this.rig=e,this.u=t,this.crowd=n,this.confetti=r,this.cam=i}onEvent(e,t,n){switch(e.type){case`kick`:Et(this.u);break;case`beat`:e.barBeat===0&&this.onBar(t,n),t.section===z.Peak&&t.hype>.7&&e.barBeat%2==0&&this.rig.flash(n,.28),t.section===z.Build&&t.build>.85&&this.rig.flash(n,.18);break;case`drop`:this.confetti.burst(420,new r(0,8.2,3),new r(11,.3,5),1),this.rig.flash(n,.45),this.rig.program=`ballyhoo`,this.rig.laserProgram=`fan`,Y(this.u,X.checker),this.cam.onDrop();break;case`section`:this.applySection(t);break;case`phraseStart`:this.cam.onPhraseStart(t),t.section===z.Groove&&this.rng.chance(.4)&&Y(this.u,X.wave);break;case`musicStart`:this.applySection(t)}}onBar(e,t){if(this.bar++,this.rig.onBar(this.bar),this.cam.onBar(e),this.bar%8==0&&this.applySection(e,!0),e.section===z.Peak&&this.bar%16==8&&this.rng.chance(.6)&&this.crowd.wave(t,this.rng.chance(.5),60/e.danceBpm),this.forceSwirl&&this.bar%4==1){let t=this.rng.chance(.5)?1:-1;this.crowd.swirlRipple(e,t),this.crowd.dj.startSwirl(e,0,2,t)}else e.hype>.55&&(e.section===z.Peak&&this.bar%16==0&&this.rng.chance(.5*F.swirl)||e.section===z.Groove&&this.bar%16==12&&this.rng.chance(.25*F.swirl))&&this.crowd.swirlRipple(e,this.rng.chance(.5)?1:-1);e.section===z.Peak&&this.rng.chance(.3)&&this.confetti.burst(60,new r(this.rng.range(-8,8),8.2,2),new r(2,.2,2),.5)}applySection(e,t=!1){let n=e.section,r=e=>this.rng.pick(e),i=e=>this.rng.pick(e);if(!e.playing){this.rig.program=`calm`,this.rig.laserProgram=`off`,Y(this.u,X.plasma);return}switch(n){case z.Calm:this.rig.program=`calm`,this.rig.laserProgram=`off`,Y(this.u,X.plasma);break;case z.Groove:this.rig.program=r([`sweep`,`crowd`,`fan`]),this.rig.laserProgram=e.hype>.65?i([`fan`,`scan`,`off`]):`off`,Y(this.u,this.rng.pick([X.eq,X.wave,X.tunnel]));break;case z.Build:this.rig.program=t?r([`fan`,`center`]):`center`,this.rig.laserProgram=`scan`,Y(this.u,X.tunnel);break;case z.Peak:this.rig.program=r([`ballyhoo`,`sweep`,`fan`]),this.rig.laserProgram=i([`fan`,`tunnel`,`scan`]),Y(this.u,this.rng.pick([X.checker,X.tunnel,X.eq]))}}},Jt=[`logos/omarchy.png`,`logos/ridgetopai.png`],Yt=class{u;logos=Jt.map(()=>null);rng=new I(2718);idx=this.rng.int(Jt.length);wait=this.rng.range(35,60);t=-1;hold=0;lastBar=-1;demo=!1;constructor(e){this.u=e,Jt.forEach((e,t)=>{new ue().load(new URL(e,document.baseURI).href,e=>{e.generateMipmaps=!1,e.minFilter=c;let n=e.image;this.logos[t]={tex:e,aspect:n.width/n.height}})})}update(e,t){let n=this.u,r=Math.floor(t.danceBeatPos/4),i=r!==this.lastBar;this.lastBar=r;let a=n.uMarqueeMix.value>.02||n.uArtMix.value>.05;if(this.t<0){this.demo&&(this.wait=Math.min(this.wait,3)),t.playing&&t.presence>.6&&(this.wait-=e),n.uLogoMix.value*=Math.exp(-e*3);let r=this.logos[this.idx%Jt.length];if(this.wait<=0&&i&&!a&&r&&t.section!==z.Build){this.idx++,n.uLogo.value=r.tex,n.uLogoAspect.value=r.aspect;let e=240/Math.max(60,t.danceBpm);this.hold=Math.min(10,Math.max(5,3*e)),this.t=0}return}this.t+=e;let o=1.2,s=Math.min(1,this.t/.5)*Math.min(1,Math.max(0,(this.hold-this.t)/o));a&&(this.t=Math.max(this.t,this.hold-o*s)),s*=.95,n.uLogoMix.value=s,this.t>=this.hold&&(this.t=-1,n.uLogoMix.value=0,this.wait=this.demo?3:this.rng.range(60,120))}},Xt=14,Zt=class{u;canvas=document.createElement(`canvas`);tex;font;key=``;marqueeT=-1;artUrl=null;artReady=!1;idle=!1;silentT=0;track=null;constructor(e){this.u=e,this.canvas.width=1024,this.canvas.height=128,this.tex=new ce(this.canvas),this.tex.wrapS=ee,this.tex.colorSpace=S,e.uMarquee.value=this.tex;let t=new FontFace(`Titan One`,`url(${new URL(`fonts/TitanOne-Regular.ttf`,document.baseURI).href})`);this.font=t.load().then(e=>void document.fonts.add(e)).catch(()=>void 0)}onTrack(e){this.track=e;let t=`${e.title}\u0000${e.artist}`;e.playing&&e.title&&t!==this.key&&(this.key=t,this.drawText(e)),e.art!==this.artUrl&&(this.artUrl=e.art,this.artReady=!1,e.art&&new ue().load(e.art,e=>{e.colorSpace=S,this.u.uArt.value?.dispose(),this.u.uArt.value=e,this.artReady=!0}))}async drawText(e){await this.font;let t=`${e.title.toUpperCase()}${e.artist?`  ·  `+e.artist.toUpperCase():``}`,n=this.canvas.getContext(`2d`);n.font=`92px "Titan One", sans-serif`;let r=Math.ceil(n.measureText(t).width);this.canvas.width=Math.min(8192,r+115.2+384),this.canvas.height=128,n.font=`92px "Titan One", sans-serif`,n.textBaseline=`middle`,n.fillStyle=`#fff`,n.clearRect(0,0,this.canvas.width,128),Qt(n,192,128),n.fillText(t,307.2,69.12),this.tex.dispose(),this.tex.needsUpdate=!0,this.u.uMarqueeAspect.value=this.canvas.width/128,this.u.uMarqueeScroll.value=-.35,this.marqueeT=0}update(e,t){let n=this.u;if(this.silentT=t.playing?0:this.silentT+e,!this.idle&&this.silentT>4&&this.marqueeT<0&&(this.idle=!0,this.key=``,this.drawText({title:`Play something`,artist:`cliamp · Spotify · anything`})),this.idle&&t.playing&&(this.idle=!1,this.marqueeT>=0&&(this.marqueeT=12.8)),this.idle&&this.marqueeT>=0){this.marqueeT=Math.min(this.marqueeT+e,1),n.uMarqueeMix.value=.75*this.marqueeT,n.uMarqueeScroll.value+=e/6*(8/Math.max(4,n.uMarqueeAspect.value))*1.6,n.uArtMix.value*=Math.exp(-e*1.5);return}if(this.marqueeT>=0){this.marqueeT+=e;let t=this.marqueeT;n.uMarqueeMix.value=Math.min(1,t/.6)*Math.min(1,Math.max(0,(Xt-t)/1.2)),n.uMarqueeScroll.value+=e/6*(8/Math.max(4,n.uMarqueeAspect.value))*2.2,t>Xt&&(this.marqueeT=-1)}else n.uMarqueeMix.value=0;let r=this.track&&!this.track.playing&&!t.playing,i=this.artReady&&(t.section===z.Calm||r)?.85:0;n.uArtMix.value+=(i-n.uArtMix.value)*(1-Math.exp(-e*1.5))}};function Qt(e,t,n){e.save(),e.translate(t,0),e.beginPath(),e.ellipse(n*.24,n*.7,n*.17,n*.13,-.4,0,Math.PI*2),e.fill(),e.fillRect(n*.36,n*.16,n*.07,n*.54),e.beginPath(),e.moveTo(n*.36,n*.14),e.quadraticCurveTo(n*.62,n*.24,n*.6,n*.5),e.quadraticCurveTo(n*.52,n*.34,n*.43,n*.32),e.closePath(),e.fill(),e.restore()}var $t={uniforms:{tDiffuse:{value:null},uTime:{value:0},uFlash:{value:0},uFlashColor:{value:new T(1,1,1)},uCA:{value:0},uVignette:{value:.9},uGrain:{value:.035}},vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,fragmentShader:`
    uniform sampler2D tDiffuse;
    uniform float uTime, uFlash, uCA, uVignette, uGrain;
    uniform vec3 uFlashColor;
    varying vec2 vUv;
    float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec2 c = vUv - 0.5;
      float ca = uCA * 0.006;
      vec3 col;
      col.r = texture2D(tDiffuse, vUv + c * ca).r;
      col.g = texture2D(tDiffuse, vUv).g;
      col.b = texture2D(tDiffuse, vUv - c * ca).b;
      float v = smoothstep(0.95, 0.25, length(c * vec2(1.1, 1.0)));
      col *= mix(1.0, v, uVignette * 0.55);
      col += uFlashColor * uFlash * (0.6 + 0.4 * v);
      col += (h(vUv * 1000.0 + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }
  `},en=class{composer;bloom;finish;constructor(e,t,n,r){let i=e.getSize(new N),a=new h(i.x,i.y,{type:d,samples:r===`high`?4:0});this.composer=new ge(e,a),this.composer.addPass(new be(t,n));let o=r===`high`?.5:.35;this.bloom=new ve(new N(i.x*o,i.y*o),.6,.45,.85),this.composer.addPass(this.bloom),this.composer.addPass(new Se),this.finish=new pe($t),this.composer.addPass(this.finish)}setSize(e,t){this.composer.setSize(e,t)}update(e,t,n,r,i=!1){let a=this.finish.uniforms;a.uTime.value=e%100,a.uFlash.value=t,a.uCA.value=n,a.uVignette.value=r?.5:.95,this.bloom.strength=i?0:r?.35:.6,this.bloom.threshold=r?.95:.85}render(){this.composer.render()}},Z=900,tn=class{p;mesh;pos=new Float32Array(Z*3);vel=new Float32Array(Z*3);rot=new Float32Array(Z*3);spin=new Float32Array(Z*3);life=new Float32Array(Z);colorIdx=new Uint8Array(Z);rng=new I(99);m=new e;q=new y;e=new i;v=new r;s=new r(1,1,1);next=0;c=new T;constructor(e){this.p=e;let t=new D(.13,.08),n=new O({side:2,roughness:.4,metalness:.3,emissive:16777215,emissiveIntensity:.25});this.mesh=new g(t,n,Z),this.mesh.frustumCulled=!1,this.mesh.instanceMatrix.setUsage(o);for(let e=0;e<Z;e++)this.mesh.setColorAt(e,new T(1,1,1)),this.m.makeScale(0,0,0),this.mesh.setMatrixAt(e,this.m)}burst(e,t,n,r=3){let i=this.rng;for(let a=0;a<e;a++){let e=this.next;this.next=(this.next+1)%Z,this.pos.set([t.x+i.range(-n.x,n.x),t.y+i.range(-n.y,n.y),t.z+i.range(-n.z,n.z)],e*3),this.vel.set([i.range(-1.5,1.5),i.range(0,r),i.range(-.5,2.5)],e*3),this.rot.set([i.range(0,6),i.range(0,6),i.range(0,6)],e*3),this.spin.set([i.range(-9,9),i.range(-9,9),i.range(-9,9)],e*3),this.life[e]=i.range(5,8),this.colorIdx[e]=i.int(6)}}update(e){for(let t=0;t<Z;t++){if(this.life[t]<=0)continue;this.life[t]-=e;let n=t*3;this.vel[n+1]-=3.2*e;let r=Math.exp(-e*1.8);this.vel[n]*=r,this.vel[n+1]=Math.max(this.vel[n+1]*r,-1.3),this.vel[n+2]*=r,this.pos[n]+=(this.vel[n]+Math.sin(this.rot[n]*2)*.4)*e,this.pos[n+1]+=this.vel[n+1]*e,this.pos[n+2]+=this.vel[n+2]*e,this.pos[n+1]<.02&&(this.pos[n+1]=.02,this.vel[n]=this.vel[n+1]=this.vel[n+2]=0,this.spin[n]=this.spin[n+1]=this.spin[n+2]=0,this.rot[n]=Math.PI/2);for(let t=0;t<3;t++)this.rot[n+t]+=this.spin[n+t]*e;let i=Math.min(1,this.life[t]/1.2);this.q.setFromEuler(this.e.set(this.rot[n],this.rot[n+1],this.rot[n+2])),this.v.set(this.pos[n],this.pos[n+1],this.pos[n+2]),this.s.setScalar(i),this.m.compose(this.v,this.q,this.s),this.mesh.setMatrixAt(t,this.m),this.mesh.setColorAt(t,this.c.copy(this.p.lights[this.colorIdx[t]]))}this.mesh.instanceMatrix.needsUpdate=!0,this.mesh.instanceColor&&(this.mesh.instanceColor.needsUpdate=!0)}};function nn(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`),n=new I(5);t.clearRect(0,0,256,256);for(let e=0;e<60;e++){let e=n.range(40,216),r=n.range(60,196),i=n.range(30,90),a=t.createRadialGradient(e,r,0,e,r,i);a.addColorStop(0,`rgba(255,255,255,0.08)`),a.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=a,t.fillRect(0,0,256,256)}let r=new ce(e);return r.colorSpace=S,r}var rn=class{p;group=new l;sprites=[];mat;constructor(e){this.p=e,this.mat=new f({map:nn(),transparent:!0,depthWrite:!1,blending:2,opacity:.12});let t=new I(11);for(let e=0;e<26;e++){let e=new de(this.mat),n=new r(t.range(-14,14),t.range(.6,5),t.range(-9,12));e.position.copy(n),e.scale.setScalar(t.range(7,13)),this.group.add(e),this.sprites.push({s:e,base:n,ph:t.range(0,6)})}}update(e,t){this.mat.color.copy(this.p.haze),this.mat.opacity=(this.p.light?.06:.1)*(.6+.4*t.presence)+.06*t.dropPulse;for(let t of this.sprites)t.s.position.set(t.base.x+Math.sin(e*.05+t.ph)*2,t.base.y+Math.sin(e*.07+t.ph*2)*.4,t.base.z)}},an=`
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
varying vec3 vW;
void main() {
  vAlong = -position.y / 18.0;
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - wp.xyz);
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,on=`
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
varying float vAlong;
varying vec3 vN;
varying vec3 vV;
varying vec3 vW;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float edge = pow(abs(dot(normalize(vN), normalize(vV))), 2.2);
  float fall = pow(1.0 - clamp(vAlong, 0.0, 1.0), 1.6);
  float haze = 0.55 + 0.45 * noise(vW * 0.7 + vec3(0.0, uTime * 0.25, uTime * 0.15));
  // Beams thin out before head height so they don't wash over the crowd.
  float floorFade = smoothstep(0.8, 3.5, vW.y);
  float near = smoothstep(1.0, 4.0, length(cameraPosition - vW));
  float a = uIntensity * edge * fall * haze * floorFade * near;
  gl_FragColor = vec4(uColor * a, 1.0);
}
`,sn=`
varying vec2 vUv;
varying float vCamDist;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vCamDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`,cn=`
uniform vec3 uColor;
uniform float uIntensity;
varying vec2 vUv;
varying float vCamDist;
void main() {
  float across = abs(vUv.x - 0.5) * 2.0;
  float core = exp(-across * across * 18.0);
  float fall = 1.0 - smoothstep(0.55, 1.0, vUv.y);
  // A laser plane passing right by the lens would fill the frame: fade it.
  float near = smoothstep(1.5, 5.0, vCamDist);
  gl_FragColor = vec4(uColor * uIntensity * core * fall * near, 1.0);
}
`,ln=class{p;group=new l;heads=[];spots=[];key;rim;hemi;djLight;program=`calm`;laserProgram=`off`;strobe=0;strobeEnabled=!0;hideLasers=!1;lasers=[];laserLevel=0;colorShift=0;rng=new I(4242);lastStrobe=-10;tmp=new r;constructor(e,t,n){this.p=e,this.hemi=new fe(16777215,2236962,.6),this.key=new p(16777215,.9),this.key.position.set(4,12,14),this.rim=new p(16777215,1.2),this.rim.position.set(0,16,-9),this.group.add(this.hemi,this.key,this.rim);for(let e=0;e<4;e++){let t=new x(16777215,60,40,.5,.6,1.2);t.position.set(-9+e*6,8.2,-3.2),t.target.position.set(-6+e*4,0,4+e%2*3),this.group.add(t,t.target),this.spots.push(t)}this.djLight=new x(16777215,40,20,.28,.5,1.2),this.djLight.position.set(0,8.2,-1.5),this.djLight.target.position.set(0,2.5,Mt-.9),this.group.add(this.djLight,this.djLight.target);let i=new j(.09,1.9,18,32,1,!0);i.translate(0,-9,0);let a=new O({color:1381660,roughness:.5,metalness:.6});t.forEach((e,t)=>{let r=new l;r.position.copy(e);let o=new w(new k(.34,.42,.34),a);r.add(o);let s=new A({color:16777215}),c=new w(new le(.13,20),s);c.rotation.x=Math.PI/2,c.position.y=-.215,r.add(c);let u=new ae({uniforms:{uColor:{value:new T},uIntensity:{value:0},uTime:{value:0}},vertexShader:an,fragmentShader:on,transparent:!0,depthWrite:!1,blending:2,side:2}),d=new w(i,u);d.frustumCulled=!1,r.add(d),this.group.add(r),this.heads.push({base:e.clone(),yoke:r,beam:d,mat:u,lens:s,pan:0,tilt:.3,panT:0,tiltT:.3,intensity:0,target:n[t%n.length].clone(),colorIdx:t%6})});let o=new D(.07,34),s=new D(.07,34).rotateY(Math.PI/2),c=ye([o,s]);c.translate(0,17,0),[new r(0,8.1,-9.3),new r(-10,1.3,-3.3),new r(10,1.3,-3.3)].forEach((e,t)=>{let n=t===0?10:6;for(let r=0;r<n;r++){let n=new ae({uniforms:{uColor:{value:new T},uIntensity:{value:0}},vertexShader:sn,fragmentShader:cn,transparent:!0,depthWrite:!1,blending:2,side:2}),i=new w(c,n);i.position.copy(e),i.frustumCulled=!1,i.visible=!1,this.group.add(i),this.lasers.push({mesh:i,mat:n,i:r,src:t})}})}retarget(e){for(let t of this.heads)t.target.copy(this.rng.pick(e))}onBar(e){e%2==0&&(this.colorShift=(this.colorShift+1)%6)}update(e,t,n,r){let i=this.p,a=t.presence,o=t.hype,s=t.beatPos,c=t.beatPhase;this.hemi.color.copy(i.lights[0]).lerp(new T(1,1,1),.6),this.hemi.groundColor.copy(i.bgDeep).multiplyScalar(i.light?.35:1),this.hemi.intensity=i.mono?i.light?.45:.3+.15*a:i.light?.8:.55+.25*a,this.key.intensity=i.mono?1.5:i.light?1.2:.75,this.rim.color.copy(i.lights[1%i.lights.length]),this.rim.intensity=.9+.8*t.kickPulse*a+.5*o,this.spots.forEach((e,t)=>{e.color.copy(i.lights[(t+this.colorShift)%6]);let n=Math.exp(-((c*4-t)%4+4)%4*1.2);e.intensity=(12+26*o+22*n*o)*(.35+.65*a)*(i.mono?.35:1)}),this.djLight.color.copy(i.fg).lerp(i.lights[0],.3),this.djLight.intensity=18+14*t.vocal+10*t.kickPulse;let l=a<.2?`calm`:this.program;this.heads.forEach((t,r)=>{let u=this.heads.length,d=r/(u-1)-.5,f=0;switch(l){case`sweep`:{let e=s/8*Math.PI*2;t.panT=Math.PI+.55*Math.sin(e+r*.35),t.tiltT=.45+.25*Math.sin(e*.5+r*.5),f=.7+.3*o;break}case`crowd`:this.aimAt(t,t.target),f=.55+.35*o;break;case`fan`:t.panT=Math.PI+d*1.6,t.tiltT=.35+.15*Math.sin(s*Math.PI*.5),f=.3+.9*Math.exp(-(((s*2-r)%u+u)%u)*.9);break;case`center`:this.aimAt(t,this.tmp.set(0,2.6,Mt-1)),f=.8;break;case`ballyhoo`:{let e=n*2.4+r*.9;t.panT=Math.PI+.7*Math.sin(e),t.tiltT=.55+.35*Math.cos(e*1.3),f=.9+.3*Math.exp(-c*5);break}case`calm`:t.panT=Math.PI+.3*Math.sin(n*.15+r),t.tiltT=.25+.1*Math.sin(n*.2+r*.7),f=r%3==0?.35*(.4+.6*a):.05;break;case`off`:f=0}f*=.7+.5*Math.exp(-c*4)*a,t.intensity=R(t.intensity,f,10,e);let p=l===`ballyhoo`?14:5;t.pan=R(t.pan,t.panT,p,e),t.tilt=R(t.tilt,t.tiltT,p,e),t.yoke.rotation.set(t.tilt,t.pan,0,`YXZ`);let m=i.lights[(t.colorIdx+this.colorShift)%6];t.mat.uniforms.uColor.value.copy(m),t.mat.uniforms.uIntensity.value=t.intensity*(i.light?.05:i.mono?.6:.28),t.mat.uniforms.uTime.value=n,t.lens.color.copy(m).multiplyScalar(.5+3*t.intensity)}),l===`crowd`&&r.length&&this.rng.chance(e*.3)&&this.retarget(r);let u=a<.3?`off`:this.laserProgram;this.laserLevel=R(this.laserLevel,u===`off`?0:1,6,e);for(let e of this.lasers){let r=this.laserLevel>.01&&!this.hideLasers;if(e.mesh.visible=r,!r)continue;let a=e.src===0?10:6,o=e.i/(a-1)-.5,l=e.src===1?1:e.src===2?-1:0,d=0,f=0;switch(u){case`fan`:d=o*1.5,f=-.95+.2*Math.sin(s*Math.PI*.5);break;case`scan`:d=o*.9+.6*Math.sin(s*Math.PI*.25),f=-.9+.1*Math.sin(s*Math.PI+o*3);break;case`tunnel`:{let t=e.i/a*Math.PI*2+n*.8;d=.35*Math.cos(t),f=-.95+.22*Math.sin(t);break}}l&&(d=d*.6+l*.7),e.src===0&&(f=-2.05-(f+.95)*.8),e.mesh.rotation.set(0,0,0),e.mesh.rotateY(d),e.mesh.rotateX(-f);let p=.75+.25*Math.exp(-c*6)+.3*t.hatPulse;e.mat.uniforms.uColor.value.copy(i.lights[(e.i+this.colorShift+e.src)%6]),e.mat.uniforms.uIntensity.value=this.laserLevel*p*(i.light?.5:1.6)}this.strobe*=Math.exp(-e*22)}flash(e,t){this.strobeEnabled&&(e-this.lastStrobe<1/3||(this.lastStrobe=e,this.strobe=Math.max(this.strobe,t)))}aimAt(e,t){let n=this.tmp.copy(t).sub(e.base);e.panT=Math.atan2(-n.x,-n.z),e.panT<0&&(e.panT+=Math.PI*2);let r=Math.hypot(n.x,n.z);e.tiltT=Math.atan2(r,-n.y)}},un=class{renderer;scene=new oe;music=new Re;theme;u;venue;lights;crowd;cam;show;confetti;haze;post;nowPlaying;logos;time=0;pmrem;envScene=new oe;envPanels=[];envTimer=0;envDirty=!0;fog;envDisabled=!1;hazeHidden=!1;fogDisabled=!1;constructor(e,t,n){this.renderer=e,this.theme=new xt(t);let r=this.theme.p;this.u=wt(r),Y(this.u,X.plasma),this.u.uModeMix.value=1,this.scene.background=r.bgDeep,this.fog=new u(r.bgDeep.getHex(),.016),this.scene.fog=this.fog,this.venue=new It(r,this.u,n.quality),this.crowd=new zt(n.crowd,n.quality,r),this.lights=new ln(r,this.venue.fixtures,this.crowd.targets),this.confetti=new tn(r),this.haze=new rn(r),this.cam=new Kt(innerWidth/innerHeight,this.crowd),this.show=new qt(this.lights,this.u,this.crowd,this.confetti,this.cam),this.nowPlaying=new Zt(this.u),this.logos=new Yt(this.u),this.scene.add(this.venue.group,this.crowd.group,this.crowd.shadows,this.lights.group,this.confetti.mesh,this.haze.group),this.pmrem=new Ce(e),this.buildEnvScene(),this.post=new en(e,this.scene,this.cam.camera,n.quality),this.theme.onChange(e=>{this.crowd.applyPalette(e),this.envDirty=!0}),this.music.on(e=>this.onMusic(e));for(let e of this.crowd.all)e.rig.onLand=e=>{this.landings.length<2e4&&this.landings.push({t:this.time,beat:this.music.danceBeatPos,speed:e,bpm:this.music.danceBpm})}}landings=[];buildEnvScene(){let e=this.theme.p,t=new w(new k(30,14,30),new A({color:328967,side:1}));this.envScene.add(t);let n=(e,t,n,r,i)=>{let a=new A({side:2}),o=new w(new D(t,n),a);o.position.copy(r),o.lookAt(0,0,0),this.envScene.add(o),this.envPanels.push({mat:a,src:e,gain:i})};n(e.fg,10,4,new r(0,6.5,4),2.2);for(let t=0;t<6;t++){let i=t/6*Math.PI*2;n(e.lights[t],3,5,new r(Math.sin(i)*13,1.5,Math.cos(i)*13),2.5)}n(e.lights[0],12,5,new r(0,3,-14),1.6)}rebuildEnv(){for(let e of this.envPanels)e.mat.color.copy(e.src).multiplyScalar(e.gain);let e=this.scene.environment;this.scene.environment=this.pmrem.fromScene(this.envScene,.03).texture,e?.dispose(),this.scene.environmentIntensity=this.theme.p.light?.5:.55}onMusic(e){let t={music:this.music,time:this.time,cameraYaw:null};this.crowd.onEvent(e,t),this.show.onEvent(e,this.music,this.time)}debugHide(e){if(e.has(`lasers`)&&(this.lights.hideLasers=!0),e.has(`beams`))for(let e of this.lights.heads)e.beam.visible=!1;if(e.has(`spots`))for(let e of this.lights.spots)e.visible=!1;e.has(`haze`)&&(this.hazeHidden=!0),e.has(`crowd`)&&(this.crowd.group.visible=!1),e.has(`bloom`)&&(this.post.bloom.enabled=!1),e.has(`rim`)&&(this.lights.rim.visible=!1),e.has(`djspot`)&&(this.lights.djLight.visible=!1),e.has(`env`)&&(this.envDisabled=!0),e.has(`fog`)&&(this.fogDisabled=!0)}setPalette(e,t=!1){this.theme.set(e,t)}step(e){this.time+=e;let t=this.time;this.theme.update(e);let n=this.theme.p;this.music.update(e),Tt(this.u,this.music,n,t,e),this.crowd.update(e,this.music,t,this.cam.camera),this.venue.update(e,this.music,t),this.lights.update(e,this.music,t,this.crowd.targets),this.confetti.update(e),this.haze.update(t,this.music),this.nowPlaying.update(e,this.music),this.logos.update(e,this.music),this.cam.update(e,this.music,t);for(let e of this.crowd.dancers)e.glowScale=+!n.light;this.fog.color.copy(n.bgDeep),this.fog.density=this.fogDisabled?0:n.light?.0025:.016,this.haze.group.visible=!n.light&&!this.hazeHidden,this.renderer.toneMappingExposure=n.light?.82:1.05,this.envTimer-=e,this.envDirty&&this.envTimer<=0&&!this.envDisabled&&(this.rebuildEnv(),this.envDirty=!1,this.envTimer=.3),this.post.update(t,this.lights.strobe,this.music.dropPulse*.8,n.light,n.ink)}render(){this.post.render()}resize(e,t){this.cam.camera.aspect=e/t,this.cam.camera.updateProjectionMatrix(),this.post.setSize(e,t)}},dn=class{root;inputs=new Map;query;constructor(){let e=document.createElement(`style`);e.textContent=`
      .wp-tune { position: fixed; right: 16px; top: 16px; width: 330px; padding: 12px 14px; border-radius: 12px;
        background: rgba(10,10,14,.8); backdrop-filter: blur(8px); color: #eee; font: 12px/1.5 ui-monospace, monospace;
        border: 1px solid rgba(255,255,255,.12); display: none; }
      .wp-tune .row { display: grid; grid-template-columns: 128px 1fr 44px; gap: 6px; align-items: center; }
      .wp-tune .row.changed span:first-child { color: #ffd166; }
      .wp-tune input[type=range] { width: 100%; }
      .wp-tune .num { text-align: right; }
      .wp-tune .q { margin-top: 8px; word-break: break-all; color: #aaa; min-height: 1.5em; }
      .wp-tune button { margin-top: 8px; margin-right: 6px; font: inherit; color: #eee; background: rgba(255,255,255,.12);
        border: 1px solid rgba(255,255,255,.2); border-radius: 6px; padding: 2px 10px; cursor: pointer; }
    `,document.head.appendChild(e),this.root=document.createElement(`div`),this.root.className=`wp-tune`;let t=document.createElement(`div`);t.textContent=`tuning dials (k to hide)`,t.style.marginBottom=`6px`,this.root.append(t);for(let e of P){let t=document.createElement(`label`);t.className=`row`,t.title=e.help;let n=document.createElement(`span`);n.textContent=e.label;let r=document.createElement(`input`);r.type=`range`,r.min=String(e.min),r.max=String(e.max),r.step=String(e.step);let i=document.createElement(`span`);i.className=`num`,r.addEventListener(`input`,()=>De(e.key,Number(r.value))),r.addEventListener(`keydown`,e=>e.stopPropagation()),t.append(n,r,i),this.root.append(t),this.inputs.set(e.key,{input:r,value:i})}this.query=document.createElement(`div`),this.query.className=`q`;let n=document.createElement(`button`);n.textContent=`reset`,n.addEventListener(`click`,()=>Oe());let r=document.createElement(`button`);r.textContent=`copy`,r.addEventListener(`click`,()=>void navigator.clipboard?.writeText(Ae()).catch(()=>{})),this.root.append(this.query,n,r),document.body.append(this.root),Ee(()=>{this.sync(),je()}),this.sync()}toggle(){this.root.style.display=this.root.style.display===`block`?`none`:`block`}sync(){for(let e of P){let{input:t,value:n}=this.inputs.get(e.key);t.value=String(F[e.key]),n.textContent=String(+F[e.key].toFixed(2)),t.parentElement.classList.toggle(`changed`,F[e.key]!==we[e.key])}this.query.textContent=Ae()||`(defaults)`}},Q=new URLSearchParams(location.search),fn=Q.has(`capture`);ke(Q);var $=new he({antialias:!1,powerPreference:`high-performance`,preserveDrawingBuffer:fn});$.setPixelRatio(Math.min(devicePixelRatio,fn?1:1.5)),$.setSize(innerWidth,innerHeight),$.toneMapping=4,$.toneMappingExposure=1.05,document.body.appendChild($.domElement),Q.has(`lab`)?($.toneMapping=4,St($,Q)):pn();async function pn(){let e=Q.get(`quality`)??`high`,t=Number(Q.get(`crowd`)??(e===`high`?70:40)),n=null,r=Q.get(`theme`),i=new un($,bt({name:`default`,colors:{}}),{quality:e,crowd:t}),a=new ze(()=>`#`+i.theme.p.lights[0].getHexString()),o=fn?null:new dn,s=(e,t=!1)=>i.setPalette(bt(e),t),c=async(e,t=!1)=>{try{let n=await fetch(`themes/${encodeURIComponent(e)}`);n.ok&&s(await n.json(),t)}catch{}},l,u=0,d=null,f=Q.get(`replay`);if(f){l=await Ne.load(f),u=Number(Q.get(`t`)??0);let e=Q.get(`audio`);e&&!fn&&(d=new Audio(e),d.currentTime=u,addEventListener(`click`,()=>void d.play(),{once:!0}),d.play().catch(()=>a.setStatus(`click to start the music`)))}else l=Q.has(`demo`)?new Pe:new Me(`${location.protocol===`https:`?`wss`:`ws`}://${location.host}/ws`,e=>{n=e,r||s(e,i.time<.5)},e=>i.nowPlaying.onTrack(e));r&&await c(r,!0),Q.get(`title`)&&i.nowPlaying.onTrack({type:`track`,playing:!0,player:`test`,title:Q.get(`title`),artist:Q.get(`artist`)??``,art:Q.get(`art`)}),i.show.forceSwirl=Q.has(`swirl`),i.logos.demo=Q.has(`logos`);let p=new Set((Q.get(`hide`)??``).split(`,`).filter(Boolean));i.debugHide(p);let m=e=>{d&&!d.paused?u=d.currentTime:u+=e,l.poll(u,e=>i.music.ingest(e)),i.step(e)};if(f&&u>0){let e=u;u=Math.max(0,e-20),i.music.presence=0;let t=e;for(;u<t;)m(1/30)}let h=()=>{$.setSize(innerWidth,innerHeight),i.resize(innerWidth,innerHeight)};addEventListener(`resize`,h),h();let g=[`wide`,`djClose`,`djReverse`,`crowdDolly`,`heroClose`,`crane`,`overhead`,`orbit`,`stageSide`],_=[],v=-1;addEventListener(`keydown`,async e=>{if(e.key===`d`)a.toggleDebug();else if(e.key===`h`)a.toggleHelp();else if(e.key===`k`)o?.toggle();else if(e.key===`f`)document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();else if(e.key===` `)i.cam.locked=null,i.cam.go(g[Math.floor(Math.random()*g.length)],12,0);else if(e.key>=`1`&&e.key<=`9`){let t=g[Number(e.key)-1];i.cam.locked=t,i.cam.go(t,1e6,.8)}else e.key===`0`?i.cam.locked=null:e.key===`t`?(_.length||(_=await(await fetch(`themes`)).json()),v=(v+1)%_.length,r=_[v],await c(r),a.setStatus(`theme preview: `,{b:r},` (T to return)`)):e.key===`T`?(r=null,n&&s(n)):(e.key===`q`||e.key===`Escape`)&&window.close()}),window.__wp={ready:!0,party:i,step(e,t=1/30){for(let n=0;n<e;n++)m(t);i.render()},get clock(){return u},shot(e,t=0){i.cam.locked=e,i.cam.go(e,1e6,0),i.cam.current.t=t},info(){let e=i.music;return{clock:u,bpm:e.bpm,section:e.section,hype:e.hype,vocal:e.vocal,shot:i.cam.current.kind,theme:i.theme.p.name,activity:i.crowd.activity()}}};let y=null,ee=()=>!fn&&i.music.playing&&document.visibilityState===`visible`;setInterval(async()=>{try{ee()&&!y?(y=await navigator.wakeLock.request(`screen`),y.addEventListener(`release`,()=>y=null)):!ee()&&y&&(await y.release(),y=null)}catch{}},2e3);let b=performance.now(),x=0,te=0,S=0,C=Math.min(devicePixelRatio,1.5),w=C,T=0,ne=0,E=0,D=e=>{if(fn||S===0)return;S<48?T+=e:T=0,S>58?ne+=e:ne=0;let t=w;T>3&&w>.6&&(t=Math.max(.6,w-.2)),ne>12&&w<C&&(t=Math.min(C,w+.2)),t!==w&&(w=t,T=ne=0,$.setPixelRatio(w),h())};$.setAnimationLoop(()=>{if(Q.has(`frozen`))return;let t=performance.now(),n=Math.min(.05,(t-b)/1e3);b=t,m(n),i.render(),x+=n,te++,x>1&&(S=te/x,x=te=0),D(n),E+=n,E>5&&l instanceof Me&&(E=0,l.send({type:`stats`,fps:Math.round(S),ratio:w,w:innerWidth,h:innerHeight,quality:e})),l instanceof Me&&a.setStatus(...l.connected?[`♪ Wobble Party is listening — play something in `,{b:`cliamp`},`, Spotify or anything else`]:[`waiting for the wobble brain…`]),a.update(n,i.music,`${S.toFixed(0)} fps · ${i.cam.current.kind} · ${i.theme.p.name}`,i.crowd.activity())})}