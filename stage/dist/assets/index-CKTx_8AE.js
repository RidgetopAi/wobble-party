import{A as e,An as t,B as n,Cn as r,D as i,E as a,En as o,Fn as s,Gn as c,H as l,J as u,K as d,L as f,M as p,On as m,P as h,R as g,T as _,Tn as v,Un as y,V as ee,W as te,Wn as b,Y as x,_n as S,_t as ne,a as C,at as w,bn as re,bt as ie,c as ae,d as oe,f as T,hn as se,ht as ce,i as le,it as E,jn as ue,l as de,ln as fe,lt as pe,m as D,q as me,qn as he,r as O,rt as ge,s as _e,sn as ve,tt as ye,u as be,ut as k,v as A,vn as xe,wn as Se,x as Ce,xt as we,yn as j,yt as M,z as Te}from"./three-core-BF1ozf76.js";import{a as Ee,c as De,d as Oe,i as ke,l as Ae,n as je,o as Me,r as Ne,s as Pe,t as Fe,u as Ie}from"./three-BsplqAdk.js";(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var Le={energy:.35,bounce:.25,jumpy:.15,shimmy:.45,showoff:.35,hop:.5,hopDown:.2,twitchGate:.6,twitchHype:.55,bob:1.4,swirl:4,hype:1.05},Re=[{key:`energy`,label:`crowd energy`,min:-.3,max:.6,step:.05,help:`+ to every crowd member (0.65..1.3)`},{key:`bounce`,label:`crowd bounce`,min:-.3,max:.7,step:.05,help:`+ bob size trait (0.3..1)`},{key:`jumpy`,label:`crowd jumpy`,min:-.2,max:.8,step:.05,help:`+ hop trait (0.1..1)`},{key:`shimmy`,label:`crowd shimmy`,min:-.3,max:1,step:.05,help:`+ hi-hat twitch trait (0..1)`},{key:`showoff`,label:`crowd showoff`,min:0,max:.6,step:.05,help:`+ solo swirl trait (0.05..0.4)`},{key:`hop`,label:`hop every beat at`,min:.1,max:1,step:.05,help:`hype·energy·jumpy above this`},{key:`hopDown`,label:`hop every 2nd at`,min:.05,max:1,step:.05,help:`hype·energy·jumpy above this`},{key:`twitchGate`,label:`twitch: shimmy >`,min:0,max:1,step:.05,help:`hi-hat twitch gate`},{key:`twitchHype`,label:`twitch: hype >`,min:0,max:1,step:.05,help:`hi-hat twitch needs this much hype`},{key:`bob`,label:`bob size`,min:.5,max:2.5,step:.05,help:`groove squash multiplier`},{key:`swirl`,label:`swirl chance`,min:0,max:5,step:.25,help:`x solo + ripple odds`},{key:`hype`,label:`hype`,min:.5,max:1.6,step:.05,help:`x global (lights, camera too)`}],N={...Le},ze=[];function Be(e){ze.push(e)}function Ve(e,t){let n=Re.find(t=>t.key===e);N[e]=Math.min(n.max,Math.max(n.min,t));for(let e of ze)e()}function He(){Object.assign(N,Le);for(let e of ze)e()}function Ue(e){for(let t of Re){let n=e.get(t.key);if(n===null)continue;let r=Number(n);Number.isFinite(r)&&(N[t.key]=Math.min(t.max,Math.max(t.min,r)))}}function We(){return Re.filter(e=>N[e.key]!==Le[e.key]).map(e=>`${e.key}=${+N[e.key].toFixed(3)}`).join(`&`)}function Ge(){let e=new URLSearchParams(location.search);for(let t of Re)N[t.key]===Le[t.key]?e.delete(t.key):e.set(t.key,String(+N[t.key].toFixed(3)));let t=e.toString();history.replaceState(null,``,location.pathname+(t?`?`+t:``)+location.hash)}var Ke=[`auto`,`classic`,`spooky`],qe=`wobble-party.skin`;function Je(e=new Date){let t=e.getMonth();return t===9||t===10&&e.getDate()<=2?`spooky`:`classic`}function Ye(e){return e!==null&&Ke.includes(e)}var P=new class{choice=`auto`;id=`classic`;listeners=[];fromUrl=!1;init(e){let t=e.get(`skin`),n=null;try{n=localStorage.getItem(qe)}catch{}this.fromUrl=Ye(t),this.choice=Ye(t)?t:Ye(n)?n:`auto`,this.id=this.resolve()}resolve(){return this.choice===`auto`?Je():this.choice}onChange(e){this.listeners.push(e)}set(e){if(this.choice=e,!this.fromUrl)try{localStorage.setItem(qe,e)}catch{}let t=this.resolve();if(t!==this.id){this.id=t;for(let e of this.listeners)e(t)}}cycle(){this.set(Ke[(Ke.indexOf(this.choice)+1)%Ke.length])}label(){return this.choice===`auto`?`auto (${this.id})`:this.id}},Xe=class{url;onTheme;onTrack;connected=!1;queue=[];ws=null;send(e){this.ws?.readyState===WebSocket.OPEN&&this.ws.send(JSON.stringify(e))}retry=0;constructor(e,t,n=()=>{}){this.url=e,this.onTheme=t,this.onTrack=n,this.open()}open(){let e=new WebSocket(this.url);this.ws=e,e.onopen=()=>{this.connected=!0,this.retry=0},e.onmessage=e=>{let t=JSON.parse(e.data);t.type===`theme`?this.onTheme(t):t.type===`track`?this.onTrack(t):this.queue.push(t)},e.onclose=()=>{this.connected=!1;let e=Math.min(4e3,250*2**this.retry++);setTimeout(()=>this.open(),e)}}poll(e,t){this.queue.length>400&&this.queue.splice(0,this.queue.length-400);for(let e of this.queue)t(e);this.queue.length=0}},Ze=class e{frames;connected=!0;i=0;constructor(e){this.frames=e}get duration(){return this.frames.length?this.frames[this.frames.length-1].t:0}poll(e,t){for(this.i>0&&this.frames[this.i-1].t>e+.5&&(this.i=0);this.i<this.frames.length&&this.frames[this.i].t<=e;)t(this.frames[this.i++])}static async load(t){let n=(await(await fetch(t)).text()).split(`
`).filter(e=>e.length>2).map(e=>JSON.parse(e));return new e(n)}},Qe=class{connected=!0;t=0;beat=0;phase=0;phraseOn=!1;poll(e,t){let n=512/48e3;for(;this.t+n<=e;){this.t+=n,this.phase+=n*122/60;let e=!1;this.phase>=1&&(--this.phase,this.beat++,e=!0);let r=Math.floor(this.beat/4)%32,i=r>=24&&r<28,a=r===28&&this.beat%4==0&&e,o=r>=20&&r<24,s=o?.3:i?.5+(r-24)*.08:r>=28?.9:.78,c=e&&!o&&!i?.9:0,l=e&&this.beat%2==1&&!o?.7:0,u=this.phase*2%1,d=u<n*4?.5:0,f=Math.sin(this.t*.35)>-.2&&!i,p=0;f!==this.phraseOn&&(p=f?1:2,this.phraseOn=f);let m=f&&Math.sin(this.t*2*Math.PI*3.1)>.97?.7:0,h=f?.35+.35*Math.max(0,Math.sin(this.t*2*Math.PI*3.1)):0,g=Math.exp(-this.phase*6);t({t:this.t,silent:!1,level:s*(.8+.2*g),db:-14,bands:[o?.2:.4+.5*g,o?.25:.5+.45*g,.5,.55,.5+(i?.3:0),.4+.3*(1-u)],brightness:.5+(i?.3:0),flux:c?.9:l?.6:.2,onset:c||l,kick:c,snare:l,hat:d,bpm:122,beatConf:.8,beatPhase:this.phase,beat:this.beat,barBeat:this.beat%4,beatHit:e,energy:s,energyLong:.76,build:i?(r-24)/4:0,drop:+!!a,calm:o?.6:0,density:.5,section:o?0:i?2:r>=28?3:1,vocal:f?.9:.05,vocalEnv:h,syllable:m,pitch:f?.4*Math.sin(this.t*.9):0,pitchHz:f?300:0,phrase:p})}}},F=class{s;constructor(e){this.s=e>>>0||1}next(){let e=this.s+=1831565813;return e=Math.imul(e^e>>>15,e|1),e^=e+Math.imul(e^e>>>7,e|61),((e^e>>>14)>>>0)/4294967296}range(e,t){return e+(t-e)*this.next()}int(e){return Math.floor(this.next()*e)}pick(e){return e[this.int(e.length)]}chance(e){return this.next()<e}weighted(e){let t=e.reduce((e,[,t])=>e+Math.max(0,t),0),n=this.next()*t;for(let[t,r]of e)if(n-=Math.max(0,r),n<=0)return t;return e[e.length-1][0]}},I=(e,t=0,n=1)=>e<t?t:e>n?n:e,$e=(e,t,n)=>{let r=I((n-e)/(t-e));return r*r*(3-2*r)},L=(e,t,n,r)=>t+(e-t)*Math.exp(-n*r),et=e=>e<.5?2*e*e:1-(-2*e+2)**2/2,R={Calm:0,Groove:1,Build:2,Peak:3},tt=[`calm`,`groove`,`build`,`peak`],nt=class{level=0;energy=0;energyLong=0;sub=0;bass=0;lowMid=0;mid=0;highMid=0;high=0;brightness=0;flux=0;vocal=0;vocalEnv=0;vocalFloor=0;mouth=0;pitch=0;build=0;calm=0;density=0;section=R.Groove;kickPulse=0;snarePulse=0;hatPulse=0;beatPulse=0;dropPulse=0;syllablePulse=0;sinceDrop=1e9;phraseTime=0;inPhrase=!1;presence=0;silentFor=1e9;bpm=120;beatConf=0;beatPos=0;barBeat=0;danceMul=1;danceBeatPos=0;hype=0;listeners=[];lastBeatFloor=-1;lastDanceFloor=-1;beatTarget=0;lastFrame=null;barOffset=0;wasSilent=!0;on(e){this.listeners.push(e)}emit(e){for(let t of this.listeners)t(e)}get beatPhase(){return this.beatPos-Math.floor(this.beatPos)}get dancePhase(){return this.danceBeatPos-Math.floor(this.danceBeatPos)}get barPos(){return((Math.floor(this.beatPos)-this.barOffset)%4+4)%4+this.beatPhase}get danceBpm(){return this.bpm*this.danceMul}get playing(){return this.presence>.5}ingest(e){this.lastFrame=e;let t=e.beat+e.beatPhase;if(this.beatTarget=t,Math.abs(t-this.beatPos)>1.5&&(this.beatPos=t,this.lastBeatFloor=Math.floor(t)),this.barOffset=((e.beat-e.barBeat)%4+4)%4,e.bpm>0){this.bpm=e.bpm;let t=e.bpm>=145?.5:e.bpm<80?2:1;t!==this.danceMul&&(this.danceMul===.5?e.bpm<138:this.danceMul!==2||e.bpm>86)&&(this.danceMul=t,this.danceBeatPos=this.beatPos*t,this.lastDanceFloor=Math.floor(this.danceBeatPos))}if(this.beatConf=e.beatConf,e.kick>0&&(this.kickPulse=Math.max(this.kickPulse,.5+.5*e.kick),this.emit({type:`kick`,strength:e.kick})),e.snare>0&&(this.snarePulse=Math.max(this.snarePulse,.5+.5*e.snare),this.emit({type:`snare`,strength:e.snare})),e.hat>0&&(this.hatPulse=Math.max(this.hatPulse,.4+.6*e.hat),this.emit({type:`hat`,strength:e.hat})),e.syllable>0&&e.vocal>.45&&(this.syllablePulse=Math.max(this.syllablePulse,.6+.4*I(e.syllable*1.5)),this.emit({type:`syllable`,strength:e.syllable})),e.drop>0&&(this.dropPulse=1,this.sinceDrop=0,this.emit({type:`drop`,strength:e.drop})),e.phrase===1?(this.inPhrase=!0,this.phraseTime=0,this.emit({type:`phraseStart`})):e.phrase===2&&(this.inPhrase=!1,this.emit({type:`phraseEnd`})),e.section!==this.section){let t=this.section;this.section=e.section,this.emit({type:`section`,from:t,to:e.section})}e.silent!==this.wasSilent&&(this.wasSilent=e.silent,this.emit({type:e.silent?`musicStop`:`musicStart`}))}update(e){let t=this.lastFrame;if(t){let n=t=>1-Math.exp(-t*e);this.level+=(t.level-this.level)*n(20),this.energy+=(t.energy-this.energy)*n(10),this.energyLong+=(t.energyLong-this.energyLong)*n(4);let[r,i,a,o,s,c]=t.bands;this.sub+=(r-this.sub)*n(18),this.bass+=(i-this.bass)*n(18),this.lowMid+=(a-this.lowMid)*n(14),this.mid+=(o-this.mid)*n(14),this.highMid+=(s-this.highMid)*n(14),this.high+=(c-this.high)*n(14),this.brightness+=(t.brightness-this.brightness)*n(6),this.flux+=(t.flux-this.flux)*n(25),this.vocal+=(t.vocal-this.vocal)*n(12),this.vocalEnv+=(t.vocalEnv-this.vocalEnv)*n(30),this.vocalFloor+=(this.vocalEnv-this.vocalFloor)*n(this.vocalEnv<this.vocalFloor?8:1.5),this.pitch+=(t.pitch-this.pitch)*n(8),this.build+=(t.build-this.build)*n(4),this.calm+=(t.calm-this.calm)*n(3),this.density+=(t.density-this.density)*n(3);let l=+!t.silent;this.presence=L(this.presence,l,l?3:.8,e),this.silentFor=t.silent?this.silentFor+e:0}let n=this.bpm/60;this.beatTarget+=n*e,this.beatPos+=n*e;let r=this.beatTarget-this.beatPos;r>.5&&--r,r<-.5&&(r+=1),this.beatPos+=I(r*(1-Math.exp(-6*e)),-.5*n*e,2*n*e);let i=Math.floor(this.beatPos);if(i!==this.lastBeatFloor){if(i>this.lastBeatFloor&&this.presence>.3){let e=((i-this.barOffset)%4+4)%4;this.barBeat=e,this.beatPulse=1,this.emit({type:`beat`,beat:i,barBeat:e,strength:this.beatConf})}this.lastBeatFloor=i}this.danceBeatPos=this.beatPos*this.danceMul;let a=Math.floor(this.danceBeatPos);a!==this.lastDanceFloor&&(a>this.lastDanceFloor&&this.presence>.3&&this.emit({type:`danceBeat`,beat:a,bar:Math.floor(a/4)}),this.lastDanceFloor=a);let o=(t,n)=>t*Math.exp(-n*e);this.kickPulse=o(this.kickPulse,9),this.snarePulse=o(this.snarePulse,8),this.hatPulse=o(this.hatPulse,14),this.beatPulse=o(this.beatPulse,6),this.dropPulse=o(this.dropPulse,.7),this.syllablePulse=o(this.syllablePulse,12),this.sinceDrop+=e,this.inPhrase&&(this.phraseTime+=e);let s=I((this.vocalEnv-this.vocalFloor)/.15),c=I((this.vocal-.35)/.3);this.mouth=c*I(.06+.3*s*s+.9*this.syllablePulse);let l=I(this.beatConf*1.6),u=I(((.08+.45*this.energy)*(.35+.65*l)*this.presence+this.dropPulse*.4+(this.section===R.Peak?.15:0)-this.calm*.25)*N.hype);this.hype=L(this.hype,u,2.5,e)}},rt=class{accent;status;toastEl;toastTimer=0;help;canvas;ctx;debug=!1;hist=[];statusText=``;statusAlpha=1;constructor(e){this.accent=e;let t=document.createElement(`style`);t.textContent=`
      .wp-status { position: fixed; left: 28px; bottom: 24px; font: 500 14px/1.4 ui-sans-serif, system-ui, sans-serif;
        color: #fff; letter-spacing: .02em; text-shadow: 0 1px 8px rgba(0,0,0,.7); pointer-events: none; transition: opacity .6s; }
      .wp-status b { font-weight: 700; }
      .wp-help { position: fixed; right: 28px; bottom: 24px; padding: 14px 18px; border-radius: 12px;
        background: rgba(10,10,14,.72); backdrop-filter: blur(8px); color: #eee; font: 13px/1.7 ui-monospace, monospace;
        display: none; border: 1px solid rgba(255,255,255,.12); }
      .wp-help kbd { display: inline-block; min-width: 1.6em; text-align: center; padding: 0 .3em; margin-right: .6em;
        border-radius: 4px; background: rgba(255,255,255,.14); }
      .wp-toast { position: fixed; left: 50%; top: 28px; transform: translateX(-50%); padding: 8px 18px; border-radius: 999px;
        background: rgba(10,10,14,.72); backdrop-filter: blur(8px); color: #fff; font: 500 15px/1.4 ui-sans-serif, system-ui, sans-serif;
        border: 1px solid rgba(255,255,255,.14); pointer-events: none; opacity: 0; transition: opacity .4s; }
      .wp-toast b { font-weight: 700; }
      .wp-debug { position: fixed; left: 16px; top: 16px; pointer-events: none; display: none; }
    `,document.head.appendChild(t),this.status=document.createElement(`div`),this.status.className=`wp-status`,this.help=document.createElement(`div`),this.help.className=`wp-help`;for(let[e,t]of[[`space`,`next camera shot`],[`1–9`,`hold a shot · 0 auto`],[`t`,`preview next theme · T current`],[`s`,`skin: auto · classic · spooky`],[`d`,`signal debugger + crowd activity`],[`k`,`tuning dials`],[`f`,`fullscreen`],[`h`,`this help`],[`q`,`quit`]]){let n=document.createElement(`div`),r=document.createElement(`kbd`);r.textContent=e,n.append(r,t),this.help.append(n)}this.canvas=document.createElement(`canvas`),this.canvas.className=`wp-debug`,this.canvas.width=460,this.canvas.height=340,this.ctx=this.canvas.getContext(`2d`),this.toastEl=document.createElement(`div`),this.toastEl.className=`wp-toast`,document.body.append(this.status,this.help,this.canvas,this.toastEl)}toggleHelp(){this.help.style.display=this.help.style.display===`block`?`none`:`block`}toggleDebug(){this.debug=!this.debug,this.canvas.style.display=this.debug?`block`:`none`}toast(...e){this.toastEl.replaceChildren(...e.map(e=>typeof e==`string`?e:Object.assign(document.createElement(`b`),{textContent:e.b}))),this.toastEl.style.opacity=`1`,clearTimeout(this.toastTimer),this.toastTimer=window.setTimeout(()=>this.toastEl.style.opacity=`0`,2200)}setStatus(...e){let t=JSON.stringify(e);t!==this.statusText&&(this.statusText=t,this.status.replaceChildren(...e.map(e=>{if(typeof e==`string`)return e;let t=document.createElement(`b`);return t.textContent=e.b,t})))}update(e,t,n,r){let i=+!t.playing;if(this.statusAlpha+=(i-this.statusAlpha)*(1-Math.exp(-e*2)),this.status.style.opacity=String(this.statusAlpha),!this.debug)return;this.hist.push({v:t.level,vocal:t.vocal,kick:t.kickPulse,beat:t.beatPulse}),this.hist.length>220&&this.hist.shift();let a=this.ctx,o=this.canvas.width,s=this.canvas.height;a.clearRect(0,0,o,s),a.fillStyle=`rgba(8,8,12,.78)`,a.fillRect(0,0,o,s),a.font=`12px ui-monospace, monospace`,a.fillStyle=`#fff`,a.fillText(`${t.bpm.toFixed(1)} bpm (dance ${t.danceBpm.toFixed(0)})  conf ${t.beatConf.toFixed(2)}  ${tt[t.section]}  ${n}`,10,18),[[`level`,t.level,`#9aa`],[`energy`,t.energy,`#9cf`],[`hype`,t.hype,this.accent()],[`bass`,t.bass,`#f96`],[`mid`,t.mid,`#fc6`],[`high`,t.high,`#6cf`],[`vocal`,t.vocal,`#f6c`],[`mouth`,t.mouth,`#f9d`],[`build`,t.build,`#fd4`],[`calm`,t.calm,`#8f8`]].forEach(([e,t,n],r)=>{let i=32+r*13;a.fillStyle=`#aaa`,a.fillText(e,10,i+9),a.fillStyle=n,a.fillRect(70,i,150*Math.max(0,Math.min(1,t)),9)});for(let e=0;e<4;e++)a.fillStyle=Math.floor(t.barPos)===e?this.accent():`rgba(255,255,255,.2)`,a.beginPath(),a.arc(250+e*22,40,7+(Math.floor(t.barPos)===e?3*t.beatPulse:0),0,Math.PI*2),a.fill();let c=o-240-10,l=(e,t,n,r)=>{a.strokeStyle=t,a.beginPath(),this.hist.forEach((t,i)=>{let o=240+i/220*c,s=n+r-t[e]*r;i?a.lineTo(o,s):a.moveTo(o,s)}),a.stroke()};l(`v`,`#9cf`,70,50),l(`vocal`,`#f6c`,130,50),l(`kick`,`#f96`,190,50),r&&this.drawActivity(r,256)}drawActivity(e,t){let n=this.ctx,r=[[`crowd`,`crowd`],[`heroes`,`heroes`],[`yellow`,`yellow`]];n.fillStyle=`#fff`,n.fillText(`activity (4 s)`,10,t),r.forEach(([e],r)=>{n.fillStyle=`#aaa`,n.fillText(e,130+r*80,t)}),[[`hops/beat`,e=>e.hops.toFixed(2)],[`twitch/beat`,e=>e.twitch.toFixed(2)],[`motion`,e=>e.motion.toFixed(2)],[`swirling`,e=>`${Math.round(e.swirling*100)}%`]].forEach(([i,a],o)=>{let s=t+15+o*15;n.fillStyle=`#aaa`,n.fillText(i,10,s),r.forEach(([,t],r)=>{n.fillStyle=t===`crowd`?this.accent():`#eee`,n.fillText(a(e[t]),130+r*80,s)})});let i=e.yellow.motion>.001?e.crowd.motion/e.yellow.motion:0;n.fillStyle=`#aaa`,n.fillText(`crowd÷yel`,370,t),n.fillStyle=this.accent(),n.fillText(`${Math.round(i*100)}% motion`,370,t+15)}};function z(e,t){let n=Math.abs(2*t-1),r=Math.max(0,1-n**+e.boxy)**(1/e.boxy);return e.width*.385*r*(1+e.pear*(.5-t))}function it(e,t=56){let n=[];for(let t=0;t<=48;t++){let r=t/48,i=.5-.5*Math.cos(Math.PI*r);n.push(new y(t===0||t===48?0:z(e,i),i*e.height))}let r=new te(n,t,Math.PI,Math.PI*2);return r.computeVertexNormals(),r}var at=class{height;v=new c(1,0,0,0);constructor(e){this.height=e}apply(e,t=e){let{x:n,y:r,z:i,w:a}=this.v,o=Math.min(1,Math.max(0,e.y/this.height)),s=1+(1/Math.sqrt(Math.max(n,.2))-1)*ot(0,.35,o),c=e.x*s,l=e.z*s,u=a*o,d=Math.cos(u),f=Math.sin(u),p=d*c-f*l,m=f*c+d*l;return c=p+r*o*o*this.height,l=m+i*o*o*this.height,t.set(c,e.y*n,l)}slope(e){let{y:t,z:n,x:r}=this.v;return{az:-Math.atan(2*e*t/r),ax:Math.atan(2*e*n/r)}}};function ot(e,t,n){let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)}var B=function(e){return e[e.None=0]=`None`,e[e.Heart=1]=`Heart`,e[e.Star=2]=`Star`,e[e.Bolt=3]=`Bolt`,e[e.Note=4]=`Note`,e[e.W=5]=`W`,e[e.Skull=6]=`Skull`,e[e.Ring=7]=`Ring`,e[e.Bat=8]=`Bat`,e[e.Pumpkin=9]=`Pumpkin`,e}({}),V=function(e){return e[e.Solid=0]=`Solid`,e[e.Stripes=1]=`Stripes`,e[e.Dots=2]=`Dots`,e[e.Checker=3]=`Checker`,e[e.Zigzag=4]=`Zigzag`,e}({}),st=class{face=new c(1,1,0,.6);face2=new c(0,0,.6,0);face3=new c(0,0,0,1);style=new c;skin=new c},ct=`
uniform vec4 uDeform;
uniform float uBodyH;
varying vec3 vObj;
`,lt=`
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
`,ut=`
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
uniform vec4 uSkin;    // costume, -, glow, seed

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
float sdTri(vec2 p, float r) {
  // Equilateral triangle, point up.
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}
float sdBat(vec2 p, float s) {
  p /= s;
  p.x = abs(p.x);
  float d = sdEllipse(p - vec2(0.0, -0.05), vec2(0.16, 0.3));
  float wing = sdEllipse(p - vec2(0.5, 0.08), vec2(0.5, 0.3));
  // Scalloped trailing edge.
  float bites = min(min(sdCircle(p - vec2(0.3, -0.3), 0.17), sdCircle(p - vec2(0.62, -0.26), 0.15)), sdCircle(p - vec2(0.92, -0.14), 0.12));
  wing = max(wing, -bites);
  d = min(d, wing);
  d = min(d, sdSeg(p, vec2(0.07, 0.2), vec2(0.12, 0.42)) - 0.05);
  return d * s;
}
float sdPumpkin(vec2 p, float s) {
  p /= s;
  float d = sdEllipse(p - vec2(0.0, -0.08), vec2(0.82, 0.62));
  d = min(d, sdBox(p - vec2(0.05, 0.62), vec2(0.07, 0.16)));
  float carve = min(sdTri(vec2(abs(p.x) - 0.3, p.y - 0.02), 0.14), sdBox(p - vec2(0.0, -0.33), vec2(0.42, 0.07)));
  return max(d, -carve) * s;
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
    else if (em < 7.5) d = abs(sdCircle(ep, s * 0.8)) - s * 0.18;
    else if (em < 8.5) d = sdBat(ep, s * 1.25);
    else d = sdPumpkin(ep, s);
    float m = fill(d, aa);
    vec3 ec = kind > 0.5 ? uOutB : uOutA;
    float lc = dot(col, vec3(0.3, 0.59, 0.11));
    if (abs(dot(ec, vec3(0.3, 0.59, 0.11)) - lc) < 0.18) ec = lc > 0.35 ? vec3(0.04, 0.03, 0.06) : vec3(1.0, 0.97, 0.9);
    col = mix(col, ec, m);
    glow += ec * m * uFace3.z;
  }

  // ---------------- costume paint (spooky skin), under the face
  int ck = int(uSkin.x + 0.5);
  vec2 bq = q / H;
  float front = cos(ang);
  if (ck == 1) {
    // Pumpkin: ribs between the lobes, darker toward the stem and the base.
    float rib = 1.0 - abs(sin(ang * 4.0 + 0.4));
    col *= 1.0 - 0.32 * pow(rib, 5.0);
    col *= 0.78 + 0.22 * smoothstep(0.02, 0.3, u) * smoothstep(1.0, 0.8, u);
    rough = 0.25;
  } else if (ck == 2 && front > 0.0) {
    // Skeleton: spine, ribs and pelvis in bone, faintly glow-in-the-dark.
    float bone = sdBox(bq - vec2(0.0, 0.33), vec2(0.016, 0.12));
    for (int k = 0; k < 3; k++) {
      float fk = float(k);
      float y = 0.43 - fk * 0.06;
      float r = abs(bq.y - y + 0.9 * bq.x * bq.x) - 0.013;
      bone = min(bone, max(r, abs(bq.x) - (0.16 - fk * 0.018)));
    }
    bone = min(bone, sdEllipse(vec2(abs(bq.x) - 0.06, bq.y - 0.17), vec2(0.065, 0.045)));
    float bm = fill(bone, aa / H);
    col = mix(col, vec3(0.93, 0.9, 0.82), bm);
    glow += vec3(0.45, 1.0, 0.6) * bm * 0.12 * uSkin.z;
  } else if (ck == 4) {
    // Mummy: wraps that wind round at alternating slants, frayed edges.
    float band = floor(bq.y * 11.0);
    float slant = mod(band, 2.0) < 0.5 ? 0.35 : -0.3;
    float t = bq.y * 11.0 + slant * bq.x * 3.0 + 0.3 * sin(ang * 3.0 + band);
    float edge = abs(fract(t) - 0.5);
    col *= 0.7 + 0.3 * smoothstep(0.5, 0.36, edge);
    col *= 0.92 + 0.08 * fract(sin(band * 12.9898) * 43758.5);
  } else if (ck == 5 && u > 0.8) {
    // Frankenstein: a jagged black fringe under the flat top.
    if (u > 0.86 - 0.035 * abs(sin(ang * 9.0))) col = vec3(0.06, 0.055, 0.07);
  } else if (ck == 6) {
    // Vampire: slicked hair with a widow's peak.
    float hl = 0.76 + 0.12 * smoothstep(0.0, 1.0, front) - 0.07 * max(0.0, 1.0 - abs(ang) / 0.28);
    col = mix(col, vec3(0.05, 0.04, 0.07), smoothstep(hl - 0.004, hl + 0.004, u));
  }

  // ---------------- face
  if (front > 0.1) {
    float R = uFaceR;
    vec2 f = (q - vec2(0.0, uFaceY * H)) / R;
    vec2 look = vec2(uFace2.w, uFace3.x) * 0.05;
    float aR = aa / R;
    if (ck == 1) {
      // Jack-o'-lantern: carved eyes, nose and a toothy grin, lit from inside.
      float d = 1e3;
      for (int i = 0; i < 2; i++) {
        float sx = i == 0 ? -1.0 : 1.0;
        float open = i == 0 ? uFace.x : uFace.y;
        vec2 e = f - vec2(sx * 0.31, 0.03) - look;
        if (uFace2.y > 0.5) d = min(d, sdStar5(e * vec2(1.0, -1.0), 0.21, 0.5));
        else if (uFace2.x > 0.5) d = min(d, max(abs(length(e + vec2(0.0, 0.12)) - 0.15) - 0.045, -e.y - 0.02));
        else d = min(d, sdTri(vec2(e.x, (e.y + 0.04) / max(open, 0.12)), 0.15) * min(1.0, max(open, 0.12) + 0.3));
      }
      d = min(d, sdTri(vec2(f.x, f.y + 0.17), 0.065));
      vec2 m = f - vec2(0.0, -0.36);
      float w = 0.46;
      float xt = clamp(m.x / w, -1.0, 1.0);
      float top = 0.02 + (0.12 + 0.16 * uFace.w) * xt * xt;
      float bot = top - (0.08 + 0.2 * uFace.z) * (1.0 - xt * xt) - 0.015;
      top -= 0.07 * step(abs(abs(m.x) - 0.15), 0.045);
      bot += 0.06 * step(abs(m.x), 0.05);
      d = min(d, max(max(m.y - top, bot - m.y), abs(m.x) - w));
      float wall = fill(d - 0.03, aR);
      float hole = fill(d, aR);
      vec3 flame = mix(vec3(1.0, 0.45, 0.06), vec3(1.0, 0.86, 0.38), 0.5 + 0.5 * sin(f.y * 6.0 + uSkin.w));
      col = mix(col, col * 0.45, wall);
      col = mix(col, flame * (0.55 + 0.45 * uSkin.z), hole);
      glow += flame * hole * (0.5 + 1.6 * uSkin.z);
      rough = max(rough, hole);
    } else if (ck == 2) {
      // Skull: bone mask and jaw, deep sockets with glowing pupils, teeth.
      float skull = min(sdEllipse(f - vec2(0.0, 0.06), vec2(0.7, 0.6)), sdBox(f - vec2(0.0, -0.42), vec2(0.3, 0.18)) - 0.07);
      col = mix(col, vec3(0.94, 0.91, 0.83), fill(skull, aR));
      for (int i = 0; i < 2; i++) {
        float sx = i == 0 ? -1.0 : 1.0;
        float open = i == 0 ? uFace.x : uFace.y;
        vec2 e = f - vec2(sx * 0.3, 0.04);
        col = mix(col, vec3(0.03, 0.02, 0.04), fill(sdEllipse(e, vec2(0.17, 0.19)), aR));
        vec2 pp = e - look * 1.6;
        float pd = uFace2.y > 0.5 ? sdStar5(pp * vec2(1.0, -1.0), 0.12, 0.5) : sdCircle(pp, uFace2.x > 0.5 ? 0.035 : 0.055);
        float pm = fill(pd, aR) * step(0.3, open);
        vec3 pc = uFace2.y > 0.5 ? vec3(1.0, 0.85, 0.3) : vec3(0.55, 1.0, 0.7);
        col = mix(col, pc, pm);
        glow += pc * pm * (0.6 + 0.8 * uSkin.z);
      }
      col = mix(col, vec3(0.03, 0.02, 0.04), fill(sdTri(vec2(f.x, -(f.y + 0.2)), 0.06), aR));
      vec2 m = f - vec2(0.0, -0.42);
      float gap = 0.015 + 0.16 * uFace.z;
      float teeth = step(abs(m.y), 0.075 + gap * 0.5) * step(abs(m.x), 0.22);
      float lines = step(abs(fract(m.x * 13.0) - 0.5), 0.09) + step(abs(m.y), gap * 0.5);
      col = mix(col, vec3(0.03, 0.02, 0.04), fill(max(abs(m.x) - 0.22, abs(m.y) - 0.075 - gap * 0.5) + 0.0, aR) * clamp(lines, 0.0, 1.0) * teeth);
    } else if (ck == 3) {
      // Ghost: hollow black eyes and a round "oooh".
      for (int i = 0; i < 2; i++) {
        float sx = i == 0 ? -1.0 : 1.0;
        float open = i == 0 ? uFace.x : uFace.y;
        vec2 e = f - vec2(sx * 0.3, 0.02) - look;
        float d;
        if (uFace2.x > 0.5 || open < 0.2) d = max(abs(length(e - vec2(0.0, -0.1)) - 0.12) - 0.035, -e.y);
        else d = sdEllipse(e, vec2(0.12, 0.2 * open));
        col = mix(col, vec3(0.03, 0.03, 0.06), fill(d, aR));
      }
      vec2 m = f - vec2(0.0, -0.36);
      float d = sdEllipse(m, vec2(0.07 + 0.06 * uFace.z, 0.06 + 0.18 * uFace.z));
      col = mix(col, vec3(0.03, 0.03, 0.06), fill(d, aR));
      glow += vec3(0.55, 0.65, 1.0) * 0.08 * (0.5 + uSkin.z);
    } else {
    // Standard face. Costumes tweak eye colour and blush.
    vec3 inkCol = vec3(0.02, 0.015, 0.03);
    vec3 inkGlow = vec3(0.0);
    float blushK = 1.0;
    float shineK = 1.0;
    if (ck == 4) {
      // Mummy: a dark gap in the wraps with glowing eyes inside.
      float slot = sdBox(f - vec2(0.0, 0.0), vec2(0.62, 0.17));
      col = mix(col, vec3(0.025, 0.018, 0.012), fill(slot - 0.04, aR));
            inkCol = vec3(1.0, 0.62, 0.08);
      inkGlow = inkCol * (0.25 + 0.6 * uSkin.z);
      blushK = 0.0;
      shineK = 0.0;
    } else if (ck == 5 || ck == 6) {
      blushK = ck == 6 ? 0.35 : 0.2;
    }
    // blush
    for (int i = 0; i < 2; i++) {
      float sx = i == 0 ? -1.0 : 1.0;
      float bl = sdEllipse(f - vec2(sx * 0.56, -0.2), vec2(0.16, 0.095));
      float bm = (1.0 - smoothstep(-0.03, 0.05, bl)) * uFace2.z * blushK;
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
        shine *= step(0.45, open) * uFace3.w * shineK;
      }
      col = mix(col, inkCol, eyeInk);
      glow += inkGlow * eyeInk;
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
    // Costume touches over the face.
    if (ck == 6 || ck == 10) {
      // Fangs under the top lip.
      for (int i = 0; i < 2; i++) {
        float sx = i == 0 ? -1.0 : 1.0;
        float fd = sdTri(vec2(m.x - sx * 0.075, -(m.y + 0.04)), 0.032);
        col = mix(col, vec3(1.0, 0.99, 0.95), fill(fd, aR));
      }
    } else if (ck == 7) {
      // Cat: pink nose and whiskers.
      col = mix(col, vec3(1.0, 0.5, 0.65), fill(sdTri(vec2(f.x, -(f.y + 0.14)), 0.05) - 0.01, aR));
      for (int i = 0; i < 6; i++) {
        float sx = i < 3 ? -1.0 : 1.0;
        float k = float(i - (i < 3 ? 0 : 3)) - 1.0;
        float wd = sdSeg(f, vec2(sx * 0.42, -0.2 + k * 0.035), vec2(sx * 0.82, -0.17 + k * 0.1)) - 0.011;
        col = mix(col, vec3(0.08, 0.06, 0.1), fill(wd, aR));
      }
    } else if (ck == 9) {
      // Devil: mischievous brows.
      for (int i = 0; i < 2; i++) {
        float sx = i == 0 ? -1.0 : 1.0;
        float bd = sdSeg(f, vec2(sx * 0.17, 0.25), vec2(sx * 0.46, 0.36)) - 0.032;
        col = mix(col, vec3(0.1, 0.03, 0.05), fill(bd, aR));
      }
    } else if (ck == 5) {
      // Frankenstein: stitches across the forehead and one cheek.
      float sd = sdSeg(f, vec2(-0.4, 0.42), vec2(0.3, 0.47)) - 0.014;
      sd = min(sd, max(abs(fract(f.x * 9.0) - 0.5) * 0.11 - 0.012, abs(f.y - 0.445 - 0.07 * f.x) - 0.06));
      sd = max(sd, abs(f.x + 0.05) - 0.36);
      float cd = sdSeg(f, vec2(0.48, -0.08), vec2(0.62, -0.36)) - 0.012;
      col = mix(col, vec3(0.12, 0.16, 0.1), fill(min(sd, cd), aR));
    }
    }
  }
  return col;
}
`;function dt(e){let t=new pe({color:16777215,roughness:.34,metalness:0,clearcoat:+(e.quality===`high`),clearcoatRoughness:.14,sheen:0}),n={uDeform:{value:e.deform.v},uBodyH:{value:e.deform.height},uBase:{value:e.base},uOutA:{value:e.outA},uOutB:{value:e.outB},uGlowCol:{value:e.glow},uStyle:{value:e.face.style.set(e.style.kind,e.style.pattern,e.style.emblem,e.style.beltY)},uSkin:{value:e.face.skin},uFace:{value:e.face.face},uFace2:{value:e.face.face2},uFace3:{value:e.face.face3},uFaceY:{value:e.faceY},uFaceR:{value:e.faceR}};return t.onBeforeCompile=e=>{Object.assign(e.uniforms,n),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>\n${ct}\n${lt}`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
objectNormal = wpDeformNormal(objectNormal, position);`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vObj = position;
transformed = wpDeform(position);`),e.fragmentShader=e.fragmentShader.replace(`#include <common>`,`#include <common>\n${ct}\n${ut}\nfloat wpRough; vec3 wpGlow;`).replace(`#include <color_fragment>`,`#include <color_fragment>
diffuseColor.rgb = wobbleSurface(uBase, wpRough, wpGlow);`).replace(`#include <roughnessmap_fragment>`,`#include <roughnessmap_fragment>
roughnessFactor = mix(roughnessFactor, 0.08, wpRough);`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
totalEmissiveRadiance += wpGlow;`)},t.customProgramCacheKey=()=>`wobbler-body-`+e.quality,t}function ft(e,t,n){let r=e.clone();r.color=e.color;let i={uDeform:{value:t.v},uBodyH:{value:t.height}};return r.onBeforeCompile=e=>{Object.assign(e.uniforms,i),e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>\n${ct}\n${lt}`).replace(`#include <beginnormal_vertex>`,`#include <beginnormal_vertex>
objectNormal = wpDeformNormal(objectNormal, position);`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
vObj = position;
transformed = wpDeform(position);`)},r.customProgramCacheKey=()=>`wobbler-conform-`+n,r}function pt(e,t,n=.32){return new pe({color:e,roughness:n,clearcoat:+(t===`high`),clearcoatRoughness:.15})}var mt=function(e){return e[e.None=0]=`None`,e[e.Pumpkin=1]=`Pumpkin`,e[e.Skeleton=2]=`Skeleton`,e[e.Ghost=3]=`Ghost`,e[e.Mummy=4]=`Mummy`,e[e.Frank=5]=`Frank`,e[e.Vampire=6]=`Vampire`,e[e.Cat=7]=`Cat`,e[e.Witch=8]=`Witch`,e[e.Devil=9]=`Devil`,e[e.Bat=10]=`Bat`,e}({}),H=e=>new T(e),U={kind:0,pattern:V.Solid,emblem:B.None,beltY:.3},ht=[`#ff7b1c`,`#ff8a2a`,`#f26a10`,`#ff9933`];function gt(e,t){let n=new F(e*7919+1031),r=n.weighted([[1,2.2],[8,2],[2,1.6],[3,1.5],[9,1.5],[7,1.5],[6,1.3],[10,1.3],[4,1],[5,1]]),i=()=>({...t.outfit,emblem:n.weighted([[B.Bat,2],[B.Skull,1],[B.Pumpkin,1.5],[B.None,1.5]])});switch(r){case 1:return{kind:r,accessories:[`stem`],body:H(n.pick(ht)),acc:H(`#4f6b25`),trim:H(`#3f8a3a`),outfit:U};case 2:return{kind:r,accessories:[],body:H(`#1d1925`),acc:H(`#ece4d0`),outfit:U};case 3:return{kind:r,accessories:[`ghostHem`],body:H(`#f2f1fb`),acc:H(`#f2f1fb`),outfit:U};case 4:return{kind:r,accessories:[],body:H(`#e5d8b8`),outfit:U};case 5:return{kind:r,accessories:[`flatTop`,`neckBolts`],body:H(`#86b86a`),outA:H(`#3b3447`),outB:H(`#23202b`),acc:H(`#16141c`),trim:H(`#9aa1ab`),outfit:{kind:2,pattern:V.Solid,emblem:B.None,beltY:.3}};case 6:return{kind:r,accessories:[`capeCollar`,`cape`],body:H(`#ebe4f2`),outA:H(`#16121d`),outB:H(`#b3122e`),acc:H(`#16121d`),trim:H(`#b3122e`),outfit:{kind:2,pattern:V.Solid,emblem:n.chance(.5)?B.Bat:B.None,beltY:.3}};case 7:return{kind:r,accessories:n.chance(.4)?[`catEars`,`bow`]:[`catEars`],acc:t.body,trim:H(`#ff8fb1`),outfit:i()};case 8:return{kind:r,accessories:[`witchHat`],acc:H(`#1e1629`),trim:typeof t.accColor==`number`?t.accColor:3,outfit:i()};case 9:return{kind:r,accessories:[`horns`,`devilTail`],acc:H(`#d42033`),outfit:i()};default:return{kind:10,accessories:[`batEars`,`batWings`],acc:H(`#241c2e`),trim:H(`#ff8fb1`),outfit:i()}}}function _t(){return{kind:6,accessories:[`headphones`,`capeCollar`,`cape`],body:H(`#efe6f0`),outA:H(`#18121f`),outB:H(`#c0162f`),acc:H(`#16121d`),trim:H(`#c0162f`),outfit:{kind:2,pattern:V.Solid,emblem:B.Bat,beltY:.3}}}function vt(){return[{kind:7,accessories:[`catEars`,`bow`],acc:H(`#ff4f86`),trim:H(`#ffd0de`)},{kind:5,accessories:[`flatTop`,`neckBolts`],body:H(`#7fc28a`),outA:H(`#1f6f8b`),outB:H(`#ffcf3f`),acc:H(`#16141c`),trim:H(`#9aa1ab`),outfit:{kind:2,pattern:V.Solid,emblem:B.Bolt,beltY:.3}},{kind:1,accessories:[`stem`,`starGlasses`],body:H(`#ff8a1f`),acc:H(`#4f6b25`),trim:H(`#3f8a3a`),outfit:U},{kind:2,accessories:[],body:H(`#211a2e`),acc:H(`#ece4d0`),outfit:U},{kind:4,accessories:[],body:H(`#e8dcbd`),outfit:U}]}var yt=[[`cap`],[`capBack`],[`bow`],[`tuft`],[`mohawk`],[`beanie`],[`headband`],[`antenna`],[`pompadour`],[`bun`],[`crown`],[],[],[`tuft`,`roundGlasses`],[`headband`,`starGlasses`],[`cap`,`roundGlasses`],[`bow`],[`tuft`]];function bt(e){let t=new F(e*9973+17),n=t.int(10),r=t.weighted([[1,3],[2,2],[3,2],[4,1],[0,1]]),i={shape:{height:t.range(.88,1.12),width:t.range(.92,1.12),pear:t.range(.18,.42),boxy:t.range(2,2.5)},body:n,outA:(n+1+t.int(9))%10,outB:10+t.int(10),jitter:t.range(-1,1),outfit:{kind:r,pattern:t.weighted([[V.Solid,4],[V.Stripes,2],[V.Dots,1.5],[V.Checker,1],[V.Zigzag,1]]),emblem:t.weighted([[B.None,3],[B.Heart,1.2],[B.Star,1.2],[B.Bolt,1.2],[B.Note,1.2],[B.W,.8],[B.Skull,.8],[B.Ring,.6]]),beltY:t.range(.28,.34)},accessories:t.pick(yt),accColor:t.chance(.5)?(n+3)%10:10+t.int(10),trim:10+t.int(10),personality:xt(t),scale:t.range(.9,1.08)};return i.costume=gt(e,i),i}function xt(e){return{energy:e.range(.65,1.3),lag:e.range(-.04,.06),bounce:e.range(.3,1),sway:e.range(.2,1),arms:e.range(.2,1),jumpy:e.range(.1,1),shimmy:e.range(0,1),singer:e.range(.3,1),showoff:e.range(.05,.4)}}var W=e=>new T(e);function St(){return{shape:{height:1.05,width:1.08,pear:.28,boxy:2.3},body:W(`#f3cf8e`),outA:W(`#4b2a8c`),outB:W(`#18152a`),jitter:0,outfit:{kind:2,pattern:V.Solid,emblem:B.W,beltY:.3},accessories:[`cap`,`headphones`],accColor:W(`#1b1830`),trim:W(`#2ec4c6`),personality:{energy:1.1,lag:0,bounce:.9,sway:.5,arms:1,jumpy:.4,shimmy:.5,singer:.8,showoff:.3},scale:1.55,costume:_t()}}function Ct(){let e=vt(),t=[{shape:{height:1,width:1.05,pear:.34,boxy:2.2},body:W(`#ff4f86`),outA:W(`#e0336b`),outB:W(`#ffd166`),jitter:0,outfit:{kind:3,pattern:V.Solid,emblem:B.Heart,beltY:.36},accessories:[`bow`],accColor:W(`#ff2d6f`),trim:W(`#ffffff`),personality:{energy:1.15,lag:.02,bounce:1,sway:.8,arms:.9,jumpy:.6,shimmy:.8,singer:1,showoff:.35},scale:1.12},{shape:{height:1.08,width:1,pear:.26,boxy:2.4},body:W(`#2ec4c6`),outA:W(`#1f6f8b`),outB:W(`#ffcf3f`),jitter:0,outfit:{kind:2,pattern:V.Solid,emblem:B.Bolt,beltY:.3},accessories:[`pompadour`],accColor:W(`#7b4dff`),trim:W(`#ffffff`),personality:{energy:1.3,lag:-.01,bounce:.9,sway:.5,arms:1,jumpy:1,shimmy:.6,singer:.9,showoff:.45},scale:1.15},{shape:{height:.98,width:1.1,pear:.3,boxy:2.2},body:W(`#ffc93c`),outA:W(`#ff8a3d`),outB:W(`#ffe8a3`),jitter:0,outfit:{kind:3,pattern:V.Solid,emblem:B.Star,beltY:.38},accessories:[`starGlasses`],accColor:W(`#1b2d8f`),trim:W(`#ffffff`),personality:{energy:1.25,lag:.03,bounce:1,sway:.7,arms:1,jumpy:.8,shimmy:1,singer:.8,showoff:.5},scale:1.1},{shape:{height:1.04,width:1.02,pear:.3,boxy:2.3},body:W(`#9b6bff`),outA:W(`#7a4fe0`),outB:W(`#f2f2f2`),jitter:0,outfit:{kind:2,pattern:V.Solid,emblem:B.Skull,beltY:.3},accessories:[`tuft`],accColor:W(`#5b2fc9`),trim:W(`#ffffff`),personality:{energy:1,lag:0,bounce:.8,sway:.9,arms:.8,jumpy:.5,shimmy:.4,singer:.9,showoff:.3},scale:1.08},{shape:{height:.96,width:1.08,pear:.36,boxy:2.1},body:W(`#b8f2e6`),outA:W(`#3a86ff`),outB:W(`#effff9`),jitter:0,outfit:{kind:1,pattern:V.Stripes,emblem:B.None,beltY:.33},accessories:[`headband`],accColor:W(`#52d273`),trim:W(`#ffffff`),personality:{energy:1,lag:.02,bounce:.9,sway:.8,arms:.7,jumpy:.5,shimmy:.5,singer:.7,showoff:.25},scale:1.05}];return t.forEach((t,n)=>t.costume=e[n]),t}var wt=new Map;function G(e,t){let n=wt.get(e);return n||(n=t(),wt.set(e,n)),n}function Tt(e,t,n,r,i=48){let a=[],o=e.height;for(let i=0;i<=24;i++){let s=i/24,c=t+(n-t)*(n>=1?Math.sin(s*Math.PI/2):s),l=c>=.999?0:z(e,c)+r,u=c*o+(c>=.999?r:r*.6*s);a.push(new y(l,u))}if(n<1)for(let r=24;r>=0;r-=24){let i=r/24,s=t+(n-t)*i;a.push(new y(z(e,s)-.004,s*o))}else a.unshift(new y(z(e,t)-.004,t*o));let s=new te(a,i,Math.PI,Math.PI*2);return s.computeVertexNormals(),s}function Et(e,t){let n=new j;for(let r=0;r<10;r++){let i=Math.PI/2+r*Math.PI/5,a=r%2==0?e:e*t,o=Math.cos(i)*a,s=Math.sin(i)*a;r===0?n.moveTo(o,s):n.lineTo(o,s)}return n.closePath(),n}function Dt(e,t,n,r,i,a,o){let s=[];for(let i=0;i<=20;i++){let a=t+(n-t)*i/20,o=r*(1+1.6*(1-i/20));s.push(new y(z(e,a)+o,a*e.height))}let c=new te(s,o,i,a);return c.computeVertexNormals(),c}function Ot(e,t){let n=.32,r=z(e,n)+.012,i=new A(r,r+.07,n*e.height+.02,t,3,!0),a=i.attributes.position,o=(n*e.height+.02)/2;for(let e=0;e<a.count;e++){let t=a.getX(e),n=a.getZ(e),r=a.getY(e),i=(o-r)/(2*o);a.setY(e,r+o-.02+Math.sin(Math.atan2(t,n)*7)*.035*i*i)}return i.computeVertexNormals(),i}function kt(){let e=new j;return e.moveTo(0,.1),e.quadraticCurveTo(.18,.22,.42,.2),e.lineTo(.5,.26),e.quadraticCurveTo(.5,.05,.44,-.06),e.quadraticCurveTo(.38,0,.32,-.02),e.quadraticCurveTo(.25,-.1,.2,-.08),e.quadraticCurveTo(.14,-.02,.08,-.06),e.quadraticCurveTo(.04,-.02,0,-.06),e.closePath(),e}function At(e,t){let n=new j;return n.moveTo(-e/2,0),n.quadraticCurveTo(-e*.3,t*.6,0,t),n.quadraticCurveTo(e*.3,t*.6,e/2,0),n.closePath(),n}function jt(i,a){let o=[],s=[],{shape:c,color:l,dark:u,trim:d}=a,p=c.height,m=a.quality===`high`?48:24,h=(e,t)=>new E(e,t),g=(e,t,n,r)=>{let i=h(Tt(c,e,t,n,m),a.conform(r));return i.frustumCulled=!1,a.addShell(i),i},_=e=>z(c,e);for(let v of i)switch(v){case`cap`:case`capBack`:{g(.74,1,.022,l);let e=v===`cap`?0:Math.PI,t=a.anchor(.75,e,.01),n=h(G(`capBrim`,()=>new A(1,1,1,40,1,!1,-Math.PI/2,Math.PI)),d);n.scale.set(_(.75)*.95,.024,.2),n.rotation.x=.12,n.position.set(0,0,.02),t.add(n);let i=a.anchor(1,0,.02),o=h(G(`btn`,()=>new r(1,12,8)),u);o.scale.set(.04,.025,.04),i.add(o);break}case`headphones`:{let e=a.anchor(1,0,0),n=.7,r=_(n)+.05,i=.30000000000000004*p,s=h(G(`hpBand`,()=>new t(1,.045,10,48,Math.PI)),u);s.scale.set(r,i+.05,1),s.position.y=-i,e.add(s);for(let e of[-1,1]){let r=a.anchor(n,e*Math.PI/2,.035),i=h(G(`hpCup`,()=>new A(1,1,1,28)),u);i.scale.set(.13,.08,.13),i.rotation.x=Math.PI/2,r.add(i);let s=new k({color:1118481,emissive:16777215,emissiveIntensity:1,roughness:.4});o.push(s);let c=h(G(`hpRing`,()=>new t(1,.16,8,28)),s);c.scale.setScalar(.1),c.position.z=.042,r.add(c)}break}case`bow`:{let e=a.anchor(.9,.55,.02);for(let t of[-1,1]){let n=h(G(`bowLobe`,()=>new r(1,20,14)),l);n.scale.set(.12,.085,.055),n.position.set(t*.1,0,0),n.rotation.z=t*.4,e.add(n)}let t=h(G(`bowKnot`,()=>new r(1,14,10)),l);t.scale.set(.05,.055,.045),e.add(t),e.children.forEach(e=>e.rotation.x-=.3);break}case`tuft`:{let e=a.anchor(1,0,-.01);for(let t=0;t<3;t++){let n=h(G(`tuft`,()=>new D(1,1,12)),l);n.scale.set(.045,.17,.045),n.position.set((t-1)*.04,.07,0),n.rotation.z=(1-t)*.5,n.rotation.x=-.2,e.add(n)}break}case`mohawk`:for(let e=0;e<5;e++){let t=e/4,n=t<.5?0:Math.PI,r=t<.5?.86+t*.28:1-(t-.5)*.28,i=a.anchor(r,n,-.01),o=h(G(`mohawk`,()=>new D(1,1,10)),l);o.scale.set(.035,.15-Math.abs(t-.5)*.08,.06),o.position.y=.05,i.add(o)}break;case`beanie`:{g(.7,1,.03,l),g(.68,.76,.045,l);let e=a.anchor(1,0,.03),t=h(G(`pom`,()=>new n(1,2)),u);t.scale.setScalar(.075),t.position.y=.05,e.add(t);break}case`headband`:g(.8,.86,.022,l);break;case`antenna`:{let e=a.anchor(1,0,0),t=h(G(`stalk`,()=>new A(.012,.016,.22,8)),u);t.position.y=.1;let n=h(G(`ball`,()=>new r(1,16,12)),l);n.scale.setScalar(.05),n.position.y=.22,e.add(t,n);break}case`crown`:{let e=a.anchor(1,0,0),t=new pe({color:16762941,metalness:1,roughness:.25,emissive:3810304}),n=h(G(`crownRing`,()=>new A(1,1,1,24,1,!0)),t),r=_(.95)*.9;n.scale.set(r,.06,r),n.position.y=-.02,e.add(n);for(let n=0;n<6;n++){let i=n/6*Math.PI*2,a=h(G(`crownSpike`,()=>new D(1,1,8)),t);a.scale.set(.035,.09,.035),a.position.set(Math.sin(i)*r,.05,Math.cos(i)*r),e.add(a)}e.rotation.z=.12;break}case`pompadour`:{g(.82,1,.025,l);let e=a.anchor(.9,0,0),t=h(G(`quiff`,()=>new r(1,28,18)),l);t.scale.set(_(.88)*.95,.13,.2),t.position.set(0,.1,.04),t.rotation.x=-.75,e.add(t);let n=h(G(`quiff`,()=>new r(1,28,18)),l);n.scale.set(_(.88)*.7,.09,.14),n.position.set(0,.17,-.02),n.rotation.x=-.25,e.add(n);break}case`bun`:{let e=a.anchor(1,0,-.02),t=h(G(`bun`,()=>new r(1,20,14)),l);t.scale.set(.11,.1,.11),t.position.y=.06,e.add(t);break}case`witchHat`:{let e=a.anchor(1,0,0),n=new f;n.position.y=-.07,n.rotation.set(-.08,0,.1),e.add(n);let r=_(.85),i=h(G(`witchBrim`,()=>new A(1,1,1,40)),l);i.scale.set(r*2.05,.02,r*2.05),n.add(i);let o=[[.27,.17,.2,0],[.17,.09,.17,-.35],[.09,.012,.16,-.75]],s=n;for(let[e,t,n,r]of o){let i=new f;i.rotation.x=r,s.add(i);let a=h(new A(t,e,n,24),l);a.position.y=n/2,i.add(a);let o=new f;o.position.y=n,i.add(o),s=o}let c=h(G(`witchBand`,()=>new A(1,1,1,24,1,!0)),d);c.scale.set(.258,.06,.258),c.position.y=.04,n.add(c);let u=h(G(`witchBuckle`,()=>new t(1,.25,6,4)),new k({color:16762941,metalness:1,roughness:.3}));u.scale.setScalar(.035),u.rotation.z=Math.PI/4,u.position.set(0,.04,.262),n.add(u);break}case`horns`:for(let e of[-1,1]){let t=a.anchor(.93,e*.55,-.02),n=h(G(`hornBase`,()=>new D(1,1,14)),l);n.scale.set(.05,.12,.05),n.position.set(e*.02,.05,0),n.rotation.z=-e*.45,t.add(n);let r=h(G(`hornBase`,()=>new D(1,1,14)),l);r.scale.set(.03,.08,.03),r.position.set(e*.06,.14,0),r.rotation.z=e*.25,t.add(r)}break;case`devilTail`:{let e=a.anchor(.2,Math.PI,0),t=new f;e.add(t);let n=new de([new b(0,0,0),new b(0,-.05,.12),new b(.05,.05,.24),new b(.02,.2,.3),new b(-.04,.3,.27)]);t.add(h(G(`tail`,()=>new ue(n,24,.017,6)),l));let r=h(G(`spade`,()=>new D(1,1,4)),l);r.scale.set(.06,.09,.02),r.position.set(-.05,.34,.26),r.rotation.z=.3,t.add(r),s.push((e,n)=>{t.rotation.y=.35*Math.sin(e*Math.PI*2)*(.4+n),t.rotation.x=.1*Math.sin(e*Math.PI*4)});break}case`catEars`:case`batEars`:{let[t,n]=v===`batEars`?[.15,.24]:[.17,.17];for(let r of[-1,1]){let i=a.anchor(.9,r*.6,-.01),o=h(G(`ear${v}`,()=>new e(At(t,n),{depth:.03,bevelEnabled:!0,bevelSize:.012,bevelThickness:.01,bevelSegments:2})),l);o.position.z=-.015,o.rotation.z=-r*.15,i.add(o);let s=h(G(`earIn${v}`,()=>new re(At(t*.55,n*.7))),d);s.position.set(0,.015,.03),s.rotation.z=-r*.15,i.add(s)}break}case`batWings`:{let e=a.anchor(.52,Math.PI,0),t=l.clone();t.side=2,t.color=l.color;let n=[];for(let r of[-1,1]){let i=new f;i.position.x=r*.04,e.add(i);let a=h(G(`batWing`,()=>new re(kt(),6)),t);a.scale.set(r*1.25,1.25,1),i.add(a),n.push(i)}s.push((e,t)=>{let r=Math.sin(e*Math.PI*(t>.5?4:2)),i=.55+(.2+.35*t)*r;n[0].rotation.y=i,n[1].rotation.y=-i});break}case`ghostHem`:{let e=h(Ot(c,m),a.conform(l));e.material.side=2,e.frustumCulled=!1,a.addShell(e);break}case`stem`:{let e=a.anchor(1,0,-.02),t=new de([new b(0,0,0),new b(.01,.07,0),new b(.05,.12,.01),new b(.09,.13,.02)]);e.add(h(G(`stem`,()=>new ue(t,12,.032,8)),l));let n=h(G(`leaf`,()=>new r(1,12,8)),d);n.scale.set(.09,.012,.055),n.position.set(-.07,.04,.02),n.rotation.z=.35,e.add(n);break}case`flatTop`:{g(.83,1,.025,l);let e=a.anchor(1,0,0),t=_(.9)*2,n=h(G(`flatTop`,()=>new O(1,1,1)),l);n.scale.set(t*.72,.1,t*.66),n.position.y=-.035,e.add(n);break}case`neckBolts`:for(let e of[-1,1]){let t=a.anchor(.47,e*Math.PI/2,0),n=h(G(`bolt`,()=>new A(.022,.022,.09,10)),d);n.rotation.x=Math.PI/2,n.position.z=.03;let r=h(G(`nut`,()=>new A(.04,.04,.03,6)),d);r.rotation.x=Math.PI/2,r.position.z=.075,t.add(n,r)}break;case`capeCollar`:{let e=a.anchor(.47,0,-_(.47)),t=_(.47)+.035,n=h(G(`collar${t.toFixed(3)}`,()=>new A(t*1.45,t,.34,32,1,!0,Math.PI-.62*Math.PI,1.24*Math.PI)),l);n.position.y=.17;let r=d.clone();r.color=d.color,r.side=1;let i=new E(n.geometry,r);i.position.copy(n.position),i.scale.setScalar(.985),e.add(n,i);break}case`cape`:{let e=Dt(c,.05,.5,.03,Math.PI-.58*Math.PI,1.16*Math.PI,m),t=h(e,a.conform(l)),n=a.conform(d);n.side=1;let r=h(e,n);for(let e of[t,r])e.frustumCulled=!1,a.addShell(e);break}case`starGlasses`:case`roundGlasses`:{let n=a.anchor(.64,0,.03),r=v===`starGlasses`?l:u,i=new pe({color:v===`starGlasses`?2768064:1118498,roughness:.05,clearcoat:1,transparent:!0,opacity:.88}),o=.123;for(let a of[-1,1])if(v===`starGlasses`){let t=h(G(`starFrame`,()=>new e(Et(.13,.5),{depth:.02,bevelEnabled:!0,bevelSize:.012,bevelThickness:.01,bevelSegments:2})),r);t.position.set(a*o,0,-.01),t.rotation.y=a*.28;let s=h(G(`starLens`,()=>new re(Et(.095,.5))),i);s.position.set(a*o,0,.024),s.rotation.y=a*.28,n.add(t,s)}else{let e=h(G(`rim`,()=>new t(.085,.013,8,28)),r);e.position.set(a*o,0,0),e.rotation.y=a*.28;let s=h(G(`rimLens`,()=>new be(.082,28)),i);s.position.set(a*o,0,.002),s.rotation.y=a*.28,n.add(e,s)}let s=h(G(`bridge`,()=>new A(.01,.01,.07,6)),r);s.rotation.z=Math.PI/2,s.position.set(0,.015,.012),n.add(s);break}}return{glowMats:o,animate:s}}var K=class{x;spec;v=0;target=0;constructor(e,t){this.x=e,this.spec=t,this.target=e}step(e,t=0){let n=2*Math.PI*this.spec.hz,r=-n*n*(this.x-this.target)-2*this.spec.zeta*n*this.v+t;this.v+=r*e,this.x+=this.v*e}},Mt=16,Nt=class{rollRadius;tiltX;tiltZ;bendX=new K(0,{hz:2.6,zeta:.22});bendZ=new K(0,{hz:2.6,zeta:.22});stretch=new K(1,{hz:3.8,zeta:.28});twist=new K(0,{hz:5,zeta:.35});yaw=new K(0,{hz:1.6,zeta:.75});y=0;vy=0;airborne=!1;sinceLand=10;tqX=0;tqZ=0;stretchF=0;twistF=0;onLand=null;constructor(e,t=1){this.rollRadius=e;let n=1.55/Math.sqrt(e/.4);this.tiltX=new K(0,{hz:n,zeta:.16/t}),this.tiltZ=new K(0,{hz:n,zeta:.16/t})}torque(e,t){this.tqX+=e,this.tqZ+=t}kick(e,t){this.tiltX.v+=e,this.tiltZ.v+=t}squashKick(e){this.stretch.v+=e}stretchForce(e){this.stretchF+=e}twistForce(e){this.twistF+=e}hop(e){if(this.airborne){this.vy=Math.max(this.vy,e*.6);return}this.airborne=!0,this.vy=e,this.stretch.v+=e*1.2}static hopSpeed(e){return Mt*e/2}step(e){let t=Math.max(1,Math.ceil(e/(1/240))),n=e/t;for(let e=0;e<t;e++)this.substep(n);this.tqX=this.tqZ=this.stretchF=this.twistF=0}substep(e){let t=this.tiltX.v,n=this.tiltZ.v,r=this.airborne?.25:1;this.tiltX.step(e,this.tqX),this.tiltZ.step(e,this.tqZ),r<1&&(this.tiltX.v=t+(this.tiltX.v-t)*r,this.tiltZ.v=n+(this.tiltZ.v-n)*r);let i=.75;Math.abs(this.tiltX.x)>i&&(this.tiltX.x=Math.sign(this.tiltX.x)*i,this.tiltX.v*=-.3),Math.abs(this.tiltZ.x)>i&&(this.tiltZ.x=Math.sign(this.tiltZ.x)*i,this.tiltZ.v*=-.3);let a=(this.tiltX.v-t)/e,o=(this.tiltZ.v-n)/e;if(this.bendX.step(e,o*.022),this.bendZ.step(e,-a*.022),this.stretch.step(e,this.stretchF),this.twist.step(e,this.twistF),this.yaw.step(e),this.stretch.x<.55&&(this.stretch.x=.55,this.stretch.v=Math.max(0,this.stretch.v)),this.airborne&&(this.vy-=Mt*e,this.y+=this.vy*e,this.y<=0)){let e=-this.vy;this.y=0,this.vy=0,this.airborne=!1,this.sinceLand=0,this.stretch.v-=e*1.6,this.onLand?.(e)}this.sinceLand+=e}},Pt={hz:3.6,zeta:.42},Ft=class{side;shoulder=new ce;elbowJ=new ce;hand;raise=new K(.5,Pt);fwd=new K(.1,Pt);inward=new K(0,Pt);elbow=new K(.35,{hz:4.5,zeta:.38});add={raise:0,fwd:0,inward:0,elbow:0};constructor(e,t,n,r){this.side=e;let i=r===`high`?12:8,a=new E(Lt(`upper`,.058*n,.16,i),t);a.position.y=-.08,this.shoulder.add(a),this.elbowJ.position.y=-.16,this.shoulder.add(this.elbowJ);let o=new E(Lt(`fore`,.052*n,.13,i),t);o.position.y=-.065,this.elbowJ.add(o),this.hand=new E(Lt(`hand`,.075*n,0,i),t),this.hand.scale.set(1,1.1,.85),this.hand.position.y=-.15,this.elbowJ.add(this.hand)}target(e){e.raise!==void 0&&(this.raise.target=e.raise),e.fwd!==void 0&&(this.fwd.target=e.fwd),e.inward!==void 0&&(this.inward.target=e.inward),e.elbow!==void 0&&(this.elbow.target=e.elbow)}update(e){for(let t of[this.raise,this.fwd,this.inward,this.elbow])t.step(e);let t=this.raise.x+this.add.raise,n=this.fwd.x+this.add.fwd,r=this.inward.x+this.add.inward,i=this.elbow.x+this.add.elbow;this.shoulder.rotation.set(-n,-this.side*r,this.side*t,`YZX`),this.elbowJ.rotation.set(-Math.max(0,i),0,0),this.add.raise=this.add.fwd=this.add.inward=this.add.elbow=0}},It=new Map;function Lt(e,t,n,i){let a=`${e}:${t.toFixed(3)}:${n}:${i}`,o=It.get(a);return o||(o=n>0?new ae(t,n,4,i):new r(t,i+4,i),It.set(a,o)),o}var Rt=null;function zt(){if(Rt)return Rt;let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(64,64,0,64,64,64);return n.addColorStop(0,`rgba(0,0,0,0.85)`),n.addColorStop(.45,`rgba(0,0,0,0.5)`),n.addColorStop(1,`rgba(0,0,0,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),Rt=new _e(e),Rt}var Bt=class{look;root=new f;tilt=new f;lower=new f;spin=new f;anchors=[];dress={};skinId=`classic`;beatPhase=0;dancing=0;costumeGlow=.4;clock=0;palette=null;accCtx;shadow;body;rig;deform;faceParams=new st;arms;expr={mouth:0,smile:.6,happy:!1,star:!1,blush:.55,lookX:0,lookY:0,closed:!1,wink:0,glowBelt:0,glowEmblem:0};colBody=new T;colOutA=new T;colOutB=new T;colAcc=new T;colTrim=new T;colGlow=new T;get glowMats(){return this.dress[this.skinId]?.parts.glowMats??[]}home=new b;offset=new y;height;rollR;rng;blinkT=0;blinkDur=0;nextBlink;eyeL=1;eyeR=1;mouth=0;shoulderRest;tmp=new b;faceY;faceR;qa=new we;qb=new we;eul=new i;constructor(e,t,n){this.look=e,this.rng=new F(t);let r=e.shape;this.height=r.height*1,this.deform=new at(this.height),this.rollR=z(r,.3)*.95,this.rig=new Nt(this.rollR*e.scale,.9+.3*e.personality.energy),this.nextBlink=this.rng.range(.5,4),this.faceY=.64,this.faceR=z(r,this.faceY);let i=dt({base:this.colBody,outA:this.colOutA,outB:this.colOutB,glow:this.colGlow,style:e.outfit,deform:this.deform,face:this.faceParams,faceY:this.faceY,faceR:this.faceR,quality:n});this.body=new E(it(r,n===`high`?56:32),i),this.body.frustumCulled=!1;let a=pt(this.colBody,n);a.color=this.colBody,this.arms=[new Ft(-1,a,r.width,n),new Ft(1,a,r.width,n)];let o=.5,s=z(r,o),c=1.32;this.shoulderRest=[-1,1].map(e=>new b(e*s*Math.sin(c)*.96,o*this.height,s*Math.cos(c)));let l=pt(this.colAcc,n,.3);l.color=this.colAcc;let u=pt(new T(1512735),n,.35),d=pt(this.colTrim,n,.3);d.color=this.colTrim,this.spin.add(this.body,...this.arms.map(e=>e.shoulder)),this.accCtx={shape:{...r,height:this.height},color:l,dark:u,trim:d,quality:n,conform:e=>ft(e,this.deform,n)},this.setStyle(),this.wear(`classic`),this.lower.add(this.spin),this.tilt.add(this.lower),this.root.add(this.tilt),this.lower.position.y=-this.rollR,this.root.scale.setScalar(e.scale),this.shadow=new E(Ut(),new w({map:zt(),transparent:!0,depthWrite:!1,opacity:.8})),this.shadow.rotation.x=-Math.PI/2,this.shadow.renderOrder=1}wear(e){if(!this.dress[e]){let t=new f,n=jt(e===`spooky`&&this.look.costume?this.look.costume.accessories:this.look.accessories,{...this.accCtx,addShell:e=>t.add(e),anchor:(e,n,r=0)=>{let i=new f;return this.anchors.push({obj:i,u:e,ang:n,out:r,dress:t}),t.add(i),i}});this.dress[e]={group:t,parts:n},this.spin.add(t)}for(let[t,n]of Object.entries(this.dress))n.group.visible=t===e}setSkin(e){e!==this.skinId&&(this.skinId=e,this.wear(e),this.setStyle(),this.palette&&this.applyPalette(this.palette))}get costume(){return this.skinId===`spooky`?this.look.costume:void 0}setStyle(){let e=this.costume?.outfit??this.look.outfit;this.faceParams.style.set(e.kind,e.pattern,e.emblem,e.beltY),this.faceParams.skin.set(this.costume?.kind??0,0,0,this.rng.range(0,6.28))}applyPalette(e){this.palette=e;let t=this.costume,n=(t,n)=>{if(typeof t!=`number`)return n.copy(t);let r=t<10?e.crowd[t]:e.outfit[t-10];return n.copy(r),this.look.jitter&&n.offsetHSL(this.look.jitter*.02,0,this.look.jitter*.05),n};n(t?.body??this.look.body,this.colBody),n(t?.outA??this.look.outA,this.colOutA),n(t?.outB??this.look.outB,this.colOutB),n(t?.acc??this.look.accColor,this.colAcc),n(t?.trim??this.look.trim,this.colTrim),this.colGlow.copy(e.lights[Math.abs(Math.floor(this.look.jitter*97))%e.lights.length])}placeAt(e,t,n){this.home.set(e,0,t),this.rig.yaw.x=this.rig.yaw.target=n}update(e){let t=this.rig;t.step(e);let n=this.rollR*this.look.scale,r=-n*t.tiltZ.x,i=n*t.tiltX.x;this.root.position.set(this.home.x+this.offset.x+r,this.home.y+n+t.y,this.home.z+this.offset.y+i),this.tilt.rotation.set(t.tiltX.x,0,t.tiltZ.x),this.spin.rotation.y=t.yaw.x;let a=Math.cos(-t.yaw.x),o=Math.sin(-t.yaw.x),s=t.bendX.x,c=t.bendZ.x;this.deform.v.set(t.stretch.x,a*s-o*c,o*s+a*c,t.twist.x);let l=1/Math.sqrt(Math.max(t.stretch.x,.2));for(let e of this.anchors){if(!e.dress.visible)continue;let n=e.u>=.995,r=n?0:z(this.look.shape,e.u)+e.out;this.tmp.set(Math.sin(e.ang)*r,e.u*this.height+(n?e.out:0),Math.cos(e.ang)*r),this.deform.apply(this.tmp,e.obj.position);let i=this.deform.slope(Math.min(e.u,1));this.qa.setFromEuler(this.eul.set(i.ax,0,i.az)),this.qb.setFromAxisAngle(Vt,e.ang+t.twist.x*e.u),e.obj.quaternion.multiplyQuaternions(this.qa,this.qb),e.obj.scale.set(l,t.stretch.x,l)}this.arms.forEach((t,n)=>{this.deform.apply(this.shoulderRest[n],t.shoulder.position),t.update(e)});let u=t.y,d=.95*this.look.shape.width*this.look.scale/(1+u*1.2);this.shadow.position.set(this.root.position.x,this.home.y+.012,this.root.position.z),this.shadow.scale.set(d,d,1),this.shadow.material.opacity=.75/(1+u*2.5);for(let e of this.dress[this.skinId].parts.animate)e(this.beatPhase,this.dancing);this.updateFace(e)}updateFace(e){let t=this.expr;this.nextBlink-=e,this.nextBlink<=0&&this.blinkT<=0&&(this.blinkDur=this.rng.range(.1,.16),this.blinkT=this.blinkDur,this.nextBlink=this.rng.range(1.8,5.5));let n=1;if(this.blinkT>0){this.blinkT-=e;let t=1-this.blinkT/this.blinkDur;n=Math.abs(Math.cos(Math.PI*t))}let r=+!t.closed,i=Math.min(n,r,t.wink===-1?0:1),a=Math.min(n,r,t.wink===1?0:1);this.eyeL=L(this.eyeL,i,30,e),this.eyeR=L(this.eyeR,a,30,e),this.mouth=L(this.mouth,t.mouth,t.mouth>this.mouth?40:22,e);let o=this.faceParams;o.face.set(this.eyeL,this.eyeR,I(this.mouth),t.smile),o.face2.set(+!!t.happy,+!!t.star,t.blush,t.lookX),o.face3.set(t.lookY,t.glowBelt,t.glowEmblem,1),this.clock+=e;let s=this.clock+o.skin.w;o.skin.z=this.costumeGlow*(.88+.12*Math.sin(s*23)*Math.sin(s*7.3+1))}dispose(){this.body.geometry.dispose()}},Vt=new b(0,1,0),Ht=null;function Ut(){return Ht??=new M(1,1)}var q={h:0,s:0,l:0};function Wt(e,t){let n=new T;try{n.setStyle(e&&/^#?[0-9a-f]{6}$/i.test(e.replace(`#`,``))?e.startsWith(`#`)?e:`#`+e:t)}catch{n.setStyle(t)}return n}function Gt(e){return e.getHSL(q),q.s*(1-Math.abs(q.l-.5)*1.6)}function J(e,t){e.getHSL(q);let[n,r,i]=t(q.h,q.s,q.l);return new T().setHSL(n,r,i)}var Kt={background:`#1a1b26`,foreground:`#a9b1d6`,accent:`#7aa2f7`,red:`#f7768e`,green:`#9ece6a`,yellow:`#e0af68`,blue:`#7aa2f7`,magenta:`#bb9af7`,cyan:`#7dcfff`,orange:`#ff9e64`},qt=[`#ff5c8a`,`#ffc93c`,`#2ec4c6`,`#9b6bff`,`#ff8a3d`,`#52d273`,`#5b8cff`,`#f26bd6`,`#b8f2e6`,`#ff4f5e`];function Jt(e){let t={...Kt,...e.colors},n=Wt(t.background,`#101014`),r=Wt(t.foreground,`#e0e0e0`),i=Wt(t.accent??t.blue,`#7aa2f7`);n.getHSL(q);let a=(t.mode??``).toLowerCase()===`light`||q.l>.6,o=[`accent`,`magenta`,`blue`,`cyan`,`green`,`yellow`,`orange`,`red`,`bright_magenta`,`bright_blue`,`bright_cyan`,`bright_green`,`bright_yellow`,`bright_red`].filter(e=>t[e]).map(e=>Wt(t[e],`#888`)),s=o.filter(e=>Gt(e)>.12),c=s.length<3,l=[];if(c){let e=[r,i,Wt(t.bright_foreground??t.foreground,`#fff`),Wt(t.light_foreground??t.foreground,`#ddd`)];for(let t=0;t<6;t++)l.push(J(e[t%e.length],(e,n)=>[e,n*.3,.42+.26*(t*.37%1)]))}else{let e=[...s].sort((e,t)=>Gt(t)-Gt(e)),t=[];for(let n of e)if(n.getHSL(q),t.every(e=>Math.min(Math.abs(e-q.h),1-Math.abs(e-q.h))>.07)&&(t.push(q.h),l.push(J(n,(e,t,n)=>[e,Math.min(1,Math.max(t,.75)),Math.min(.68,Math.max(n,.55))]))),l.length>=6)break;let n=J(i,(e,t,n)=>[e,Math.min(1,Math.max(t,.7)),Math.min(.68,Math.max(n,.55))]);for(l.unshift(n),l.length=Math.min(l.length,6);l.length<6;)l.push(l[l.length%Math.max(1,l.length-1)].clone())}let u=[];for(let e=0;e<10;e++)if(c)u.push(new T(qt[e%qt.length]));else{let t=(s.length?s:o)[e%Math.max(1,s.length||o.length)],n=[.55,.62,.48,.66,.52][e%5];u.push(J(t,(t,r)=>[(t+(e>=s.length?.03:0))%1,Math.min(.85,Math.max(.45,r)),n]))}let d=u.map((e,t)=>c?new T().setHSL(0,0,t%2?.08:.95):J(e,(e,t,n)=>[(e+.5)%1,t*.8,n>.5?n-.3:n+.3])),f=J(n,(e,t,n)=>[e,t,a?n*.9:Math.max(.012,n*.45)]),p=J(n,(e,t,n)=>[e,t*.5,a?n*.55:Math.min(.2,n+.1)]),m=J(n,(e,t,n)=>[e,t*.8,a?n*(c?.6:.75):Math.max(.02,n*.7)]),h=J(l[0],(e,t,n)=>[e,t*.6,a?.8:n*.35]),g=l[1%l.length].clone(),_=l[0].clone(),v=a&&c;return{name:e.name,light:a,mono:c,ink:v,bg:n,bgDeep:f,fg:r,accent:i,neon:g,neon2:_,metal:p,floor:m,haze:h,lights:l,crowd:u,outfit:d}}var Yt=class{p;target;listeners=[];fade=1;constructor(e){this.p=e,this.target=e}onChange(e){this.listeners.push(e)}set(e,t=!1){this.target=e,this.fade=+!!t,t&&this.update(1e3)}update(e){if(this.fade>=1&&this.target===this.p)return;let t=1-Math.exp(-e*2.2);this.fade=Math.min(1,this.fade+e/1.6);let n=this.p,r=this.target,i=(e,n)=>e.lerp(n,this.fade>=1?1:t);for(let e of[`bg`,`bgDeep`,`fg`,`accent`,`neon`,`neon2`,`metal`,`floor`,`haze`])i(n[e],r[e]);n.lights.forEach((e,t)=>i(e,r.lights[t])),n.crowd.forEach((e,t)=>i(e,r.crowd[t])),n.outfit.forEach((e,t)=>i(e,r.outfit[t])),this.fade>.5&&(n.name=r.name,n.light=r.light,n.mono=r.mono,n.ink=r.ink),this.fade>=1&&(this.target=n);for(let e of this.listeners)e(n)}};function Xt(e,t){let n=new S;n.background=new T(2762803),n.environment=new Ie(e).fromScene(new Ae,.04).texture,n.environmentIntensity=.8;let r=new _(16777215,2.2);r.position.set(3,6,5),n.add(r,new Te(12571903,3156024,.9));let i=new E(new be(12,64),new k({color:3815492,roughness:.6}));i.rotation.x=-Math.PI/2,n.add(i);let a=Jt({name:t.get(`theme`)??`default`,colors:{}}),o=Number(t.get(`crowd`)??(P.id===`spooky`?18:6)),s=[St(),...Ct(),...Array.from({length:o},(e,t)=>bt(t+1))];if(P.id===`spooky`){let e=new Set,t=[];for(let n=1;n<400&&t.length<10;n++){let r=bt(n);r.costume&&!e.has(r.costume.kind)&&(e.add(r.costume.kind),t.push(r))}s=[...t,St(),...Ct()]}let c=s.map((e,r)=>{let i=new Bt(e,r+1,`high`);i.setSkin(P.id),i.applyPalette(a);let o=Math.max(6,Math.ceil(s.length/2)),c=(r%o-(o-1)/2)*1.25,l=-Math.floor(r/o)*1.5;return i.placeAt(c,l,Number(t.get(`yaw`)??0)),n.add(i.root,i.shadow),i}),l=new ne(30,innerWidth/innerHeight,.1,100),u=Math.max(1,Math.ceil(s.length/2)/6);l.position.set(0,2.2+3*(u-1),9.5*u),l.lookAt(0,.4,-.8*u);let d=t.get(`pose`)??`idle`,f=0,p=e=>{f+=e,c.forEach((n,r)=>{let i=n.expr,a=f*2+r*.7;switch(d){case`up`:n.arms[0].target({raise:2.7,elbow:.3}),n.arms[1].target({raise:2.7,elbow:.3}),i.happy=!0,i.mouth=.7;break;case`sing`:i.mouth=.5+.5*Math.sin(a*3),i.closed=r%2==0,n.rig.tiltZ.target=.15*Math.sin(a);break;case`lean`:n.rig.tiltZ.target=.35,n.rig.stretch.target=1.15;break;case`zombie`:for(let e of n.arms)e.target({raise:Number(t.get(`r`)??.3),fwd:Number(t.get(`f`)??1.5),inward:Number(t.get(`i`)??.1),elbow:Number(t.get(`e`)??.15)});n.rig.tiltX.target=.16,i.mouth=.3;break;case`squash`:n.rig.stretch.target=.75;break;default:n.rig.tiltZ.target=.06*Math.sin(a),i.mouth=r%3==0?.4:0,i.star=r===3,i.wink=+(r===1)}n.update(e)})};for(let e=0;e<240;e++)p(1/120);window.__wp={ready:!0,step:(t,r=1/60)=>{for(let e=0;e<t;e++)p(r);e.render(n,l)}},e.setAnimationLoop(()=>{t.has(`frozen`)||(p(1/60),e.render(n,l))}),addEventListener(`resize`,()=>{l.aspect=innerWidth/innerHeight,l.updateProjectionMatrix()})}var Zt=class{w;p;base;crowd=!1;hops=0;twitches=0;rng;routine=`rest`;side=1;swayOffset=0;swayGain=1;pending=[];starUntil=0;happyUntil=0;wooUntil=0;closedSinging=!1;glanceUntil=0;glance=0;armPop=[0,0];lastPhase=0;nextIdle=0;hopEveryBeat=!1;hoppedBeat=-1;swirl=null;swirlEnv=0;get swirling(){return this.swirlEnv>0}zombie=null;zombieEnv=0;zombieJerk=0;get zombieing(){return this.zombieEnv>0}lookAtCamera=0;glowScale=1;constructor(e,t){this.w=e,this.base=e.look.personality,this.p={...this.base},this.rng=new F(t*31+7),this.side=this.rng.chance(.5)?1:-1,this.swayOffset=this.rng.range(-.08,.08)}retune(){if(!this.crowd)return;let e=this.base,t=this.p,n=e=>I(e,0,1);t.energy=I(e.energy+N.energy,.3,1.9),t.bounce=n(e.bounce+N.bounce),t.jumpy=n(e.jumpy+N.jumpy),t.shimmy=n(e.shimmy+N.shimmy),t.showoff=n(e.showoff+N.showoff)}jump(e,t,n){this.pending.push({at:e+t,kind:`jump`,v:Nt.hopSpeed(n)})}startSwirl(e,t=0,n=2,r=this.rng.chance(.5)?1:-1){if(this.swirl||this.zombie||e.presence<.5)return;let i=Math.ceil(e.danceBeatPos-this.p.lag)+t;this.swirl={start:i,loops:n,dir:r,amp:(.17+.1*this.p.showoff)*(.8+.4*this.p.sway)}}startZombie(e,t=4){if(this.zombie||e.presence<.5)return;let n=Math.ceil((e.danceBeatPos-this.p.lag+.25)/4)*4;this.zombie={start:n,beats:t*4},this.swirl=null}onEvent(e,t){let{music:n,time:r}=t,i=this.w.rig,a=n.hype*this.p.energy;switch(e.type){case`danceBeat`:e.beat%8==0&&(this.chooseRoutine(n),(n.section===R.Peak||n.section===R.Groove)&&this.rng.chance((.03+.1*this.p.showoff*I(a))*N.swirl)&&this.startSwirl(n,0,this.rng.chance(.5)?1:2)),i.kick(-(.5+.9*a)*(.5+this.p.bounce)*this.w.look.scale,0),this.hopEveryBeat=a*this.p.jumpy>N.hop||n.section===R.Build&&n.build>.75;break;case`beat`:e.barBeat%2==1&&i.kick(0,(e.barBeat===1?1:-1)*.5*a*this.p.sway);break;case`kick`:i.squashKick(-.9*e.strength*(.4+this.p.bounce)*(.3+a));break;case`snare`:this.armPop[this.rng.int(2)]=Math.max(.35,e.strength)*this.p.arms*(.4+a);break;case`hat`:this.p.shimmy>N.twitchGate&&n.hype>N.twitchHype&&(i.kick(this.rng.range(-.3,.3),this.rng.range(-.3,.3)),this.twitches++);break;case`drop`:{let e=this.rng.range(0,.18);this.jump(r,e,.42+.25*this.p.jumpy),this.rng.chance(.25+.5*this.p.jumpy)&&this.pending.push({at:r+e+.05,kind:`spin`,v:this.rng.chance(.5)?1:-1}),this.routine=this.rng.chance(.6)?`handsUp`:`wave`,this.rng.chance(.35+.4*this.p.showoff)&&(this.starUntil=r+240/n.danceBpm),this.wooUntil=r+.7,this.rng.chance((.2+.4*this.p.showoff)*N.swirl)&&this.startSwirl(n,3);break}case`phraseStart`:i.kick(-.9*this.p.singer,0),this.swayOffset=n.danceBeatPos/8%1,this.swayGain=1.4,this.closedSinging=n.calm>.3&&this.rng.chance(this.p.singer*.6),n.vocal>.5&&this.rng.chance(this.p.singer*.5)&&(this.routine=`sing`);break;case`phraseEnd`:i.squashKick(1.2*this.p.singer),i.kick(.5,this.rng.range(-.4,.4)),this.swayGain=.8,this.closedSinging=!1,this.rng.chance(.3)&&(this.happyUntil=r+.9);break;case`section`:this.chooseRoutine(n)}}chooseRoutine(e){let t=this.p,n=e.vocal,r=e.presence<.3?[[`rest`,1]]:e.section===R.Calm?[[`rest`,2],[`swing`,3],[`sing`,3*t.singer*n],[`wave`,.6]]:e.section===R.Build?[[`raise`,5],[`clap`,2*t.arms],[`shake`,1.5*t.shimmy]]:e.section===R.Peak?[[`handsUp`,3],[`wave`,3],[`pump`,3*t.arms],[`roof`,2],[`disco`,1.2*t.showoff*3]]:[[`swing`,2],[`pump`,2*t.arms],[`clap`,1.4],[`point`,1],[`disco`,t.showoff*3],[`rest`,1.2],[`sing`,2*t.singer*n],[`shake`,t.shimmy]];this.routine=this.rng.weighted(r),this.side=this.rng.chance(.5)?1:-1}update(e,t){let{music:n,time:r}=t,i=this.w,a=i.rig,o=this.p,s=n.presence,c=I(n.hype*o.energy,0,1.3),l=60/Math.max(40,n.danceBpm),u=n.danceBeatPos-o.lag,d=(u%1+1)%1;for(let e=this.pending.length-1;e>=0;e--){let t=this.pending[e];t.at<=r&&(t.kind===`jump`||t.kind===`hop`?a.hop(t.v):t.kind===`spin`&&(a.yaw.target+=Math.PI*2*t.v,a.yaw.v+=9*t.v,a.stretchForce(40)),this.pending.splice(e,1))}let f=(d+.06)%1,p=Math.exp(-f*7)+.5*Math.exp(-(1-f)*16),m=(.03+.09*c*o.bounce)*s*N.bob,h=n.section===R.Build?n.build:n.build*.5,g=.018*Math.sin(r*1.7+o.lag*40)*(1-s);a.stretch.target=1-m*p+m*.4+.12*h*s+.1*n.pitch*n.vocal*o.singer+g-.04*n.calm;let _=1-Math.min(.3,.42*l)*(.6+.4*I(c))/l,v=Math.floor(u);if(s>.5&&this.swirlEnv<.3&&this.zombieEnv<.3&&this.lastPhase<_&&d>=_&&!a.airborne&&this.hoppedBeat!==v){let e=this.hopEveryBeat||c*o.bounce>.75&&n.section===R.Peak,t=(v+1)%2==0&&c*o.jumpy>N.hopDown;(e||t)&&(a.hop(Nt.hopSpeed((1-d)*l)),this.hoppedBeat=v,this.hops++)}this.lastPhase=d,this.swayGain+=(1-this.swayGain)*(1-Math.exp(-e*.8));let y=n.section===R.Calm?8:4,ee=Math.sin(2*Math.PI*(u/y-this.swayOffset)),te=(.035+.08*o.sway)*(.5+.8*n.calm+.5*n.vocal*o.singer)*this.swayGain*s;a.tiltZ.target=ee*te,a.tiltX.target=-.07*n.vocal*o.singer*s+.08*n.pitch*n.vocal*o.singer,this.swirlEnv=0;let b=this.swirl;if(b){let e=(u+.08-b.start)/4;if(e>=b.loops||s<.3)this.swirl=null;else if(e>0){this.swirlEnv=$e(0,.3,e)*$e(b.loops,b.loops-.3,e)*s;let t=2*Math.PI*e*b.dir,n=b.amp*this.swirlEnv;a.tiltX.target+=n*Math.cos(t),a.tiltZ.target=a.tiltZ.target*(1-this.swirlEnv)+n*Math.sin(t)}}this.zombieEnv=0;let x=this.zombie;if(x){let e=u-x.start;if(e>=x.beats||s<.3)this.zombie=null;else if(e>-.5){let n=$e(-.5,.5,e)*$e(x.beats,x.beats-1,e)*s;this.zombieEnv=n;let r=Math.floor(Math.max(0,e)),o=Math.max(0,e)-r,c=Math.floor(r/2)%2==0?1:-1,l=Math.exp(-o*6);this.zombieJerk=l,a.tiltZ.target=a.tiltZ.target*(1-n)-n*c*(.08+.1*l),a.tiltX.target+=n*.16,a.twist.target=n*c*.35*l;let u=r+$e(0,.35,o),d=.22*(1-Math.abs(u%4/2-1))*n,f=t.stageYaw;i.offset.set(Math.cos(f)*d,-Math.sin(f)*d)}}this.zombie||i.offset.set(0,0);let S=o.shimmy*I(n.high*1.2+n.density-.6)*c;if(this.zombieEnv<.01&&(a.twist.target=.3*S*Math.sin(2*Math.PI*u*2)),h>.2&&s>.5){let e=h*h*26*(.5+o.energy*.5);a.torque(this.rng.range(-e,e),this.rng.range(-e,e))}this.glanceUntil-=e,this.glanceUntil<0&&this.rng.chance(e*.08)&&(this.glance=this.rng.range(-.6,.6),this.glanceUntil=this.rng.range(.6,1.6));let ne=this.glanceUntil>0?this.glance:0;this.lookAtCamera-=e;let C=this.lookAtCamera>0&&t.cameraYaw!==null?t.cameraYaw:t.stageYaw+ne*.6,w=C+Math.round((a.yaw.target-C)/(Math.PI*2))*Math.PI*2;if(Math.abs(a.yaw.target-w)>.02&&Math.abs(a.yaw.x-a.yaw.target)<.5&&(a.yaw.target=w),s<.3&&(this.nextIdle-=e,this.nextIdle<=0)){this.nextIdle=this.rng.range(2,7);let e=this.rng.next();e<.3?a.kick(this.rng.range(-.6,.6),this.rng.range(-.6,.6)):e<.4?a.hop(1.2):(this.glance=this.rng.range(-1,1),this.glanceUntil=this.rng.range(1,2.5))}this.arms(e,t,u,d),this.face(t,c),i.beatPhase=d,i.dancing=I(c)*s,i.costumeGlow=(.45+.35*n.hype+.8*n.kickPulse*s+.6*n.dropPulse)*Math.max(.35,this.glowScale)}arms(e,t,n,r){let{music:i}=t,[a,o]=this.w.arms,s=this.side,c=s>0?o:a,l=s>0?a:o,u=Math.exp(-r*8),d=(e,t=1)=>e.target({raise:.5+.06*t,fwd:.08,inward:0,elbow:.45});switch(i.presence<.3?`rest`:this.zombieEnv>.3?`zombie`:this.routine){case`zombie`:{let e=this.zombieJerk;a.target({raise:.3,fwd:1.5+.12*e,inward:.1,elbow:.15+.3*e}),o.target({raise:.3,fwd:1.5+.12*e,inward:.1,elbow:.15+.3*e});break}case`rest`:d(a),d(o);break;case`swing`:{let e=Math.sin(Math.PI*n);a.target({raise:.55,fwd:.55*e,inward:0,elbow:.7}),o.target({raise:.55,fwd:-.55*e,inward:0,elbow:.7});break}case`pump`:c.target({raise:2.25+.3*u,fwd:.35,inward:.1,elbow:1.35-1.15*u}),d(l);break;case`clap`:{let e=Math.exp(-((r+.9)%1)*9);for(let t of[a,o])t.target({raise:.7,fwd:1.15,inward:.35+.75*e,elbow:.55});break}case`wave`:{let e=Math.sin(Math.PI*n/2);a.target({raise:2.55-.35*e,fwd:.25,inward:0,elbow:.25}),o.target({raise:2.55+.35*e,fwd:.25,inward:0,elbow:.25});break}case`roof`:for(let e of[a,o])e.target({raise:2.2,fwd:.2,inward:.1,elbow:1.45-1.2*u});break;case`point`:c.target({raise:1.75+.25*u,fwd:1,inward:.25,elbow:.05}),d(l,1);break;case`disco`:{let e=Math.floor(n)%2==0;c.target(e?{raise:2.6,fwd:.35,inward:0,elbow:.05}:{raise:.35,fwd:.7,inward:.9,elbow:.15}),d(l);break}case`handsUp`:{let e=.1*Math.sin(t.time*11);a.target({raise:2.75+e,fwd:.15,inward:0,elbow:.15}),o.target({raise:2.75-e,fwd:.15,inward:0,elbow:.15});break}case`sing`:c.target({raise:.3,fwd:1.45,inward:1.05,elbow:1.95}),l.target({raise:.8+1.2*I(i.pitch+.3)*i.vocal,fwd:.6,inward:0,elbow:.25});break;case`raise`:{let e=$e(0,1,i.build),n=.15*e*Math.sin(t.time*20);a.target({raise:.5+2.2*e+n,fwd:.3,inward:0,elbow:.3}),o.target({raise:.5+2.2*e-n,fwd:.3,inward:0,elbow:.3});break}case`shake`:{let e=Math.sin(2*Math.PI*n*2);a.target({raise:1,fwd:.45*e,inward:.2,elbow:.6}),o.target({raise:1,fwd:-.45*e,inward:.2,elbow:.6});break}}for(let t=0;t<2;t++){let n=this.w.arms[t];n.add.raise+=this.armPop[t]*.5,n.add.elbow-=this.armPop[t]*.3,this.armPop[t]*=Math.exp(-e*12)}}face(e,t){let{music:n,time:r}=e,i=this.w.expr,a=this.p,o=n.vocal*(.25+.75*a.singer),s=r<this.wooUntil?.85:0;i.mouth=Math.max(s,I(n.mouth*o*1.1)),i.smile=.5+.35*I(t),i.star=r<this.starUntil,i.happy=!i.star&&(r<this.happyUntil||this.swirlEnv>.5||n.section===R.Peak&&t>.9&&Math.sin(r*.7+a.lag*50)>.6),i.closed=this.closedSinging&&n.vocal>.4,i.blush=.45+.4*I(t),i.lookX=this.glanceUntil>0?this.glance:0,i.lookY=.3*n.pitch*n.vocal,this.zombieEnv>.3&&(i.happy=!1,i.star=!1,i.smile=.05,i.mouth=Math.max(i.mouth,.3),i.lookX=0),i.glowBelt=(.25*n.hype+1.1*n.kickPulse*n.presence)*this.glowScale,i.glowEmblem=(.2*n.hype+.7*n.snarePulse*n.presence)*this.glowScale}};function Qt(e){return{uTime:{value:0},uBands:{value:[0,0,0,0,0,0]},uBeat:{value:0},uBeatPos:{value:0},uKick:{value:0},uSnare:{value:0},uHat:{value:0},uHype:{value:0},uBuild:{value:0},uDrop:{value:0},uVocal:{value:0},uPresence:{value:0},uKicks:{value:new c(99,99,99,99)},uLights:{value:e.lights},uBg:{value:e.bgDeep},uLightMode:{value:0},uInk:{value:0},uMode:{value:0},uModePrev:{value:0},uModeMix:{value:1},uMarquee:{value:null},uMarqueeMix:{value:0},uMarqueeAspect:{value:8},uMarqueeScroll:{value:0},uArt:{value:null},uArtMix:{value:0},uLogo:{value:null},uLogoMix:{value:0},uLogoAspect:{value:4},uSkin:{value:0},uLightning:{value:0},uLightSeed:{value:0}}}function $t(e,t,n,r,i){e.uTime.value=r;let a=e.uBands.value;a[0]=t.sub,a[1]=t.bass,a[2]=t.lowMid,a[3]=t.mid,a[4]=t.highMid,a[5]=t.high,e.uBeat.value=t.beatPhase,e.uBeatPos.value=t.beatPos,e.uKick.value=t.kickPulse*t.presence,e.uSnare.value=t.snarePulse*t.presence,e.uHat.value=t.hatPulse*t.presence,e.uHype.value=t.hype,e.uBuild.value=t.build,e.uDrop.value=t.dropPulse,e.uVocal.value=t.vocal,e.uPresence.value=t.presence;let o=e.uKicks.value;o.set(o.x+i,o.y+i,o.z+i,o.w+i),e.uLightMode.value=+!!n.light,e.uInk.value+=(+!!n.ink-e.uInk.value)*Math.min(1,i*3),e.uModeMix.value=Math.min(1,e.uModeMix.value+i/.8)}function en(e){let t=e.uKicks.value;t.set(0,t.x,t.y,t.z)}function tn(e,t){t!==e.uMode.value&&(e.uModePrev.value=e.uMode.value,e.uMode.value=t,e.uModeMix.value=0)}var nn=`
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
uniform float uSkin;
uniform float uLightning;
uniform float uLightSeed;

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
`,Y={eq:0,tunnel:1,wave:2,plasma:3,checker:4,moon:5,eyes:6},rn=`
${nn}
uniform vec2 uRes;       // LED pixel grid
uniform float uGain;
uniform float uSeed;
uniform float uLogoHost; // 1 on the surface that shows logos
varying vec2 vUv;

float segD(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a, ba = b - a;
  return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
}

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
  } else if (mode < 4.5) {
    // Checker slam on each beat (skulls in the spooky skin).
    vec2 g = floor(uv * vec2(8.0, 4.0));
    float on = mod(g.x + g.y + floor(uBeatPos), 2.0);
    vec3 colr = uLights[int(mod(g.x + floor(uBeatPos), 6.0))];
    if (uSkin > 0.5) {
      vec2 f = fract(uv * vec2(8.0, 4.0)) - 0.5;
      float skull = min(length(f - vec2(0.0, 0.08)) - 0.3, max(abs(f.x) - 0.16, abs(f.y + 0.22) - 0.12));
      float holes = min(length(vec2(abs(f.x) - 0.12, f.y - 0.05)) - 0.09, max(abs(f.x) - 0.03, abs(f.y + 0.1) - 0.04));
      on *= step(skull, 0.0) * step(0.0, holes);
    }
    return colr * on * (0.3 + 0.9 * exp(-uBeat * 4.0));
  } else if (mode < 5.5) {
    // Moonlit graveyard: big moon, drifting clouds, bats, tombstones.
    float asp = uRes.x / uRes.y;
    vec2 p = vec2((uv.x - 0.5) * asp, uv.y - 0.5);
    vec3 sky = mix(uLights[2] * 0.04, uLights[0] * 0.14, uv.y);
    vec2 mp = p - vec2(asp * 0.2, 0.1);
    float md = length(mp);
    vec3 moonCol = mix(vec3(1.0, 0.95, 0.8), uLights[1] * 0.4 + 0.6, 0.25) * (0.8 + 0.2 * noise2(mp * 9.0 + 3.0)) * (0.95 + 0.2 * uKick);
    float moon = smoothstep(0.25, 0.235, md);
    vec3 col = sky + moonCol * moon * 0.9 + moonCol * 0.3 * exp(-max(md - 0.24, 0.0) * 8.0) * (1.0 - moon) * (0.6 + 0.6 * uVocal);
    float cl = noise2(vec2(p.x * 2.0 - uTime * 0.05, p.y * 5.0)) * noise2(vec2(p.x * 3.5 - uTime * 0.08, p.y * 7.0 + 2.0));
    col = mix(col, sky * 1.5 + 0.03, smoothstep(0.16, 0.4, cl) * smoothstep(-0.15, 0.25, p.y) * 0.85);
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      float t = fract(uTime * (0.03 + 0.01 * fi) + fi * 0.37);
      vec2 bp = (p - vec2((t - 0.5) * asp * 1.3, 0.05 + 0.18 * sin(t * 6.28 + fi * 2.0))) / 0.09;
      bp.y -= abs(bp.x) * 0.6 * sin(uTime * 12.0 + fi * 3.0);
      float b = min(max(abs(bp.x) - 1.0, abs(bp.y) - 0.3 + 0.2 * abs(bp.x)), length(bp) - 0.35);
      col = mix(col, vec3(0.0), step(b, 0.0));
    }
    float ground = -0.34 + 0.04 * sin(p.x * 2.3 + 1.0) + 0.02 * sin(p.x * 5.1);
    float cell = p.x / 0.36;
    float h = hash12(vec2(floor(cell), 3.0));
    vec2 sp = vec2((fract(cell) - 0.5) * 0.36, p.y - ground);
    float sh = 0.1 + 0.07 * h;
    float stone = h > 0.3 ? min(max(abs(sp.x) - 0.06, sp.y - sh), length(sp - vec2(0.0, sh)) - 0.06) : 1.0;
    if (h > 0.82) stone = min(max(abs(sp.x) - 0.018, abs(sp.y - 0.12) - 0.13), max(abs(sp.x) - 0.07, abs(sp.y - 0.17) - 0.018));
    float sil = max(step(p.y, ground), step(stone, 0.0));
    col = mix(col, vec3(0.006), sil);
    col += uLights[3] * 0.12 * smoothstep(0.1, 0.0, abs(p.y - ground - 0.04)) * (0.6 + 0.4 * uBands[1]);
    return col;
  } else {
    // Eyes in the dark: pairs open, glance with the beat, blink, close.
    float asp = uRes.x / uRes.y;
    vec2 g = vec2(uv.x * asp, uv.y) * 2.2;
    vec2 id = floor(g);
    vec2 f = fract(g) - 0.5;
    float h = hash12(id + 7.0);
    float h2 = hash12(id + 19.0);
    float life = fract(uBeatPos / 16.0 + h * 7.0);
    float on = step(0.35, h) * smoothstep(0.0, 0.06, life) * smoothstep(0.75, 0.6, life);
    float blink = step(0.06, abs(fract(uBeatPos * 0.125 + h2) - 0.5));
    f -= vec2(h - 0.5, h2 - 0.5) * 0.35;
    f.x -= sin(uBeatPos * 0.785 + h * 6.0) * 0.03;
    float open = (0.25 + 0.75 * on) * blink;
    float eye = 1e3;
    for (int i = 0; i < 2; i++) {
      vec2 e = f - vec2(i == 0 ? -0.14 : 0.14, 0.0);
      eye = min(eye, length(e / vec2(0.1, max(0.005, 0.06 * open))) - 1.0);
    }
    vec3 colr = lightAt(h * 0.9 + 0.1) * (0.7 + 0.8 * uKick + 0.4 * uHype);
    return colr * step(eye, 0.0) * on;
  }
}

void main() {
  vec2 cell = fract(vUv * uRes);
  vec2 uv = (floor(vUv * uRes) + 0.5) / uRes;
  float dotMask = smoothstep(0.5, 0.32, length(cell - 0.5));
  vec3 a = programme(uMode, uv);
  vec3 b = programme(uModePrev, uv);
  vec3 col = mix(b, a, smoothstep(0.0, 1.0, uModeMix));
  // Lightning: a jagged bolt down the wall and the sky lighting up behind it.
  if (uLightning > 0.001) {
    float asp = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * asp, uv.y);
    vec2 a = vec2((0.2 + 0.6 * hash12(vec2(uLightSeed, 0.5))) * asp, 1.05);
    float d = 1e3;
    for (int i = 0; i < 7; i++) {
      vec2 b = a + vec2((hash12(vec2(uLightSeed, float(i) + 1.0)) - 0.5) * 0.35, -0.16);
      d = min(d, segD(p, a, b));
      a = b;
    }
    float bolt = smoothstep(0.035, 0.0, d);
    col = col * (1.0 - 0.5 * uLightning) + vec3(0.25, 0.3, 0.45) * uLightning * 0.7 + vec3(0.9, 0.95, 1.2) * bolt * uLightning * 2.0;
  }
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
`,an=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;function on(e,t,n=2.2,r=0,i=!1){return new xe({uniforms:{...e,uRes:{value:new y(...t)},uGain:{value:n},uSeed:{value:r},uLogoHost:{value:+!!i}},vertexShader:an,fragmentShader:rn,toneMapped:!0})}function sn(e,t){let n=new k({color:t,roughness:.3,metalness:.2});return n.color=t,n.onBeforeCompile=t=>{Object.assign(t.uniforms,e),t.vertexShader=t.vertexShader.replace(`#include <common>`,`#include <common>
varying vec3 vWorldP;`).replace(`#include <worldpos_vertex>`,`#include <worldpos_vertex>
vWorldP = (modelMatrix * vec4(transformed, 1.0)).xyz;`),t.fragmentShader=t.fragmentShader.replace(`#include <common>`,`#include <common>\n${nn}\nvarying vec3 vWorldP;`).replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
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
        }`)},n.customProgramCacheKey=()=>`wobble-floor`,n}var cn=-5.2,ln=-6.2,un=.5,dn=-9.6,fn=class{palette;u;group=new f;djSpot=new b(0,1,ln);trussY=8.6;fixtures=[];platters=[];cones=[];neonMats=[];faceMats=[];metal;stageMat;faders=[];signBounds=null;neonSets={};constructor(e,t,n){this.palette=e,this.u=t;let r=e;this.metal=new k({color:r.metal,roughness:.35,metalness:.85}),this.metal.color=r.metal,this.stageMat=new k({color:r.floor,roughness:.5,metalness:.3}),this.stageMat.color=r.floor,this.buildFloor(),this.buildStage(),this.buildBooth(n),this.buildWall(),this.buildSpeakers(),this.buildTruss(),this.buildHouse(),this.loadSign()}buildFloor(){let e=new E(new M(80,60),sn(this.u,this.palette.floor));e.rotation.x=-Math.PI/2,e.position.z=12,e.receiveShadow=!1,this.group.add(e)}buildStage(){let e=new E(new O(22,1,8),this.stageMat);e.position.set(0,1/2,-7),this.group.add(e);let t=new w({color:this.palette.lights[0]});t.color=this.palette.lights[0];let n=new E(new O(22,.06,.06),t);n.position.set(0,.95,-2.98),this.group.add(n);let r=n.clone();r.position.y=.05,this.group.add(r);for(let e of[-1,1]){let t=new E(new O(2,1/2,1),this.stageMat);t.position.set(e*9.5,1/4,-2.5),this.group.add(t)}}buildBooth(e){let t=new f;t.position.set(0,1,cn);let n=.95,r=new E(new O(3.6,n,1.1),new k({color:789266,roughness:.4,metalness:.5}));r.position.y=n/2,t.add(r);let i=new E(new M(3.4,.75),on(this.u,[72,18],1.1,1));i.position.set(0,n/2,.555),t.add(i);let a=new E(new O(3.7,.06,1.2000000000000002),this.metal);a.position.y=.98,t.add(a);let o=new k({color:1710626,roughness:.5,metalness:.4}),s=new k({color:328967,roughness:.25,metalness:.1}),c=new k({color:this.palette.lights[1],emissive:this.palette.lights[1],emissiveIntensity:.6});c.color=this.palette.lights[1],c.emissive=this.palette.lights[1];for(let n of[-1,1]){let r=new E(new O(1.2,.1,.95),o);r.position.set(n*1.05,1.06,0),t.add(r);let i=new E(new A(.42,.42,.04,e===`high`?48:24),s);i.position.set(n*1.05,1.13,0);let a=new E(new A(.13,.13,.045,24),c);i.add(a);let l=new E(new O(.3,.046,.025),new w({color:4473941}));l.position.x=.24,i.add(l),t.add(i),this.platters.push(i);let u=new E(new O(.04,.03,.5),this.metal);u.position.set(n*1.05+.45,1.19,-.05),u.rotation.y=.35,t.add(u)}let l=new E(new O(.55,.12,.85),o);l.position.set(0,1.0699999999999998,0),t.add(l);let u=new k({color:14540253,roughness:.3});for(let e=0;e<3;e++){let n=new E(new O(.05,.05,.08),u);n.position.set(-.15+e*.15,1.15,.1),t.add(n),this.faders.push(n)}this.group.add(t);let d=new E(new O(3.2,un,1.6),this.stageMat);d.position.set(0,1.25,-6.4),this.group.add(d)}buildWall(){let e=new E(new M(13,5.6),on(this.u,[104,45],.9,2,!0));e.position.set(0,4.2,dn),this.group.add(e);let t=new E(new O(13.4,6,.3),this.metal);t.position.set(0,4.2,-9.799999999999999),this.group.add(t);for(let e of[-8.2,-7.2,7.2,8.2]){let t=new E(new M(.7,6.4),on(this.u,[5,44],1,e));t.position.set(e,4.3,-9),this.group.add(t)}let n=new E(new M(120,50),new w({color:this.palette.bgDeep}));n.material.color=this.palette.bgDeep,n.position.set(0,15,-22),this.group.add(n)}buildSpeakers(){let e=new k({color:1184280,roughness:.6,metalness:.2}),n=new k({color:2763315,roughness:.8}),r=new k({color:7829384,metalness:.9,roughness:.3});for(let i of[-1,1])for(let a=0;a<3;a++){let o=new E(new O(2,1.6,1.4),e),s=1.8+a*1.62;o.position.set(i*10.2,s,-5.2),o.rotation.y=-i*.25,this.group.add(o);let c=new E(new A(.55,.3,.2,32),n);c.rotation.x=Math.PI/2,c.position.set(0,0,.72);let l=new E(new t(.58,.05,8,32),r);l.position.z=.72,o.add(c,l),this.cones.push(c)}}buildTruss(){let e=e=>{let t=new f,n=.05,r=.45,a=new A(n,n,e,8);for(let[e,n]of[[-.45/2,-.45/2],[r/2,-.45/2],[-.45/2,r/2],[r/2,r/2]]){let r=new E(a,this.metal);r.position.set(e,0,n),t.add(r)}let o=Math.floor(e/.5),s=new A(.02,.02,Math.hypot(.5,r),5),c=new l(s,this.metal,o*4),u=new ge,d=new we,p=0;for(let t=0;t<o;t++){let n=-e/2+(t+.5)*.5,a=Math.atan2(r,.5)*(t%2?1:-1);for(let e=0;e<4;e++){let t=e*Math.PI/2;d.setFromEuler(new i(0,t,a,`YXZ`));let o=new b(0,0,r/2).applyAxisAngle(new b(0,1,0),t);u.compose(new b(o.x,n,o.z),d,new b(1,1,1)),c.setMatrixAt(p++,u)}}return t.add(c),t},t=this.trussY;for(let n of[-1,1]){let r=e(t);r.position.set(n*11.8,t/2,-3.6),this.group.add(r);let i=e(t);i.position.set(n*11.8,t/2,-9.4),this.group.add(i);let a=e(5.8);a.rotation.x=Math.PI/2,a.position.set(n*11.8,t,-6.5),this.group.add(a)}for(let n of[-3.6,-9.4]){let r=e(23.6);r.rotation.z=Math.PI/2,r.position.set(0,t,n),this.group.add(r)}for(let e=0;e<8;e++)this.fixtures.push(new b(-9.8+e*2.8,t-.35,-3.6));for(let e=0;e<6;e++)this.fixtures.push(new b(-8.5+e*3.4,t-.35,-9.4))}buildHouse(){let e=new w({color:this.palette.bgDeep,fog:!0});e.color=this.palette.bgDeep;let t=new E(new M(60,16),e);t.position.set(0,8,22),t.rotation.y=Math.PI,this.group.add(t);for(let t of[-1,1]){let n=new E(new M(40,16),e);n.position.set(t*20,8,4),n.rotation.y=-t*Math.PI/2,this.group.add(n)}this.neonSets.classic=this.buildNeon(`classic`),this.group.add(this.neonSets.classic);let n=new E(new O(14,1.1,1.2),new k({color:855058,roughness:.4,metalness:.4}));n.position.set(0,.55,20.8),this.group.add(n);let r=new E(new O(14,.05,.05),new w({color:this.palette.lights[0]}));r.material.color=this.palette.lights[0],r.position.set(0,1.12,20.2),this.group.add(r)}setSkin(e){this.neonSets[e]||(this.neonSets[e]=this.buildNeon(e),this.group.add(this.neonSets[e]));for(let[t,n]of Object.entries(this.neonSets))n.visible=t===e}buildNeon(e){let t=new f,n=(e,n,r,i,a)=>{let o=e.getSpacedPoints(160).map(e=>new b(e.x,e.y,0)),s=new ue(new de(o,!0),320,.05,8,!0),c=new k({color:1118481,emissive:n,emissiveIntensity:2.2});c.emissive=n,this.neonMats.push(c);let l=new E(s,c);l.position.copy(r),l.rotation.y=i,l.scale.setScalar(a),t.add(l)},r=this.palette.lights,i=[[r[2],new b(-13.5,5.2,-8.2),.35,1.2],[r[4],new b(13.5,5.2,-8.2),-.35,1.2],[r[1],new b(-8,6,21.9),Math.PI,1.6],[r[3],new b(8,6,21.9),Math.PI,1.4],[r[0],new b(19.9,6,8),-Math.PI/2,1.5],[r[5],new b(-19.9,6,8),Math.PI/2,1.5]],a=e===`spooky`?mn():pn();return i.forEach(([e,t,r,i],o)=>n(a[o%a.length],e,t,r,i)),t}async loadSign(){let e=await new De().loadAsync(new URL(`fonts/wobble-sign.typeface.json`,document.baseURI).href),t=(t,n,r,i)=>{let a=new Pe(t,{font:e,size:n,depth:.16,curveSegments:10,bevelEnabled:!0,bevelThickness:.03,bevelSize:.03,bevelSegments:3});a.computeBoundingBox();let o=a.boundingBox,s=-(o.max.x+o.min.x)/2;a.translate(s,0,0);let c=new k({color:1315100,emissive:r,emissiveIntensity:.28,roughness:.35,metalness:.2});c.emissive=r,this.faceMats.push(c);let l=new E(a,c);l.position.set(0,i,-8.7);let u=[];for(let r of e.generateShapes(t,n))for(let e of[r,...r.holes]){let t=e.getSpacedPoints(Math.max(24,Math.round(e.getLength()*40))),n=new de(t.map(e=>new b(e.x+s,e.y,.21000000000000002)),!0);u.push(new ue(n,t.length*2,.034,6,!0))}let d=new k({color:1118481,emissive:r,emissiveIntensity:2.4,roughness:.3});d.emissive=r,this.neonMats.push(d);let f=new E(Me(u),d);return f.position.copy(l.position),this.group.add(l,f),o.clone().translate(l.position)},n=t(`WOBBLE`,1.35,this.palette.neon2,7.45),r=t(`PARTY`,1.35,this.palette.neon,5.95);this.signBounds={wobble:n,party:r}}update(e,t,n){let r=(.9+.4*t.hype)*t.presence;for(let t of this.platters)t.rotation.y+=r*Math.PI*2*e;let i=1+.25*t.kickPulse+.12*t.bass;for(let e of this.cones)e.scale.set(i,1,i);let a=+!this.palette.ink;for(let[e,n]of this.neonMats.entries())n.emissiveIntensity=a*(2+.6*t.hype+1.2*t.dropPulse+(e%2==0?.6*t.kickPulse:.6*t.snarePulse));for(let e of this.faceMats)e.emissiveIntensity=a*(.22+.25*t.vocal+.3*t.dropPulse);for(let e of this.faders)e.position.z=.1+.12*Math.sin(n*.7+e.position.x*20)}};function pn(){let e=new j;for(let t=0;t<10;t++){let n=Math.PI/2+t*Math.PI/5,r=t%2?.45:1;t===0?e.moveTo(Math.cos(n)*r,Math.sin(n)*r):e.lineTo(Math.cos(n)*r,Math.sin(n)*r)}e.closePath();let t=new j;[[.2,1],[-.45,-.05],[0,-.05],[-.25,-1],[.5,.15],[.05,.15],[.35,1]].forEach(([e,n],r)=>r?t.lineTo(e,n):t.moveTo(e,n)),t.closePath();let n=new j;return n.moveTo(0,-.9),n.bezierCurveTo(-1.2,-.1,-.9,.9,0,.45),n.bezierCurveTo(.9,.9,1.2,-.1,0,-.9),[e,t,n,e,t,n]}function mn(){let e=new j;e.moveTo(0,.28),e.lineTo(.08,.42),e.lineTo(.12,.22),e.quadraticCurveTo(.5,.5,1.15,.45),e.quadraticCurveTo(.95,.2,1,-.05),e.quadraticCurveTo(.8,0,.7,-.2),e.quadraticCurveTo(.5,-.05,.38,-.3),e.quadraticCurveTo(.22,-.12,0,-.38),e.quadraticCurveTo(-.22,-.12,-.38,-.3),e.quadraticCurveTo(-.5,-.05,-.7,-.2),e.quadraticCurveTo(-.8,0,-1,-.05),e.quadraticCurveTo(-.95,.2,-1.15,.45),e.quadraticCurveTo(-.5,.5,-.12,.22),e.lineTo(-.08,.42),e.closePath();let t=new j;t.moveTo(0,.62),t.quadraticCurveTo(.35,.82,.62,.62),t.quadraticCurveTo(1.05,.35,.9,-.25),t.quadraticCurveTo(.72,-.78,.25,-.68),t.quadraticCurveTo(0,-.8,-.25,-.68),t.quadraticCurveTo(-.72,-.78,-.9,-.25),t.quadraticCurveTo(-1.05,.35,-.62,.62),t.quadraticCurveTo(-.35,.82,-.05,.62),t.quadraticCurveTo(-.1,.85,.08,1),t.lineTo(.16,.92),t.quadraticCurveTo(.06,.8,0,.62);let n=new j;n.moveTo(-.6,-.8),n.lineTo(-.6,.2),n.absarc(0,.2,.6,Math.PI,0,!0),n.lineTo(.6,-.8);for(let e=0;e<4;e++){let t=.6-e*.3;n.quadraticCurveTo(t-.075,-.62,t-.15,-.8),n.quadraticCurveTo(t-.225,-.98,t-.3,-.8)}let r=new j;return r.absarc(0,0,.9,Math.PI*.3,Math.PI*1.7,!1),r.absarc(.38,0,.72,Math.PI*1.62,Math.PI*.38,!0),[e,t,n,r,e,n]}var hn=new b(0,1+un,ln),gn=class extends Zt{djRoutine=`decks`;scratch=0;onEvent(e,t){let n=this.w.rig,r=t.music;switch(e.type){case`danceBeat`:n.kick(-(.9+1.3*r.hype),0),e.beat%8==0&&(this.chooseDJ(r),(r.section===R.Peak||r.section===R.Groove)&&this.rng.chance(.12+.2*r.hype)&&this.startSwirl(r,0,2));return;case`hat`:this.scratch=e.strength;return;case`drop`:this.djRoutine=`hype`,this.jump(t.time,0,.3),this.wooUntil=t.time+1,this.rng.chance(.6)&&this.startSwirl(r,3,2);return;case`phraseStart`:this.rng.chance(.5)&&(this.djRoutine=`point`);break;case`section`:this.chooseDJ(r)}super.onEvent(e,t)}chooseDJ(e){let t=e.section===R.Calm?[[`decks`,3],[`headphone`,2]]:e.section===R.Build?[[`headphone`,3],[`point`,1.5],[`decks`,1]]:e.section===R.Peak?[[`fist`,3],[`hype`,2],[`wave`,2],[`decks`,1]]:[[`decks`,4],[`fist`,1.5],[`headphone`,1]];this.djRoutine=this.rng.weighted(t),this.side=this.rng.chance(.5)?1:-1}arms(e,t,n,r){let[i,a]=this.w.arms,o=this.side>0?a:i,s=this.side>0?i:a,c=Math.exp(-r*8),l=(e,n)=>e.target({raise:.3,fwd:1.1+.16*this.scratch*Math.sin(t.time*30+n),inward:.4,elbow:.25});if(this.scratch*=Math.exp(-e*6),t.music.presence<.3){l(i,0),l(a,1);return}switch(this.djRoutine){case`decks`:l(i,0),l(a,1.3);break;case`headphone`:o.target({raise:1.9,fwd:.2,inward:.55,elbow:2.4}),l(s,0);break;case`fist`:o.target({raise:2.3+.3*c,fwd:.3,inward:.1,elbow:1.3-1.1*c}),l(s,0);break;case`hype`:{let e=.12*Math.sin(t.time*10);i.target({raise:2.7+e,fwd:.2,inward:0,elbow:.2}),a.target({raise:2.7-e,fwd:.2,inward:0,elbow:.2});break}case`point`:o.target({raise:1.7+.2*c,fwd:1.1,inward:-.1,elbow:.05}),l(s,0);break;case`wave`:{let e=Math.sin(Math.PI*n/2);i.target({raise:2.5-.35*e,fwd:.3,inward:0,elbow:.25}),a.target({raise:2.5+.35*e,fwd:.3,inward:0,elbow:.25});break}}}},_n=class{group=new f;shadows=new f;all=[];dancers=[];heroes=[];dj;targets=[];yawToStage=new Map;rng=new F(2024);meter=new yn;constructor(e,t,n){let r=new Bt(St(),1,t);r.placeAt(hn.x,hn.z,0),r.home.y=hn.y,this.dj=new gn(r,1),this.add(this.dj,0);let i=[[-1.3,-1.1],[1.3,-1.1],[-3.8,-.8],[3.8,-.8],[0,-.7]];Ct().forEach((e,n)=>{let r=new Bt(e,100+n,t),[a,o]=i[n],s=new Zt(r,100+n);this.place(s,a,o),this.heroes.push(s)});let a=[];for(let t=0;a.length<e&&t<14;t++){let e=.35+t*1.35,n=5+t*.75,r=Math.round(n*2/1.45);for(let o=0;o<=r;o++){let s=-n+o/r*n*2+this.rng.range(-.3,.3)+t%2*.35,c=e+this.rng.range(-.35,.35);i.some(([e,t])=>Math.hypot(e-s,t-c)<1.3)||a.push([s,c])}}a.sort((e,t)=>Math.hypot(e[0],e[1]+1)-Math.hypot(t[0],t[1]+1));for(let n=0;n<Math.min(e,a.length);n++){let[e,r]=a[n],i=new Zt(new Bt(bt(n+1),500+n,n<30?t:`low`),500+n);i.crowd=!0,i.retune(),this.place(i,e,r),n%3==0&&this.targets.push(new b(e,.8,r))}this.applyPalette(n),Be(()=>{for(let e of this.dancers)e.retune()})}activity(){return this.meter.value}place(e,t,n){let r=Math.atan2(hn.x-t,hn.z-n);e.w.placeAt(t,n,r),this.add(e,r)}add(e,t){this.all.push(e.w),this.dancers.push(e),this.yawToStage.set(e,t),this.group.add(e.w.root),this.shadows.add(e.w.shadow)}applyPalette(e){for(let t of this.all)t.applyPalette(e)}onEvent(e,t){for(let n of this.dancers)n.onEvent(e,{...t,stageYaw:this.yawToStage.get(n)})}wave(e,t,n){for(let r of this.dancers){if(r===this.dj)continue;let i=r.w.home.x,a=I(((t?i:-i)+14)/28)*n*4;r.jump(e,a,.32)}}swirlRipple(e,t){for(let n of this.dancers){if(n===this.dj)continue;let r=Math.hypot(n.w.home.x,n.w.home.z+1);n.startSwirl(e,Math.min(6,Math.round(r/2.5)),2,t)}}zombieWalk(e,t=4){for(let n of this.dancers)n!==this.dj&&n.startZombie(e,t)}setSkin(e){for(let t of this.all)t.setSkin(e)}update(e,t,n,r){for(let i of this.dancers){let a=i.lookAtCamera>0?Math.atan2(r.position.x-i.w.home.x,r.position.z-i.w.home.z):null;i.update(e,{music:t,time:n,stageYaw:this.yawToStage.get(i),cameraYaw:a}),i.w.update(e)}this.meter.update(e,t,{crowd:this.dancers.filter(e=>e.crowd),heroes:this.heroes,yellow:this.heroes.slice(2,3)})}},vn=4,yn=class{value={crowd:bn(),heroes:bn(),yellow:bn()};snaps=[];t=0;sinceSnap=1;update(e,t,n){this.t+=e;let r=Object.keys(n),i=1-Math.exp(-e*1.5);for(let e of r){let t=n[e];if(!t.length)continue;let r=0,a=0,o=0;for(let e of t){let t=e.w.rig;r+=Math.abs(t.tiltX.v)+Math.abs(t.tiltZ.v)+Math.abs(t.stretch.v)+Math.abs(t.twist.v)+.3*Math.abs(t.vy),e.swirling&&a++,t.airborne&&o++}let s=this.value[e];s.motion+=(r/t.length-s.motion)*i,s.swirling=a/t.length,s.airborne=o/t.length}if(this.sinceSnap+=e,this.sinceSnap<.25)return;this.sinceSnap=0;let a={};for(let e of r)a[e]=n[e].reduce((e,t)=>[e[0]+t.hops,e[1]+t.twitches],[0,0]);for(this.snaps.push({t:this.t,beat:t.danceBeatPos,counts:a});this.snaps.length>2&&this.t-this.snaps[1].t>=vn;)this.snaps.shift();let o=this.snaps[0],s=this.snaps[this.snaps.length-1],c=s.beat-o.beat;for(let e of r){let r=n[e].length;if(!r)continue;let i=c>.5&&t.playing;this.value[e].hops=i?(s.counts[e][0]-o.counts[e][0])/(r*c):0,this.value[e].twitch=i?(s.counts[e][1]-o.counts[e][1])/(r*c):0}}};function bn(){return{hops:0,twitch:0,motion:0,swirling:0,airborne:0}}var xn=new b(0,1+un+1,ln);function Sn(e){e.y<1.3&&e.z<-2.75&&(e.z=-2.75)}function Cn(e,t){let n=16/9;if(t>=n)return e;t=Math.max(t,1);let r=Math.tan(ye.degToRad(e)/2)*n;return Math.min(100,ye.radToDeg(2*Math.atan(r/t)))}var wn=class{crowd;camera;current;prev=null;blend=1;blendDur=0;rng=new F(77);shake=0;fovPunch=0;barsInShot=0;recent=[];locked=null;tmpE=new b;tmpT=new b;constructor(e,t){this.crowd=t,this.camera=new ne(42,e,.1,200),this.current=this.makeShot(`wide`,16),this.evaluate(this.current)}makeShot(e,t){return{kind:e,t:0,dur:t,seed:this.rng.next(),hero:this.rng.int(this.crowd.heroes.length),eye:new b,target:new b,fov:42}}go(e,t,n){this.prev=n>0?{...this.current,eye:this.current.eye.clone(),target:this.current.target.clone()}:null,this.current=this.makeShot(e,t),this.blend=n>0?0:1,this.blendDur=n,this.barsInShot=0,this.recent.push(e),this.recent.length>4&&this.recent.shift(),e===`heroClose`&&(this.crowd.heroes[this.current.hero].lookAtCamera=t)}onBar(e){if(this.locked)return;this.barsInShot++;let t=e.section,n=e.playing?t===R.Calm?8:t===R.Build?4:t===R.Peak?2:4:8;if(this.barsInShot<n)return;let r=60/e.bpm,i=e.playing?t===R.Calm?[[`orbit`,2],[`djClose`,2],[`heroClose`,3*e.vocal],[`wide`,2],[`crowdDolly`,2]]:t===R.Build?[[`djClose`,3],[`stageSide`,2],[`crowdDolly`,2],[`wide`,1]]:t===R.Peak?[[`overhead`,2],[`crowdDolly`,3],[`djReverse`,2],[`wide`,2],[`heroClose`,1.5],[`orbit`,1]]:[[`crowdDolly`,3],[`djClose`,2],[`djReverse`,1.5],[`heroClose`,2*(.3+e.vocal)],[`wide`,2],[`stageSide`,1.5],[`orbit`,1.2]]:[[`orbit`,3],[`wide`,2],[`crowdDolly`,1]],a=i.filter(([e])=>!this.recent.slice(-2).includes(e)),o=this.rng.weighted(a.length?a:i),s=!e.playing||t===R.Calm?2.5:t===R.Build?1.2:0;this.go(o,n*4*r+2,s)}onDrop(){this.locked||(this.go(this.rng.chance(.5)?`crane`:`overhead`,10,0),this.shake=1,this.fovPunch=1)}onPhraseStart(e){!this.locked&&e.playing&&this.barsInShot>=2&&this.rng.chance(.35)&&this.go(this.rng.chance(.6)?`heroClose`:`djClose`,8,e.section===R.Calm?1.5:0)}evaluate(e){let t=e.t,n=I(t/Math.max(1,e.dur)),r=e.seed,i=e.eye,a=e.target;switch(e.fov=42,e.kind){case`wide`:{let t=(r-.5)*8;i.set(t*(1-n*.5),6.2-n*.8,19-n*3),a.set(t*.2,2.4,-3),e.fov=40;break}case`djClose`:{let o=(r-.5)*.9+Math.sin(t*.15)*.25,s=4.4-n*.9;i.set(Math.sin(o)*s,xn.y+.15+.2*Math.sin(t*.2),ln+Math.cos(o)*s),a.copy(xn).add(this.tmpT.set(0,-.15,0)),e.fov=34;break}case`djReverse`:{let t=r>.5?1:-1;i.set(t*(1.3+.3*n),3.4,ln-2.2),a.set(t*-1.5,.9,5),e.fov=48;break}case`crowdDolly`:{let t=r>.5?1:-1,o=t*(-6+12*n);i.set(o,1.55,-2.75),a.set(o*.7+t*1.5,.7,4),e.fov=46;break}case`heroClose`:{let t=this.crowd.heroes[e.hero].w,o=t.home,s=t.height*t.look.scale*.62,c=Math.atan2(-o.x,ln-o.z),l=1.75-n*.25,u=(r-.5)*.7,d=t.rig.y*.35;i.set(o.x+Math.sin(c+u)*l,s+.28+d*.5,o.z+Math.cos(c+u)*l),a.set(o.x,s-.05+d,o.z),e.fov=38;break}case`crane`:{let n=et(I(t/6));i.set(Math.sin(t*.2)*2,1.2+n*9,-1.5+n*11),a.set(0,.5,2-n*2),e.fov=50;break}case`overhead`:{let n=t*.12+r*6;i.set(Math.sin(n)*3,13.5,6+Math.cos(n)*3),a.set(0,0,4.5),e.fov=52;break}case`orbit`:{let n=(r-.5)*2+t*.07*(r>.5?1:-1);i.set(Math.sin(n)*11,4.2,5+Math.cos(n)*11),a.set(0,1.2,1),e.fov=44;break}case`stageSide`:{let t=r>.5?1:-1;i.set(t*(8.5-n),3.2,-4.8+n*.6),a.set(-t*1,1.6,-1.5),e.fov=44;break}}}update(e,t,n){this.current.t+=e,this.evaluate(this.current),Sn(this.current.eye);let r=this.tmpE.copy(this.current.eye),i=this.tmpT.copy(this.current.target),a=this.current.fov;if(this.prev&&this.blend<1){this.prev.t+=e,this.evaluate(this.prev),this.blend=Math.min(1,this.blend+e/this.blendDur);let t=et(this.blend);r.lerpVectors(this.prev.eye,this.current.eye,t),i.lerpVectors(this.prev.target,this.current.target,t),a=this.prev.fov+(this.current.fov-this.prev.fov)*t}let o=.06;r.x+=Math.sin(n*.53)*o+Math.sin(n*1.31)*o*.4,r.y+=Math.sin(n*.71)*o*.6+t.kickPulse*.03*t.hype,this.shake=Math.max(this.shake*Math.exp(-e*2.5),t.section===R.Peak?.12*t.kickPulse:0),this.shake>.001&&(r.x+=(Math.sin(n*37)+Math.sin(n*23))*.06*this.shake,r.y+=(Math.sin(n*41)+Math.sin(n*29))*.05*this.shake),this.fovPunch*=Math.exp(-e*3),this.camera.position.copy(r),this.camera.lookAt(i),this.camera.fov=Cn(a-6*this.fovPunch,this.camera.aspect),this.camera.updateProjectionMatrix()}};function Tn(e,t){tn(e,P.id===`spooky`&&t===Y.plasma?Y.moon:t)}var En=class{rig;u;crowd;confetti;cam;rng=new F(314);bar=0;forceSwirl=!1;forceZombie=!1;spookySong=()=>!1;constructor(e,t,n,r,i){this.rig=e,this.u=t,this.crowd=n,this.confetti=r,this.cam=i}onEvent(e,t,n){switch(e.type){case`kick`:en(this.u);break;case`beat`:e.barBeat===0&&this.onBar(t,n),t.section===R.Peak&&t.hype>.7&&e.barBeat%2==0&&this.rig.flash(n,.28),t.section===R.Build&&t.build>.85&&this.rig.flash(n,.18);break;case`drop`:this.confetti.burst(420,new b(0,8.2,3),new b(11,.3,5),1),this.rig.flash(n,.45),this.rig.program=`ballyhoo`,this.rig.laserProgram=`fan`,Tn(this.u,Y.checker),this.cam.onDrop();break;case`section`:this.applySection(t);break;case`phraseStart`:this.cam.onPhraseStart(t),t.section===R.Groove&&this.rng.chance(.4)&&Tn(this.u,P.id===`spooky`&&this.rng.chance(.5)?Y.eyes:Y.wave);break;case`musicStart`:this.applySection(t)}}onBar(e,t){this.bar++,this.rig.onBar(this.bar),this.cam.onBar(e),this.bar%8==0&&this.applySection(e,!0);let n=P.id===`spooky`,r=n&&this.spookySong()?2.5:1,i=!1;if(n&&e.hype>.3&&(this.forceZombie?i=this.bar%8==3:e.section===R.Peak&&this.bar%16==8?i=this.rng.chance(.4*r):e.section===R.Groove&&this.bar%16==4&&(i=this.rng.chance(.25*r)),i&&this.crowd.zombieWalk(e,4)),!i&&e.section===R.Peak&&this.bar%16==8&&this.rng.chance(.6)&&this.crowd.wave(t,this.rng.chance(.5),60/e.danceBpm),this.forceSwirl&&this.bar%4==1){let t=this.rng.chance(.5)?1:-1;this.crowd.swirlRipple(e,t),this.crowd.dj.startSwirl(e,0,2,t)}else e.hype>.55&&(e.section===R.Peak&&this.bar%16==0&&this.rng.chance(.5*N.swirl)||e.section===R.Groove&&this.bar%16==12&&this.rng.chance(.25*N.swirl))&&this.crowd.swirlRipple(e,this.rng.chance(.5)?1:-1);e.section===R.Peak&&this.rng.chance(.3)&&this.confetti.burst(60,new b(this.rng.range(-8,8),8.2,2),new b(2,.2,2),.5)}applySection(e,t=!1){let n=e.section,r=e=>this.rng.pick(e),i=e=>this.rng.pick(e);if(!e.playing){this.rig.program=`calm`,this.rig.laserProgram=`off`,Tn(this.u,Y.plasma);return}switch(n){case R.Calm:this.rig.program=`calm`,this.rig.laserProgram=`off`,Tn(this.u,Y.plasma);break;case R.Groove:this.rig.program=r([`sweep`,`crowd`,`fan`]),this.rig.laserProgram=e.hype>.65?i([`fan`,`scan`,`off`]):`off`,Tn(this.u,this.rng.pick(P.id===`spooky`?[Y.eq,Y.eyes,Y.tunnel,Y.eyes]:[Y.eq,Y.wave,Y.tunnel]));break;case R.Build:this.rig.program=t?r([`fan`,`center`]):`center`,this.rig.laserProgram=`scan`,Tn(this.u,Y.tunnel);break;case R.Peak:this.rig.program=r([`ballyhoo`,`sweep`,`fan`]),this.rig.laserProgram=i([`fan`,`tunnel`,`scan`]),Tn(this.u,this.rng.pick([Y.checker,Y.tunnel,Y.eq]))}}},Dn=[`logos/omarchy.png`,`logos/ridgetopai.png`],On=class{u;logos=Dn.map(()=>null);rng=new F(2718);idx=this.rng.int(Dn.length);wait=this.rng.range(35,60);t=-1;hold=0;lastBar=-1;demo=!1;halloween=null;constructor(e){this.u=e,this.drawHalloween(),Dn.forEach((e,t)=>{new m().load(new URL(e,document.baseURI).href,e=>{e.generateMipmaps=!1,e.minFilter=x;let n=e.image;this.logos[t]={tex:e,aspect:n.width/n.height}})})}update(e,t){let n=this.u,r=Math.floor(t.danceBeatPos/4),i=r!==this.lastBar;this.lastBar=r;let a=n.uMarqueeMix.value>.02||n.uArtMix.value>.05;if(this.t<0){this.demo&&(this.wait=Math.min(this.wait,3)),t.playing&&t.presence>.6&&(this.wait-=e),n.uLogoMix.value*=Math.exp(-e*3);let r=P.id===`spooky`&&this.halloween?[...this.logos,this.halloween]:this.logos,o=r[this.idx%r.length];if(this.wait<=0&&i&&!a&&o&&t.section!==R.Build){this.idx=(this.idx+1)%r.length,n.uLogo.value=o.tex,n.uLogoAspect.value=o.aspect;let e=240/Math.max(60,t.danceBpm);this.hold=Math.min(10,Math.max(5,3*e)),this.t=0}return}this.t+=e;let o=1.2,s=Math.min(1,this.t/.5)*Math.min(1,Math.max(0,(this.hold-this.t)/o));a&&(this.t=Math.max(this.t,this.hold-o*s)),s*=.95,n.uLogoMix.value=s,this.t>=this.hold&&(this.t=-1,n.uLogoMix.value=0,this.wait=this.demo?3:this.rng.range(60,120))}async drawHalloween(){let e=new FontFace(`Titan One`,`url(${new URL(`fonts/TitanOne-Regular.ttf`,document.baseURI).href})`);try{document.fonts.add(await e.load())}catch{}let t=document.createElement(`canvas`);t.width=1024,t.height=400;let n=t.getContext(`2d`);n.fillStyle=`#fff`,n.textAlign=`center`,n.textBaseline=`middle`,n.font=`150px "Titan One", sans-serif`,n.fillText(`HAPPY`,512,110),n.font=`170px "Titan One", sans-serif`,n.fillText(`HALLOWEEN`,512,290),n.save(),n.translate(780,50),n.scale(60,60),n.beginPath(),n.moveTo(0,-.2),n.quadraticCurveTo(.5,-.6,1.1,-.4),n.quadraticCurveTo(.9,0,.7,.1),n.quadraticCurveTo(.5,-.05,.35,.2),n.quadraticCurveTo(.15,.05,0,.35),n.quadraticCurveTo(-.15,.05,-.35,.2),n.quadraticCurveTo(-.5,-.05,-.7,.1),n.quadraticCurveTo(-.9,0,-1.1,-.4),n.quadraticCurveTo(-.5,-.6,0,-.2),n.fill(),n.restore();let r=new _e(t);r.generateMipmaps=!1,r.minFilter=x,this.halloween={tex:r,aspect:t.width/t.height}}},kn=14,An=class{u;canvas=document.createElement(`canvas`);tex;font;key=``;marqueeT=-1;artUrl=null;artReady=!1;idle=!1;silentT=0;track=null;constructor(e){this.u=e,this.canvas.width=1024,this.canvas.height=128,this.tex=new _e(this.canvas),this.tex.wrapS=fe,this.tex.colorSpace=se,e.uMarquee.value=this.tex;let t=new FontFace(`Titan One`,`url(${new URL(`fonts/TitanOne-Regular.ttf`,document.baseURI).href})`);this.font=t.load().then(e=>void document.fonts.add(e)).catch(()=>void 0)}onTrack(e){this.track=e;let t=`${e.title}\u0000${e.artist}`;e.playing&&e.title&&t!==this.key&&(this.key=t,this.drawText(e)),e.art!==this.artUrl&&(this.artUrl=e.art,this.artReady=!1,e.art&&new m().load(e.art,e=>{e.colorSpace=se,this.u.uArt.value?.dispose(),this.u.uArt.value=e,this.artReady=!0}))}async drawText(e){await this.font;let t=`${e.title.toUpperCase()}${e.artist?`  ·  `+e.artist.toUpperCase():``}`,n=this.canvas.getContext(`2d`);n.font=`92px "Titan One", sans-serif`;let r=Math.ceil(n.measureText(t).width);this.canvas.width=Math.min(8192,r+115.2+384),this.canvas.height=128,n.font=`92px "Titan One", sans-serif`,n.textBaseline=`middle`,n.fillStyle=`#fff`,n.clearRect(0,0,this.canvas.width,128),jn(n,192,128),n.fillText(t,307.2,69.12),this.tex.dispose(),this.tex.needsUpdate=!0,this.u.uMarqueeAspect.value=this.canvas.width/128,this.u.uMarqueeScroll.value=-.35,this.marqueeT=0}update(e,t){let n=this.u;if(this.silentT=t.playing?0:this.silentT+e,!this.idle&&this.silentT>4&&this.marqueeT<0&&(this.idle=!0,this.key=``,this.drawText({title:`Play something`,artist:`cliamp · Spotify · anything`})),this.idle&&t.playing&&(this.idle=!1,this.marqueeT>=0&&(this.marqueeT=12.8)),this.idle&&this.marqueeT>=0){this.marqueeT=Math.min(this.marqueeT+e,1),n.uMarqueeMix.value=.75*this.marqueeT,n.uMarqueeScroll.value+=e/6*(8/Math.max(4,n.uMarqueeAspect.value))*1.6,n.uArtMix.value*=Math.exp(-e*1.5);return}if(this.marqueeT>=0){this.marqueeT+=e;let t=this.marqueeT;n.uMarqueeMix.value=Math.min(1,t/.6)*Math.min(1,Math.max(0,(kn-t)/1.2)),n.uMarqueeScroll.value+=e/6*(8/Math.max(4,n.uMarqueeAspect.value))*2.2,t>kn&&(this.marqueeT=-1)}else n.uMarqueeMix.value=0;let r=this.track&&!this.track.playing&&!t.playing,i=this.artReady&&(t.section===R.Calm||r)?.85:0;n.uArtMix.value+=(i-n.uArtMix.value)*(1-Math.exp(-e*1.5))}};function jn(e,t,n){e.save(),e.translate(t,0),e.beginPath(),e.ellipse(n*.24,n*.7,n*.17,n*.13,-.4,0,Math.PI*2),e.fill(),e.fillRect(n*.36,n*.16,n*.07,n*.54),e.beginPath(),e.moveTo(n*.36,n*.14),e.quadraticCurveTo(n*.62,n*.24,n*.6,n*.5),e.quadraticCurveTo(n*.52,n*.34,n*.43,n*.32),e.closePath(),e.fill(),e.restore()}var Mn={uniforms:{tDiffuse:{value:null},uTime:{value:0},uFlash:{value:0},uFlashColor:{value:new T(1,1,1)},uCA:{value:0},uVignette:{value:.9},uGrain:{value:.035}},vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,fragmentShader:`
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
  `},Nn=class{composer;bloom;finish;constructor(e,t,n,r){let i=e.getSize(new y),a=new he(i.x,i.y,{type:g,samples:r===`high`?4:0});this.composer=new ke(e,a),this.composer.addPass(new Ne(t,n));let o=r===`high`?.5:.35;this.bloom=new je(new y(i.x*o,i.y*o),.6,.45,.85),this.composer.addPass(this.bloom),this.composer.addPass(new Fe),this.finish=new Ee(Mn),this.composer.addPass(this.finish)}setSize(e,t){this.composer.setSize(e,t)}update(e,t,n,r,i=!1){let a=this.finish.uniforms;a.uTime.value=e%100,a.uFlash.value=t,a.uCA.value=n,a.uVignette.value=r?.5:.95,this.bloom.strength=i?0:r?.35:.6,this.bloom.threshold=r?.95:.85}render(){this.composer.render()}},X=900;function Pn(){let e=new D(.055,.15,10,6);e.scale(1,1,.55);let t=e.attributes.position,n=[];for(let e=0;e<t.count;e++){let r=(t.getY(e)+.075)/.15,i=r>.72?[1,.97,.9]:r>.3?[1,.45,.05]:[1,.8,.1];n.push(...i)}return e.setAttribute(`color`,new p(n,3)),e}var Fn=class{p;mesh;candy;group=new f;kind=`confetti`;pos=new Float32Array(X*3);vel=new Float32Array(X*3);rot=new Float32Array(X*3);spin=new Float32Array(X*3);life=new Float32Array(X);colorIdx=new Uint8Array(X);rng=new F(99);m=new ge;q=new we;e=new i;v=new b;s=new b(1,1,1);next=0;c=new T;constructor(e){this.p=e;let t=new M(.13,.08),n=new k({side:2,roughness:.4,metalness:.3,emissive:16777215,emissiveIntensity:.25});this.mesh=new l(t,n,X),this.mesh.frustumCulled=!1,this.mesh.instanceMatrix.setUsage(a);for(let e=0;e<X;e++)this.mesh.setColorAt(e,new T(1,1,1)),this.m.makeScale(0,0,0),this.mesh.setMatrixAt(e,this.m);let r=new k({vertexColors:!0,roughness:.35,emissive:16777215,emissiveIntensity:.08});this.candy=new l(Pn(),r,X),this.candy.frustumCulled=!1,this.candy.instanceMatrix.setUsage(a),this.candy.visible=!1,this.group.add(this.mesh,this.candy)}setKind(e){if(e===this.kind)return;this.kind=e,this.mesh.visible=e===`confetti`,this.candy.visible=e===`candy`;let t=e===`candy`?this.candy:this.mesh;this.m.makeScale(0,0,0);for(let e=0;e<X;e++)t.setMatrixAt(e,this.m);t.instanceMatrix.needsUpdate=!0}burst(e,t,n,r=3){let i=this.rng;for(let a=0;a<e;a++){let e=this.next;this.next=(this.next+1)%X,this.pos.set([t.x+i.range(-n.x,n.x),t.y+i.range(-n.y,n.y),t.z+i.range(-n.z,n.z)],e*3),this.vel.set([i.range(-1.5,1.5),i.range(0,r),i.range(-.5,2.5)],e*3),this.rot.set([i.range(0,6),i.range(0,6),i.range(0,6)],e*3),this.spin.set([i.range(-9,9),i.range(-9,9),i.range(-9,9)],e*3),this.life[e]=i.range(5,8),this.colorIdx[e]=i.int(6)}}update(e){for(let t=0;t<X;t++){if(this.life[t]<=0)continue;this.life[t]-=e;let n=t*3;this.vel[n+1]-=3.2*e;let r=Math.exp(-e*1.8);this.vel[n]*=r,this.vel[n+1]=Math.max(this.vel[n+1]*r,-1.3),this.vel[n+2]*=r,this.pos[n]+=(this.vel[n]+Math.sin(this.rot[n]*2)*.4)*e,this.pos[n+1]+=this.vel[n+1]*e,this.pos[n+2]+=this.vel[n+2]*e,this.pos[n+1]<.02&&(this.pos[n+1]=.02,this.vel[n]=this.vel[n+1]=this.vel[n+2]=0,this.spin[n]=this.spin[n+1]=this.spin[n+2]=0,this.rot[n]=Math.PI/2);for(let t=0;t<3;t++)this.rot[n+t]+=this.spin[n+t]*e;let i=Math.min(1,this.life[t]/1.2);this.q.setFromEuler(this.e.set(this.rot[n],this.rot[n+1],this.rot[n+2])),this.v.set(this.pos[n],this.pos[n+1],this.pos[n+2]),this.s.setScalar(i),this.m.compose(this.v,this.q,this.s),this.kind===`candy`?this.candy.setMatrixAt(t,this.m):(this.mesh.setMatrixAt(t,this.m),this.mesh.setColorAt(t,this.c.copy(this.p.lights[this.colorIdx[t]])))}let t=this.kind===`candy`?this.candy:this.mesh;t.instanceMatrix.needsUpdate=!0,t.instanceColor&&(t.instanceColor.needsUpdate=!0)}};function In(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`),n=new F(5);t.clearRect(0,0,256,256);for(let e=0;e<60;e++){let e=n.range(40,216),r=n.range(60,196),i=n.range(30,90),a=t.createRadialGradient(e,r,0,e,r,i);a.addColorStop(0,`rgba(255,255,255,0.08)`),a.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=a,t.fillRect(0,0,256,256)}let r=new _e(e);return r.colorSpace=se,r}var Ln=class{p;group=new f;sprites=[];mat;constructor(e){this.p=e,this.mat=new o({map:In(),transparent:!0,depthWrite:!1,blending:2,opacity:.12});let t=new F(11);for(let e=0;e<26;e++){let e=new v(this.mat),n=new b(t.range(-14,14),t.range(.6,5),t.range(-9,12));e.position.copy(n),e.scale.setScalar(t.range(7,13)),this.group.add(e),this.sprites.push({s:e,base:n,ph:t.range(0,6)})}}update(e,t){this.mat.color.copy(this.p.haze),this.mat.opacity=(this.p.light?.06:.1)*(.6+.4*t.presence)+.06*t.dropPulse;for(let t of this.sprites)t.s.position.set(t.base.x+Math.sin(e*.05+t.ph)*2,t.base.y+Math.sin(e*.07+t.ph*2)*.4,t.base.z)}},Rn=`
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
`,zn=`
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
`,Bn=`
varying vec2 vUv;
varying float vCamDist;
void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vCamDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
`,Vn=`
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
`,Hn=class{p;group=new f;heads=[];spots=[];key;rim;hemi;djLight;program=`calm`;laserProgram=`off`;strobe=0;strobeEnabled=!0;hideLasers=!1;lasers=[];laserLevel=0;colorShift=0;rng=new F(4242);lastStrobe=-10;tmp=new b;constructor(e,t,n){this.p=e,this.hemi=new Te(16777215,2236962,.6),this.key=new _(16777215,.9),this.key.position.set(4,12,14),this.rim=new _(16777215,1.2),this.rim.position.set(0,16,-9),this.group.add(this.hemi,this.key,this.rim);for(let e=0;e<4;e++){let t=new Se(16777215,60,40,.5,.6,1.2);t.position.set(-9+e*6,8.2,-3.2),t.target.position.set(-6+e*4,0,4+e%2*3),this.group.add(t,t.target),this.spots.push(t)}this.djLight=new Se(16777215,40,20,.28,.5,1.2),this.djLight.position.set(0,8.2,-1.5),this.djLight.target.position.set(0,2.5,cn-.9),this.group.add(this.djLight,this.djLight.target);let r=new A(.09,1.9,18,32,1,!0);r.translate(0,-9,0);let i=new k({color:1381660,roughness:.5,metalness:.6});t.forEach((e,t)=>{let a=new f;a.position.copy(e);let o=new E(new O(.34,.42,.34),i);a.add(o);let s=new w({color:16777215}),c=new E(new be(.13,20),s);c.rotation.x=Math.PI/2,c.position.y=-.215,a.add(c);let l=new xe({uniforms:{uColor:{value:new T},uIntensity:{value:0},uTime:{value:0}},vertexShader:Rn,fragmentShader:zn,transparent:!0,depthWrite:!1,blending:2,side:2}),u=new E(r,l);u.frustumCulled=!1,a.add(u),this.group.add(a),this.heads.push({base:e.clone(),yoke:a,beam:u,mat:l,lens:s,pan:0,tilt:.3,panT:0,tiltT:.3,intensity:0,target:n[t%n.length].clone(),colorIdx:t%6})});let a=new M(.07,34),o=new M(.07,34).rotateY(Math.PI/2),s=Me([a,o]);s.translate(0,17,0),[new b(0,8.1,-9.3),new b(-10,1.3,-3.3),new b(10,1.3,-3.3)].forEach((e,t)=>{let n=t===0?10:6;for(let r=0;r<n;r++){let n=new xe({uniforms:{uColor:{value:new T},uIntensity:{value:0}},vertexShader:Bn,fragmentShader:Vn,transparent:!0,depthWrite:!1,blending:2,side:2}),i=new E(s,n);i.position.copy(e),i.frustumCulled=!1,i.visible=!1,this.group.add(i),this.lasers.push({mesh:i,mat:n,i:r,src:t})}})}retarget(e){for(let t of this.heads)t.target.copy(this.rng.pick(e))}onBar(e){e%2==0&&(this.colorShift=(this.colorShift+1)%6)}update(e,t,n,r){let i=this.p,a=t.presence,o=t.hype,s=t.beatPos,c=t.beatPhase;this.hemi.color.copy(i.lights[0]).lerp(new T(1,1,1),.6),this.hemi.groundColor.copy(i.bgDeep).multiplyScalar(i.light?.35:1),this.hemi.intensity=i.mono?i.light?.45:.3+.15*a:i.light?.8:.55+.25*a,this.key.intensity=i.mono?1.5:i.light?1.2:.75,this.rim.color.copy(i.lights[1%i.lights.length]),this.rim.intensity=.9+.8*t.kickPulse*a+.5*o,this.spots.forEach((e,t)=>{e.color.copy(i.lights[(t+this.colorShift)%6]);let n=Math.exp(-((c*4-t)%4+4)%4*1.2);e.intensity=(12+26*o+22*n*o)*(.35+.65*a)*(i.mono?.35:1)}),this.djLight.color.copy(i.fg).lerp(i.lights[0],.3),this.djLight.intensity=18+14*t.vocal+10*t.kickPulse;let l=a<.2?`calm`:this.program;this.heads.forEach((t,r)=>{let u=this.heads.length,d=r/(u-1)-.5,f=0;switch(l){case`sweep`:{let e=s/8*Math.PI*2;t.panT=Math.PI+.55*Math.sin(e+r*.35),t.tiltT=.45+.25*Math.sin(e*.5+r*.5),f=.7+.3*o;break}case`crowd`:this.aimAt(t,t.target),f=.55+.35*o;break;case`fan`:t.panT=Math.PI+d*1.6,t.tiltT=.35+.15*Math.sin(s*Math.PI*.5),f=.3+.9*Math.exp(-(((s*2-r)%u+u)%u)*.9);break;case`center`:this.aimAt(t,this.tmp.set(0,2.6,cn-1)),f=.8;break;case`ballyhoo`:{let e=n*2.4+r*.9;t.panT=Math.PI+.7*Math.sin(e),t.tiltT=.55+.35*Math.cos(e*1.3),f=.9+.3*Math.exp(-c*5);break}case`calm`:t.panT=Math.PI+.3*Math.sin(n*.15+r),t.tiltT=.25+.1*Math.sin(n*.2+r*.7),f=r%3==0?.35*(.4+.6*a):.05;break;case`off`:f=0}f*=.7+.5*Math.exp(-c*4)*a,t.intensity=L(t.intensity,f,10,e);let p=l===`ballyhoo`?14:5;t.pan=L(t.pan,t.panT,p,e),t.tilt=L(t.tilt,t.tiltT,p,e),t.yoke.rotation.set(t.tilt,t.pan,0,`YXZ`);let m=i.lights[(t.colorIdx+this.colorShift)%6];t.mat.uniforms.uColor.value.copy(m),t.mat.uniforms.uIntensity.value=t.intensity*(i.light?.05:i.mono?.6:.28),t.mat.uniforms.uTime.value=n,t.lens.color.copy(m).multiplyScalar(.5+3*t.intensity)}),l===`crowd`&&r.length&&this.rng.chance(e*.3)&&this.retarget(r);let u=a<.3?`off`:this.laserProgram;this.laserLevel=L(this.laserLevel,u===`off`?0:1,6,e);for(let e of this.lasers){let r=this.laserLevel>.01&&!this.hideLasers;if(e.mesh.visible=r,!r)continue;let a=e.src===0?10:6,o=e.i/(a-1)-.5,l=e.src===1?1:e.src===2?-1:0,d=0,f=0;switch(u){case`fan`:d=o*1.5,f=-.95+.2*Math.sin(s*Math.PI*.5);break;case`scan`:d=o*.9+.6*Math.sin(s*Math.PI*.25),f=-.9+.1*Math.sin(s*Math.PI+o*3);break;case`tunnel`:{let t=e.i/a*Math.PI*2+n*.8;d=.35*Math.cos(t),f=-.95+.22*Math.sin(t);break}}l&&(d=d*.6+l*.7),e.src===0&&(f=-2.05-(f+.95)*.8),e.mesh.rotation.set(0,0,0),e.mesh.rotateY(d),e.mesh.rotateX(-f);let p=.75+.25*Math.exp(-c*6)+.3*t.hatPulse;e.mat.uniforms.uColor.value.copy(i.lights[(e.i+this.colorShift+e.src)%6]),e.mat.uniforms.uIntensity.value=this.laserLevel*p*(i.light?.5:1.6)}this.strobe*=Math.exp(-e*22)}flash(e,t){this.strobeEnabled&&(e-this.lastStrobe<1/3||(this.lastStrobe=e,this.strobe=Math.max(this.strobe,t)))}aimAt(e,t){let n=this.tmp.copy(t).sub(e.base);e.panT=Math.atan2(-n.x,-n.z),e.panT<0&&(e.panT+=Math.PI*2);let r=Math.hypot(n.x,n.z);e.tiltT=Math.atan2(r,-n.y)}},Un=64,Wn=5;function Gn(){let e=[],t=[],n=[],r=[.05,.04,.07],i=(i,a,o,s,c=r)=>{e.push(...i,...a,...o),t.push(...s),n.push(...c,...c,...c)};for(let e of[-1,1]){let t=[e*.04,0,.1],n=[e*.04,0,-.12],r=[e*.55,.06,.02],a=[e*.4,0,-.1],o=[e*.24,0,-.07],s=[e*.12,0,-.14],c=e=>Math.abs(e[0])/.55;i(t,r,a,[0,1,c(a)]),i(t,a,o,[0,c(a),c(o)]),i(t,o,s,[0,c(o),c(s)]),i(t,s,n,[0,c(s),0])}i([0,.02,.16],[-.05,.02,0],[.05,.02,0],[0,0,0]),i([-.05,.02,0],[0,.02,-.16],[.05,.02,0],[0,0,0]);for(let e of[-1,1])i([e*.015,.02,.12],[e*.045,.02,.1],[e*.035,.09,.13],[0,0,0]),i([e*.02,.035,.15],[e*.04,.035,.14],[e*.03,.05,.155],[0,0,0],[3,.3,.3]);let a=new C;return a.setAttribute(`position`,new p(e,3)),a.setAttribute(`aWing`,new p(t,1)),a.setAttribute(`color`,new p(n,3)),a}var Kn=class{mesh;bats=[];rng=new F(666);uTime={value:0};m=new ge;q=new we;s=new b;fwd=new b(0,0,1);dir=new b;goal=new b;t=0;constructor(){let e=new w({vertexColors:!0,side:2});e.onBeforeCompile=e=>{e.uniforms.uTime=this.uTime,e.vertexShader=e.vertexShader.replace(`#include <common>`,`#include <common>
attribute float aWing;
attribute float aPhase;
uniform float uTime;`).replace(`#include <begin_vertex>`,`#include <begin_vertex>
          float flap = sin(uTime * 22.0 + aPhase);
          transformed.y += flap * aWing * 0.32;
          transformed.x *= 1.0 - 0.18 * aWing * (0.5 + 0.5 * flap);`)},e.customProgramCacheKey=()=>`wobble-bats`;let t=Gn(),n=new Float32Array(Un);for(let e=0;e<Un;e++)n[e]=this.rng.range(0,6.28);t.setAttribute(`aPhase`,new ee(n,1)),this.mesh=new l(t,e,Un),this.mesh.frustumCulled=!1,this.mesh.instanceMatrix.setUsage(a);for(let e=0;e<Un;e++){let t={pos:new b,vel:new b,mode:e<Wn?3:0,life:0,orbit:this.rng.range(0,6.28),radius:this.rng.range(4,9),height:this.rng.range(5.5,8.5),exit:new b,scale:this.rng.range(.8,1.25)};t.mode===3&&(t.radius=this.rng.range(8,12),t.height=this.rng.range(8,10),t.pos.set(Math.sin(t.orbit)*t.radius,t.height,5+Math.cos(t.orbit)*t.radius)),this.bats.push(t)}}burst(e){let t=0;for(let n of this.bats){if(t>=e)break;if(n.mode!==0)continue;t++,n.mode=1,n.life=this.rng.range(4,8),n.pos.set(this.rng.range(-6,6),this.rng.range(5.5,8),-10),n.vel.set(this.rng.range(-2,2),this.rng.range(1,3),this.rng.range(5,9)),n.orbit=this.rng.range(0,6.28);let r=this.rng.chance(.5)?1:-1;n.exit.set(r*this.rng.range(22,30),this.rng.range(7,12),this.rng.range(-4,18))}}update(e,t){this.t+=e,this.uTime.value=this.t;let n=this.rng;for(let r=0;r<Un;r++){let i=this.bats[r];if(i.mode===0){this.m.makeScale(0,0,0),this.mesh.setMatrixAt(r,this.m);continue}i.mode===1&&(i.life-=e,i.life<=0&&(i.mode=2));let a=i.mode===3?.25:.55+.25*t.hype;i.orbit+=e*a*(r%2?1:-1),i.mode===2?this.goal.copy(i.exit):this.goal.set(Math.sin(i.orbit)*i.radius,i.height+.8*Math.sin(this.t*1.7+r),4+Math.cos(i.orbit)*i.radius*.7),this.dir.subVectors(this.goal,i.pos);let o=i.mode===3?.6:1.4;i.vel.addScaledVector(this.dir,o*e),i.vel.x+=n.range(-1,1)*9*e,i.vel.y+=n.range(-1,1)*6*e,i.vel.z+=n.range(-1,1)*9*e;let s=i.mode===3?3.5:8,c=i.vel.length();c>s&&i.vel.multiplyScalar(s/c),i.vel.multiplyScalar(Math.exp(-e*.3)),i.pos.addScaledVector(i.vel,e),i.mode===2&&this.dir.length()<3&&(i.mode=0);let l=i.mode===3?Math.min(1,t.presence*1.5):1;this.q.setFromUnitVectors(this.fwd,this.dir.copy(i.vel).normalize()),this.s.setScalar(i.scale*1.3*l),this.m.compose(i.pos,this.q,this.s),this.mesh.setMatrixAt(r,this.m)}this.mesh.instanceMatrix.needsUpdate=!0}},qn=`
varying vec3 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xyz;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`,Z={x0:-28,z0:-5,w:56,d:34,cell:.4},Jn=Math.round(Z.w/Z.cell),Yn=Math.round(Z.d/Z.cell),Xn=.7,Zn=.05,Qn=`
${nn}
const vec2 MASK_MIN = vec2(${Z.x0.toFixed(1)}, ${Z.z0.toFixed(1)});
const vec2 MASK_SIZE = vec2(${Z.w.toFixed(1)}, ${Z.d.toFixed(1)});
uniform vec3 uColor;
uniform float uDensity;
uniform float uLayer;
uniform sampler2D uMask;
varying vec3 vW;
float fbm(vec2 p) {
  float a = 0.0, w = 0.5;
  for (int i = 0; i < 4; i++) { a += w * noise2(p); p = p * 2.03 + 17.1; w *= 0.5; }
  return a;
}
void main() {
  vec2 p = vW.xz;
  vec2 drift = vec2(uTime * 0.05, uTime * 0.018) * (1.0 + uLayer * 0.6);
  float n = fbm(p * 0.22 + drift + uLayer * 3.7);
  n *= 0.75 + 0.5 * fbm(p * 0.5 - drift * 1.7);
  // Kick rings pushed out from the booth.
  float d = length(p - vec2(0.0, -4.0));
  float ring = 0.0;
  for (int i = 0; i < 4; i++) {
    float t = uKicks[i];
    ring += smoothstep(1.6, 0.0, abs(d - t * 9.0)) * exp(-t * 1.8);
  }
  float a = smoothstep(0.25, 0.7, n + 0.3 * ring * uPresence) * uDensity;
  // Thin out far away and at the stage front (keeps the deck clean).
  a *= smoothstep(30.0, 14.0, d) * smoothstep(-3.2, -1.5, vW.z);
  // Parted around bodies.
  a *= texture2D(uMask, (p - MASK_MIN) / MASK_SIZE).r;
  vec3 col = uColor * (0.75 + 0.5 * n) + lightAt(p.x * 0.03 + uTime * 0.02) * 0.12 * (0.4 + uHype);
  gl_FragColor = vec4(col, a);
}
`,$n=class{p;group=new f;mats=[];density=.4;color=new T;mask=new Uint8Array(Jn*Yn);maskTex=new Ce(this.mask,Jn,Yn,ve,s);occupants=[];constructor(e,t,n){this.p=t,this.maskTex.magFilter=this.maskTex.minFilter=x,this.maskTex.wrapS=this.maskTex.wrapT=oe;let r=new M(56,34,1,1);r.rotateX(-Math.PI/2),(n===`high`?[.08,.22,.38,.55]:[.1,.32]).forEach((t,n)=>{let i=new xe({uniforms:{...e,uColor:{value:this.color},uDensity:{value:0},uLayer:{value:n},uMask:{value:this.maskTex}},vertexShader:qn,fragmentShader:Qn,transparent:!0,depthWrite:!1}),a=new E(r,i);a.position.set(0,t,12),a.renderOrder=2,this.group.add(a),this.mats.push(i)})}updateMask(){let e=this.mask;e.fill(255);let t=Z.cell;for(let n of this.occupants){let r=n.r+Xn,i=(n.pos.x-Z.x0)/t,a=(n.pos.z-Z.z0)/t,o=Math.ceil(r/t),s=Math.max(0,Math.floor(i)-o),c=Math.min(Jn-1,Math.floor(i)+o),l=Math.max(0,Math.floor(a)-o),u=Math.min(Yn-1,Math.floor(a)+o);for(let o=l;o<=u;o++)for(let l=s;l<=c;l++){let s=Math.hypot((l+.5-i)*t,(o+.5-a)*t),c=Math.min(1,Math.max(0,(s-n.r*.6)/(r-n.r*.6))),u=Math.round(255*(Zn+.95*c*c*(3-2*c))),d=o*Jn+l;u<e[d]&&(e[d]=u)}}this.maskTex.needsUpdate=!0}update(e,t){this.updateMask();let n=.58+.4*t.build+.3*t.calm+.8*t.dropPulse;this.density+=(n-this.density)*(1-Math.exp(-e*(t.dropPulse>.3?4:.7))),this.p.light?this.color.setRGB(.55,.57,.62):this.color.copy(this.p.haze).lerp(new T(.55,.6,.72),.6).multiplyScalar(.55),this.mats.forEach((e,t)=>{e.uniforms.uDensity.value=this.density*(this.mats.length>2?[.6,.5,.38,.26][t]:[.8,.55][t])*(this.p.light?.6:1)})}},er=class{group=new f;ghosts=[];rng=new F(1313);t=0;swoopUntil=-1;constructor(e,t){for(let n=0;n<4;n++){let r=bt(900+n);r.costume={kind:mt.Ghost,accessories:[`ghostHem`],body:new T(`#eef0ff`),acc:new T(`#eef0ff`),outfit:{...r.outfit,kind:0,emblem:0}},r.scale=1.15;let i=new Bt(r,9e3+n,e);i.setSkin(`spooky`),i.applyPalette(t);let a=[];i.root.traverse(e=>{let t=e.material;t&&(t.transparent=!0,t.depthWrite=!1,a.push(t))}),this.group.add(i.root),this.ghosts.push({w:i,mats:a,phase:this.rng.range(0,6.28),speed:this.rng.range(.07,.12)*(n%2?1:-1),rx:this.rng.range(7,11),rz:this.rng.range(4,7),cz:this.rng.range(3,7),height:this.rng.range(3.6,5.6),swoop:0})}}applyPalette(e){for(let t of this.ghosts)t.w.applyPalette(e)}onEvent(e,t){e.type===`drop`&&(this.swoopUntil=this.t+480/Math.max(60,t.danceBpm))}update(e,t){this.t+=e;let n=t.danceBeatPos,r=this.t<this.swoopUntil;for(let i of this.ghosts){let a=i.w;i.phase+=e*i.speed*(1+.8*t.hype),i.swoop=L(i.swoop,+!!r,r?2.5:.8,e);let o=Math.sin(i.phase)*i.rx,s=Math.min(10,i.cz+Math.cos(i.phase*1.3)*i.rz),c=.25*Math.sin(Math.PI*n+i.phase*3)*t.presence+.3*Math.sin(this.t*.9+i.phase);a.home.set(o,i.height-2.4*i.swoop+c,s);let l=Math.cos(i.phase)*i.rx*i.speed,u=-Math.sin(i.phase*1.3)*1.3*i.rz*i.speed,d=Math.atan2(l,u),f=Math.round((a.rig.yaw.target-d)/(Math.PI*2));a.rig.yaw.target=d+f*Math.PI*2,a.rig.tiltZ.target=.18*Math.sin(Math.PI*n/2)*t.presence-.25*Math.sign(i.speed)*i.swoop,a.rig.tiltX.target=.15+.2*i.swoop,a.rig.stretch.target=1.05+.05*Math.sin(this.t*2+i.phase);let p=I(t.vocal*1.4-.3),m=.25*Math.sin(this.t*6+i.phase);for(let[e,t]of a.arms.entries()){let n=e?1:-1;t.target({raise:1.4+1.1*p+m*n,fwd:1.2-.8*p,inward:.2,elbow:.7-.4*p})}let h=a.expr;h.mouth=Math.max(.15,I(t.mouth*t.vocal*1.3),.8*i.swoop),h.happy=t.section===R.Peak&&Math.sin(this.t*.5+i.phase)>.5,a.beatPhase=(n%1+1)%1,a.costumeGlow=.6+.6*t.vocal+.8*t.dropPulse;let g=.3+.18*t.vocal+.1*Math.sin(this.t*1.7+i.phase);for(let e of i.mats)e.opacity=g;a.update(e)}}};function tr(){let e=new r(1,48,28),t=e.attributes.position,n=new b;for(let e=0;e<t.count;e++){n.fromBufferAttribute(t,e);let r=Math.atan2(n.x,n.z),i=1-.07*(1-Math.abs(Math.sin(r*4)))**6,a=n.y*.74-.08*Math.max(0,n.y)**6;t.setXYZ(e,n.x*i,a,n.z*i)}return e.computeVertexNormals(),e}function nr(e){let t=document.createElement(`canvas`);t.width=512,t.height=256;let n=t.getContext(`2d`);n.fillStyle=`#000`,n.fillRect(0,0,512,256),n.fillStyle=`#fff`;let r=(e,t,r,i,a=!0)=>{n.beginPath(),n.moveTo(e-r/2,a?t+i/2:t-i/2),n.lineTo(e+r/2,a?t+i/2:t-i/2),n.lineTo(e,a?t-i/2:t+i/2),n.closePath(),n.fill()};if(e===0)r(94,100,34,30),r(162,100,34,30),r(128,128,16,14),n.beginPath(),n.moveTo(66,140),n.quadraticCurveTo(128,200,190,140),n.quadraticCurveTo(128,168,66,140),n.fill(),n.fillStyle=`#000`,n.fillRect(104,150,14,12),n.fillRect(138,150,14,12);else{n.save(),n.translate(94,100),n.rotate(.35),r(0,0,38,24,!1),n.restore(),n.save(),n.translate(162,100),n.rotate(-.35),r(0,0,38,24,!1),n.restore(),n.beginPath(),n.moveTo(68,142);for(let e=0;e<=8;e++)n.lineTo(68+e*15,e%2?156:146);n.lineTo(188,142),n.lineTo(174,176);for(let e=8;e>=0;e--)n.lineTo(76+e*13,e%2?166:178);n.closePath(),n.fill()}let i=new _e(t);return i.colorSpace=se,i}var rr=class{group=new f;mats=[];glow=[];rng=new F(1031);t=0;floor=[];add;constructor(e){let t=tr(),n=new A(.07,.11,.3,8);n.translate(0,.15,0);let r=new k({color:5204773,roughness:.8}),i=new T(1,.55,.12);for(let e=0;e<2;e++)this.mats.push(new k({color:15888410,roughness:.45,emissive:i,emissiveMap:nr(e),emissiveIntensity:2}));this.add=(e,i,a,o,s)=>{let c=new E(t,this.mats[this.rng.int(2)]);c.scale.setScalar(o),c.position.set(e,i+o*.72,a),c.rotation.y=s;let l=new E(n,r);l.position.y=.66,l.rotation.z=this.rng.range(-.3,.3),c.add(l),this.group.add(c),i===0&&this.floor.push({pos:c.position,r:o})};let a=this.add;for(let e of[-1,1])[3,4.7,6.5,8.3].forEach((t,n)=>a(e*t,1,-3.45,[.34,.42,.3,.46][n],e*-.15+this.rng.range(-.2,.2))),a(e*9.4,0,-1.4,.5,e*-.4),a(e*10.2,0,-1.8,.36,e*-.6),a(e*9,0,-.5,.3,e*-.3),a(e*1.62,2.01,cn+.3,.17,e*-.25);if(e===`high`)for(let e of[-1,1]){let t=new ie(16747050,0,7,1.6);t.position.set(e*5.5,1.6,-3.2),this.glow.push(t),this.group.add(t)}}update(e,t,n){this.t+=e;let r=this.t,i=.6*t.kickPulse*t.presence+.8*t.dropPulse;this.mats.forEach((e,t)=>{let a=.85+.15*Math.sin(r*(19+t*4))*Math.sin(r*7.1+t);e.emissiveIntensity=(1.6+i)*a*n});for(let e of this.glow)e.intensity=(6+10*i)*(.9+.1*Math.sin(r*23))*n}setVisible(e){this.group.visible=e}};function ir(e,t){let n=[],r=(e,t)=>{let n=-Math.PI/2*(e/6);return[Math.cos(n)*t,Math.sin(n)*t]},i=Array.from({length:7},()=>e*t.range(.85,1.05));for(let e=0;e<7;e++){let[t,a]=r(e,i[e]);n.push(0,0,0,t,a,0)}for(let e=1;e<=7;e++){let t=e/7.6;for(let e=0;e<6;e++){let[a,o]=r(e,i[e]*t),[s,c]=r(e+1,i[e+1]*t);for(let e=0;e<4;e++){let t=e/4,r=(e+1)/4,i=1-.12*Math.sin(Math.PI*t),l=1-.12*Math.sin(Math.PI*r);n.push((a+(s-a)*t)*i,(o+(c-o)*t)*i,0,(a+(s-a)*r)*l,(o+(c-o)*r)*l,0)}}}let a=new C;return a.setAttribute(`position`,new p(n,3)),a}var ar=class{p;group=new f;mat;spider=new f;legs=[];thread;threadPos;drop=.6;zip=0;t=0;x=-3.4;z=-3.6;constructor(e){this.p=e;let t=new F(77);this.mat=new me({color:16777215,transparent:!0,opacity:.45,depthWrite:!1});let n=(e,n,r,i)=>{let a=new u(ir(i,t),this.mat);a.position.set(e,8.35,n),a.scale.x=r,this.group.add(a)};n(-11.55,-3.4,1,2.6),n(11.55,-3.4,-1,2.2),n(-11.55,-9.2,1,1.8),n(11.55,-9.2,-1,2.4);let i=new k({color:854800,roughness:.3,metalness:.2}),a=new w({color:16719920}),o=new E(new r(.22,20,14),i);o.position.y=.12;let s=new E(new r(.12,16,12),i);s.position.set(0,-.1,.1),this.spider.add(o,s);for(let e of[-1,1]){let t=new E(new r(.026,8,6),a);t.position.set(e*.045,-.1,.21),this.spider.add(t)}let c=new A(.014,.012,.3,5);c.translate(0,.15,0);for(let e=0;e<8;e++){let t=e<4?-1:1,n=e%4,r=new f;r.position.set(t*.06,-.02,.06-n*.05),r.rotation.set(0,(n-1.5)*.35*t,t*-1.1);let a=new E(c,i),o=new f;o.position.y=.3,o.rotation.z=t*1.9;let s=new E(c,i);s.scale.y=1.2,o.add(s),r.add(a,o),this.spider.add(r),this.legs.push(r)}this.thread=new d(new C,this.mat),this.threadPos=new le(new Float32Array(6),3),this.thread.geometry.setAttribute(`position`,this.threadPos),this.thread.frustumCulled=!1,this.group.add(this.spider,this.thread)}onEvent(e){e.type===`drop`&&(this.zip=1)}update(e,t){this.t+=e,this.mat.color.copy(this.p.fg),this.mat.opacity=(this.p.light?.55:.32)+.25*t.dropPulse;let n=this.zip>0?.3:t.section===R.Build?1.2+4.2*t.build:.9+1.2*t.calm;this.drop=L(this.drop,n,this.zip>0?6:.9,e),this.zip=Math.max(0,this.zip-e/2.5);let r=8.2-this.drop,i=.12*Math.sin(this.t*1.3)*Math.min(1,this.drop/2);this.spider.position.set(this.x+i,r,this.z),this.spider.rotation.y=.4*Math.sin(this.t*.4),this.spider.rotation.z=-i*.5;let a=t.hatPulse*t.presence;this.legs.forEach((e,n)=>{e.rotation.x=.25*Math.sin(this.t*9+n*1.7)*(.3+a+t.build)}),this.threadPos.array.set([this.x,8.25,this.z,this.x+i,r+.3,this.z]),this.threadPos.needsUpdate=!0}},or=class{u;p;venue;group=new f;bats=new Kn;lanterns;webs;fog;ghosts;signDone=!1;rng=new F(1031);lightning=0;nextStrike=0;t=0;constructor(e,t,n,r,i){this.u=e,this.p=t,this.venue=n,this.lanterns=new rr(r),this.webs=new ar(t),this.fog=new $n(e,t,r),this.fog.occupants.push(...i,...this.lanterns.floor),this.ghosts=new er(r,t),this.group.add(this.lanterns.group,this.webs.group,this.fog.group,this.bats.mesh,this.ghosts.group)}applyPalette(e){this.ghosts.applyPalette(e)}onEvent(e,t){switch(this.webs.onEvent(e),this.ghosts.onEvent(e,t),e.type){case`drop`:this.bats.burst(40),this.strike(1);break;case`beat`:e.barBeat===0&&t.section===R.Build&&t.build>.8?this.strike(.7):e.barBeat===0&&t.section===R.Peak&&this.rng.chance(.08)&&this.strike(.6);break;case`phraseStart`:t.section===R.Peak&&this.rng.chance(.35)&&this.bats.burst(8)}}strike(e){this.t<this.nextStrike||(this.nextStrike=this.t+2.5,this.lightning=Math.max(this.lightning,e),this.u.uLightSeed.value=this.rng.range(0,100))}update(e,t){this.t+=e,this.lightning*=Math.exp(-e*7),this.u.uLightning.value=this.lightning,this.lanterns.update(e,t,this.p.ink?.3:1),this.webs.update(e,t),this.fog.update(e,t),this.bats.update(e,t),this.ghosts.update(e,t),!this.signDone&&this.venue.signBounds&&this.dressSign(this.venue.signBounds)}get flash(){return this.lightning*this.lightning*.5}dressSign(e){this.signDone=!0;let t=new k({color:1774628,roughness:.5,metalness:.1}),n=new k({color:1118481,emissive:this.p.neon,emissiveIntensity:1.8});n.emissive=this.p.neon;let r=new f,i=new E(new A(.62,.62,.05,40),t);r.add(i);let a=r;for(let[e,n,r,i]of[[.34,.22,.42,0],[.22,.11,.36,-.4],[.11,.015,.34,-.8]]){let o=new f;o.rotation.x=i,a.add(o);let s=new E(new A(n,e,r,24),t);s.position.y=r/2,o.add(s);let c=new f;c.position.y=r,o.add(c),a=c}let o=new E(new A(.345,.345,.1,24,1,!0),n);o.position.y=.07,r.add(o);let s=e.wobble;r.position.set(s.min.x+.55,s.max.y+.02,(s.min.z+s.max.z)/2),r.rotation.set(.1,.2,.28),this.group.add(r);let c=e.party;this.lanterns.add(c.max.x+.6,c.min.y,(c.min.z+c.max.z)/2+.2,.45,-.2)}},sr=new T(.62,.74,1),cr=class{renderer;scene=new S;music=new nt;theme;u;venue;lights;crowd;cam;show;confetti;haze;post;nowPlaying;logos;spooky=null;time=0;pmrem;envScene=new S;envPanels=[];envTimer=0;envDirty=!0;fog;envDisabled=!1;hazeHidden=!1;fogDisabled=!1;quality;flashColor=new T;constructor(e,t,n){this.renderer=e,this.quality=n.quality,this.theme=new Yt(t);let r=this.theme.p;this.u=Qt(r),tn(this.u,Y.plasma),this.u.uModeMix.value=1,this.scene.background=r.bgDeep,this.fog=new h(r.bgDeep.getHex(),.016),this.scene.fog=this.fog,this.venue=new fn(r,this.u,n.quality),this.crowd=new _n(n.crowd,n.quality,r),this.lights=new Hn(r,this.venue.fixtures,this.crowd.targets),this.confetti=new Fn(r),this.haze=new Ln(r),this.cam=new wn(innerWidth/innerHeight,this.crowd),this.show=new En(this.lights,this.u,this.crowd,this.confetti,this.cam),this.nowPlaying=new An(this.u),this.logos=new On(this.u),this.scene.add(this.venue.group,this.crowd.group,this.crowd.shadows,this.lights.group,this.confetti.group,this.haze.group),this.pmrem=new Ie(e),this.buildEnvScene(),this.post=new Nn(e,this.scene,this.cam.camera,n.quality),this.theme.onChange(e=>{this.crowd.applyPalette(e),this.spooky?.applyPalette(e),this.envDirty=!0}),this.show.spookySong=()=>/\b(thriller|monsters?|zombies?|ghosts?|spooky|halloween|witch(es)?|vampires?|skeletons?|haunted|creep|scream|dead|devil)\b/i.test(this.nowPlaying.track?.title??``),this.setSkin(P.id),P.onChange(e=>this.setSkin(e)),this.music.on(e=>this.onMusic(e));for(let e of this.crowd.all)e.rig.onLand=e=>{this.landings.length<2e4&&this.landings.push({t:this.time,beat:this.music.danceBeatPos,speed:e,bpm:this.music.danceBpm})}}landings=[];buildEnvScene(){let e=this.theme.p,t=new E(new O(30,14,30),new w({color:328967,side:1}));this.envScene.add(t);let n=(e,t,n,r,i)=>{let a=new w({side:2}),o=new E(new M(t,n),a);o.position.copy(r),o.lookAt(0,0,0),this.envScene.add(o),this.envPanels.push({mat:a,src:e,gain:i})};n(e.fg,10,4,new b(0,6.5,4),2.2);for(let t=0;t<6;t++){let r=t/6*Math.PI*2;n(e.lights[t],3,5,new b(Math.sin(r)*13,1.5,Math.cos(r)*13),2.5)}n(e.lights[0],12,5,new b(0,3,-14),1.6)}rebuildEnv(){for(let e of this.envPanels)e.mat.color.copy(e.src).multiplyScalar(e.gain);let e=this.scene.environment;this.scene.environment=this.pmrem.fromScene(this.envScene,.03).texture,e?.dispose(),this.scene.environmentIntensity=this.theme.p.light?.5:.55}onMusic(e){let t={music:this.music,time:this.time,cameraYaw:null};this.crowd.onEvent(e,t),this.show.onEvent(e,this.music,this.time),this.spooky?.group.visible&&this.spooky.onEvent(e,this.music)}setSkin(e){let t=e===`spooky`;if(t&&!this.spooky){let e=this.crowd.all.filter(e=>e!==this.crowd.dj.w).map(e=>({pos:e.root.position,r:.4*e.look.shape.width*e.look.scale}));this.spooky=new or(this.u,this.theme.p,this.venue,this.quality,e),this.scene.add(this.spooky.group)}this.spooky&&(this.spooky.group.visible=t),this.crowd.setSkin(e),this.venue.setSkin(e),this.confetti.setKind(t?`candy`:`confetti`),this.u.uSkin.value=+!!t,this.show.applySection(this.music),this.envDirty=!0}debugHide(e){if(e.has(`lasers`)&&(this.lights.hideLasers=!0),e.has(`beams`))for(let e of this.lights.heads)e.beam.visible=!1;if(e.has(`spots`))for(let e of this.lights.spots)e.visible=!1;e.has(`haze`)&&(this.hazeHidden=!0),e.has(`crowd`)&&(this.crowd.group.visible=!1),e.has(`bloom`)&&(this.post.bloom.enabled=!1),e.has(`rim`)&&(this.lights.rim.visible=!1),e.has(`djspot`)&&(this.lights.djLight.visible=!1),e.has(`env`)&&(this.envDisabled=!0),e.has(`fog`)&&(this.fogDisabled=!0)}setPalette(e,t=!1){this.theme.set(e,t)}step(e){this.time+=e;let t=this.time;this.theme.update(e);let n=this.theme.p;this.music.update(e),$t(this.u,this.music,n,t,e),this.crowd.update(e,this.music,t,this.cam.camera),this.venue.update(e,this.music,t),this.lights.update(e,this.music,t,this.crowd.targets),this.confetti.update(e),this.haze.update(t,this.music),this.nowPlaying.update(e,this.music),this.logos.update(e,this.music),this.cam.update(e,this.music,t),this.spooky?.group.visible&&this.spooky.update(e,this.music);for(let e of this.crowd.dancers)e.glowScale=+!n.light;this.fog.color.copy(n.bgDeep),this.fog.density=this.fogDisabled?0:n.light?.0025:.016,this.haze.group.visible=!n.light&&!this.hazeHidden,this.renderer.toneMappingExposure=n.light?.82:1.05,this.envTimer-=e,this.envDirty&&this.envTimer<=0&&!this.envDisabled&&(this.rebuildEnv(),this.envDirty=!1,this.envTimer=.3);let r=this.spooky?.group.visible&&this.lights.strobeEnabled?this.spooky.flash:0;r>this.lights.strobe?this.flashColor.copy(sr):this.flashColor.setRGB(1,1,1),this.post.finish.uniforms.uFlashColor.value.copy(this.flashColor),this.post.update(t,Math.max(this.lights.strobe,r),this.music.dropPulse*.8,n.light,n.ink)}render(){this.post.render()}resize(e,t){this.cam.camera.aspect=e/t,this.cam.camera.updateProjectionMatrix(),this.post.setSize(e,t)}},lr=class{root;inputs=new Map;query;constructor(){let e=document.createElement(`style`);e.textContent=`
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
    `,document.head.appendChild(e),this.root=document.createElement(`div`),this.root.className=`wp-tune`;let t=document.createElement(`div`);t.textContent=`tuning dials (k to hide)`,t.style.marginBottom=`6px`,this.root.append(t);for(let e of Re){let t=document.createElement(`label`);t.className=`row`,t.title=e.help;let n=document.createElement(`span`);n.textContent=e.label;let r=document.createElement(`input`);r.type=`range`,r.min=String(e.min),r.max=String(e.max),r.step=String(e.step);let i=document.createElement(`span`);i.className=`num`,r.addEventListener(`input`,()=>Ve(e.key,Number(r.value))),r.addEventListener(`keydown`,e=>e.stopPropagation()),t.append(n,r,i),this.root.append(t),this.inputs.set(e.key,{input:r,value:i})}this.query=document.createElement(`div`),this.query.className=`q`;let n=document.createElement(`button`);n.textContent=`reset`,n.addEventListener(`click`,()=>He());let r=document.createElement(`button`);r.textContent=`copy`,r.addEventListener(`click`,()=>void navigator.clipboard?.writeText(We()).catch(()=>{})),this.root.append(this.query,n,r),document.body.append(this.root),Be(()=>{this.sync(),Ge()}),this.sync()}toggle(){this.root.style.display=this.root.style.display===`block`?`none`:`block`}sync(){for(let e of Re){let{input:t,value:n}=this.inputs.get(e.key);t.value=String(N[e.key]),n.textContent=String(+N[e.key].toFixed(2)),t.parentElement.classList.toggle(`changed`,N[e.key]!==Le[e.key])}this.query.textContent=We()||`(defaults)`}},Q=new URLSearchParams(location.search),ur=Q.has(`capture`);Ue(Q),P.init(Q);var $=new Oe({antialias:!1,powerPreference:`high-performance`,preserveDrawingBuffer:ur});$.setPixelRatio(Math.min(devicePixelRatio,ur?1:1.5)),$.setSize(innerWidth,innerHeight),$.toneMapping=4,$.toneMappingExposure=1.05,document.body.appendChild($.domElement),Q.has(`lab`)?($.toneMapping=4,Xt($,Q)):dr();async function dr(){let e=Q.get(`quality`)??`high`,t=Number(Q.get(`crowd`)??(e===`high`?70:40)),n=null,r=Q.get(`theme`),i=new cr($,Jt({name:`default`,colors:{}}),{quality:e,crowd:t}),a=new rt(()=>`#`+i.theme.p.lights[0].getHexString()),o=ur?null:new lr,s=(e,t=!1)=>i.setPalette(Jt(e),t),c=async(e,t=!1)=>{try{let n=await fetch(`themes/${encodeURIComponent(e)}`);n.ok&&s(await n.json(),t)}catch{}},l,u=0,d=null,f=Q.get(`replay`);if(f){l=await Ze.load(f),u=Number(Q.get(`t`)??0);let e=Q.get(`audio`);e&&!ur&&(d=new Audio(e),d.currentTime=u,addEventListener(`click`,()=>void d.play(),{once:!0}),d.play().catch(()=>a.setStatus(`click to start the music`)))}else l=Q.has(`demo`)?new Qe:new Xe(`${location.protocol===`https:`?`wss`:`ws`}://${location.host}/ws`,e=>{n=e,r||s(e,i.time<.5)},e=>i.nowPlaying.onTrack(e));r&&await c(r,!0),Q.get(`title`)&&i.nowPlaying.onTrack({type:`track`,playing:!0,player:`test`,title:Q.get(`title`),artist:Q.get(`artist`)??``,art:Q.get(`art`)}),i.show.forceSwirl=Q.has(`swirl`),i.show.forceZombie=Q.has(`zombie`),i.logos.demo=Q.has(`logos`);let p=new Set((Q.get(`hide`)??``).split(`,`).filter(Boolean));i.debugHide(p);let m=e=>{d&&!d.paused?u=d.currentTime:u+=e,l.poll(u,e=>i.music.ingest(e)),i.step(e)};if(f&&u>0){let e=u;u=Math.max(0,e-20),i.music.presence=0;let t=e;for(;u<t;)m(1/30)}let h=()=>{$.setSize(innerWidth,innerHeight),i.resize(innerWidth,innerHeight)};addEventListener(`resize`,h),h();let g=[`wide`,`djClose`,`djReverse`,`crowdDolly`,`heroClose`,`crane`,`overhead`,`orbit`,`stageSide`],_=[],v=-1;addEventListener(`keydown`,async e=>{if(e.key===`d`)a.toggleDebug();else if(e.key===`h`)a.toggleHelp();else if(e.key===`k`)o?.toggle();else if(e.key===`s`)P.cycle(),a.toast(`skin: `,{b:P.label()});else if(e.key===`f`)document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();else if(e.key===` `)i.cam.locked=null,i.cam.go(g[Math.floor(Math.random()*g.length)],12,0);else if(e.key>=`1`&&e.key<=`9`){let t=g[Number(e.key)-1];i.cam.locked=t,i.cam.go(t,1e6,.8)}else e.key===`0`?i.cam.locked=null:e.key===`t`?(_.length||(_=await(await fetch(`themes`)).json()),v=(v+1)%_.length,r=_[v],await c(r),a.setStatus(`theme preview: `,{b:r},` (T to return)`)):e.key===`T`?(r=null,n&&s(n)):(e.key===`q`||e.key===`Escape`)&&window.close()}),window.__wp={ready:!0,party:i,step(e,t=1/30){for(let n=0;n<e;n++)m(t);i.render()},get clock(){return u},shot(e,t=0){i.cam.locked=e,i.cam.go(e,1e6,0),i.cam.current.t=t},info(){let e=i.music;return{clock:u,bpm:e.bpm,section:e.section,hype:e.hype,vocal:e.vocal,shot:i.cam.current.kind,theme:i.theme.p.name,skin:P.id,zombies:i.crowd.dancers.filter(e=>e.zombieing).length,activity:i.crowd.activity()}}};let y=null,ee=()=>!ur&&i.music.playing&&document.visibilityState===`visible`;setInterval(async()=>{try{ee()&&!y?(y=await navigator.wakeLock.request(`screen`),y.addEventListener(`release`,()=>y=null)):!ee()&&y&&(await y.release(),y=null)}catch{}},2e3);let te=performance.now(),b=0,x=0,S=0,ne=Math.min(devicePixelRatio,1.5),C=ne,w=0,re=0,ie=0,ae=e=>{if(ur||S===0)return;S<48?w+=e:w=0,S>58?re+=e:re=0;let t=C;w>3&&C>.6&&(t=Math.max(.6,C-.2)),re>12&&C<ne&&(t=Math.min(ne,C+.2)),t!==C&&(C=t,w=re=0,$.setPixelRatio(C),h())};$.setAnimationLoop(()=>{if(Q.has(`frozen`))return;let t=performance.now(),n=Math.min(.05,(t-te)/1e3);te=t,m(n),i.render(),b+=n,x++,b>1&&(S=x/b,b=x=0),ae(n),ie+=n,ie>5&&l instanceof Xe&&(ie=0,l.send({type:`stats`,fps:Math.round(S),ratio:C,w:innerWidth,h:innerHeight,quality:e})),l instanceof Xe&&a.setStatus(...l.connected?[`♪ Wobble Party is listening — play something in `,{b:`cliamp`},`, Spotify or anything else`]:[`waiting for the wobble brain…`]),a.update(n,i.music,`${S.toFixed(0)} fps · ${i.cam.current.kind} · ${i.theme.p.name} · ${P.id}`,i.crowd.activity())})}