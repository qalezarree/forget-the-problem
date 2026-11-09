(function(){
var FORM_URL="https://formspree.io/f/xqppondg";

  var msg=document.getElementById("msg");
  var recipient=document.getElementById("to");
  var letter=document.getElementById("letter"), paper=document.getElementById("paper");
  var burn=document.getElementById("burn"), flt=document.getElementById("float");
  var chars=document.getElementById("chars"), done=document.getElementById("done"), closing=document.getElementById("closing");
  var again=document.getElementById("again"), actions=document.getElementById("actions"), note=document.getElementById("note"), status=document.getElementById("status"), meta=document.getElementById("meta");
  var disclosure=document.getElementById("disclosure");
  var busy=false;
  var animationDone=false, submissionDone=false, submissionError="", submittedMessage="", submittedRecipient="";

  var endings=[
    "It’s out of your head now. It never needed to be sent to be said.",
    "You said it. That counts, even if no one else ever hears it.",
    "Feelings like this fade slowly, not all at once. Be kind to yourself today.",
    "That’s one less thing you have to carry around tonight.",
    "You don’t have to be over it yet. You just got a little lighter."
  ];

  function update(){
    chars.textContent=msg.value.length+" / 3000";
    var hasMessage=msg.value.trim().length>0;
    var ok=hasMessage&&!busy;
    burn.disabled=!ok; flt.disabled=!ok;
    if(busy){
      status.textContent="Submitting your message through Formspree…";
    }else if(!hasMessage){
      status.textContent="The stars themselves were born from the same cosmic dust that moves within your breath, bridging the quiet void between eternity and a single heartbeat.";
    }else{
      status.textContent="Choose how you’d like to let it go.";
    }
  }
  msg.addEventListener("input",update);

  function rnd(a,b){return a+Math.random()*(b-a)}

  function submit(mode){
    if(busy||msg.value.trim().length===0) return;
    busy=true;
    animationDone=false;
    submissionDone=false;
    submissionError="";
    submittedMessage=msg.value;
    submittedRecipient=recipient.value;
    update();
    play(mode);
    var data=new FormData();
    data.append("message",submittedMessage.trim());
    if(submittedRecipient.trim()) data.append("recipient_name",submittedRecipient.trim());
    data.append("action",mode);
    fetch(FORM_URL,{
      method:"POST",
      headers:{"Accept":"application/json"},
      body:data
    }).then(function(response){
      if(!response.ok) throw new Error("Formspree returned status "+response.status+".");
    })["catch"](function(error){
      submissionError=error.message;
    }).then(function(){
      submissionDone=true;
      complete();
    });
  }

  function build(){
    letter.innerHTML="";
    var idx=0;
    msg.value.split("\n").forEach(function(line){
      var d=document.createElement("div"); d.className="ln";
      line.split(/(\s+)/).forEach(function(part){
        if(!part) return;
        var s=document.createElement("span"); s.className="w"; s.textContent=part;
        idx++; d.appendChild(s);
      });
      letter.appendChild(d);
    });
  }

  function play(mode){
    var h=msg.offsetHeight;
    build();
    letter.style.height=h+"px";
    msg.style.display="none"; letter.style.display="block";
    meta.style.visibility="hidden";
    actions.style.display="none"; note.style.display="none";
    disclosure.style.display="none"; status.style.display="none";
    document.getElementById("who").style.display="none";
    msg.value="";
    var calm=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
    if(!calm){
      letter.className="letter";
      igniteBurn(finish,mode);
    }else{
      letter.className="letter "+(mode==="burn"?"burn":"float");
      paper.classList.add("going");
      setTimeout(finish,3000);
    }
  }

  function finish(){
    animationDone=true;
    complete();
  }

  function complete(){
    if(!animationDone||!submissionDone) return;
    if(submissionError){
      restoreForm(false);
      status.textContent="We couldn’t confirm submission ("+submissionError+"). Your message is still here; check your Formspree inbox before retrying to avoid duplicates.";
      return;
    }
    closing.textContent=endings[Math.floor(Math.random()*endings.length)];
    done.style.display="block";
    again.focus();
  }

  function restoreForm(clearDraft){
    busy=false;
    paper.classList.remove("going"); resetBurn();
    letter.className="letter"; letter.style.display="none"; letter.innerHTML="";
    msg.style.display="block"; meta.style.visibility="visible";
    document.getElementById("who").style.display="flex";
    actions.style.display="flex"; note.style.display="block"; done.style.display="none";
    msg.value=clearDraft?"":submittedMessage;
    recipient.value=clearDraft?"":submittedRecipient;
    disclosure.style.display="block"; status.style.display="block";
    update();
  }

  /* ---- paper burn and float-away effects ---- */
  var ring=document.getElementById("ring"), fxc=document.getElementById("fx"), stage=document.getElementById("stage");
  var raf=0, parts=[], seedv=0;
  function hash(x,y){var n=Math.sin(x*127.1+y*311.7+seedv)*43758.5453;return n-Math.floor(n)}
  function vn(x,y){
    var ix=Math.floor(x),iy=Math.floor(y),u=x-ix,v=y-iy,sx=u*u*(3-2*u),sy=v*v*(3-2*v);
    var a=hash(ix,iy),b=hash(ix+1,iy),c=hash(ix,iy+1),d=hash(ix+1,iy+1);
    return a+(b-a)*sx+(c-a)*sy+(a-b-c+d)*sx*sy;
  }
  function fbm(x,y){return vn(x*3,y*3)*.5+vn(x*8,y*8)*.3+vn(x*20,y*20)*.2}

  function resetBurn(){
    cancelAnimationFrame(raf); parts=[];
    paper.classList.remove("burning");
    paper.style.visibility="";
    paper.style.webkitMaskImage=""; paper.style.maskImage="";
    var c=fxc.getContext("2d"); c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,fxc.width,fxc.height);
    ring.getContext("2d").clearRect(0,0,ring.width,ring.height);
  }

  function igniteBurn(done,mode){
    var fl=mode==="float";
    seedv=Math.random()*100;
    var words=[].map.call(letter.querySelectorAll(".w"),function(s){return s.textContent.trim()}).filter(function(s){return s});
    if(!words.length)words=["…"];
    var paperCol=(getComputedStyle(document.documentElement).getPropertyValue("--paper")||"").trim()||"#e4e8f0";
    var lite=window.matchMedia&&matchMedia("(prefers-color-scheme: light)").matches;
    function spawn2(x,y,t){if(parts.length>800)return;parts.push({t:t,x:x,y:y,l:0,ph:rnd(0,6),sw:rnd(5,15),rot:0,rs:0,vx:rnd(-8,8),vy:-rnd(5,25),life:rnd(.5,1.1),r:rnd(.8,1.8)})}

    var pr=paper.getBoundingClientRect(), sr=stage.getBoundingClientRect();
    var W=150,H=Math.max(40,Math.round(W*pr.height/pr.width)),N=W*H,asp=pr.width/pr.height,i,x,y;
    ring.width=W; ring.height=H;
    var cm=document.createElement("canvas"); cm.width=W; cm.height=H;
    var cr=ring.getContext("2d"), cmx=cm.getContext("2d");

    var ox=rnd(.2,.8)*asp, dist=new Float32Array(N), tb=new Float32Array(N), maxD=0;
    for(y=0;y<H;y++)for(x=0;x<W;x++){
      var dx=x/W*asp-ox, dy=(y/H-1.02)*.75, d=Math.sqrt(dx*dx+dy*dy);
      dist[y*W+x]=d; if(d>maxD)maxD=d;
    }
    var T=fl?3.4:4.2,A=fl?1.4:1.0,mn=1e9,mxT=0;
    for(i=0;i<N;i++){x=i%W;y=(i/W)|0;var v=dist[i]/maxD*T+(fbm(x/W*asp,y/H)-.5)*A;tb[i]=v;if(v<mn)mn=v}
    for(i=0;i<N;i++){tb[i]-=mn;if(tb[i]>mxT)mxT=tb[i]}

    var dpr=Math.min(window.devicePixelRatio||1,2);
    var fxW=Math.round(sr.width+120), fxH=Math.round(sr.height+280);
    fxc.width=fxW*dpr; fxc.height=fxH*dpr; fxc.style.width=fxW+"px"; fxc.style.height=fxH+"px";
    var fc=fxc.getContext("2d"); fc.setTransform(dpr,0,0,dpr,0,0);
    var px0=(pr.left-sr.left)+60, py0=(pr.top-sr.top)+220;

    function spawn(u,v,t){
      if(parts.length>800)return;
      var q={t:t,x:px0+u*pr.width,y:py0+v*pr.height,l:0,ph:rnd(0,6),sw:rnd(5,25),rot:rnd(0,6),rs:rnd(-3,3),vx:rnd(-15,15),vy:-rnd(20,60),life:rnd(1.6,3.2),r:rnd(2,4),c:rnd(25,80)|0};
      if(t==="s"){q.vy=-rnd(50,140);q.life=rnd(.5,1.2);q.r=rnd(.8,2)}
      else if(t==="m"){q.vy=-rnd(25,50);q.life=rnd(2,3.5);q.r=rnd(10,18);q.sw=rnd(8,20)}
      else if(t==="g"){q.vy=0;q.vx=0;q.sw=0;q.life=.45;q.r=rnd(50,90);if(fl)q.col="150,190,255"}
      else if(t==="f"){q.vy=-rnd(50,130);q.vx=rnd(10,60);q.sw=rnd(30,80);q.life=rnd(1.6,2.8);q.r=rnd(3,6);q.fl=rnd(0,6);q.fs=rnd(4,9)}
      else if(t==="t"){q.vy=-rnd(20,60);q.vx=rnd(-10,30);q.sw=rnd(10,30);q.life=rnd(.8,1.8);q.r=rnd(.8,2.2)}
      else if(t==="w"){q.vy=-rnd(60,110);q.vx=rnd(15,50);q.sw=rnd(20,50);q.life=rnd(2,3);q.word=words[(Math.random()*words.length)|0]}
      parts.push(q);
    }

    var imR=cr.createImageData(W,H), imM=cmx.createImageData(W,H), rd=imR.data, md=imM.data;
    var G=.09,C=fl?.9:.34,PRE=.35,start=0,last=0,pending=false,finished=false;
    paper.classList.add("burning");

    function applyMask(){
      if(pending)return; pending=true;
      var url=cm.toDataURL(), im=new Image();
      im.onload=function(){paper.style.webkitMaskImage="url("+url+")";paper.style.maskImage="url("+url+")";pending=false};
      im.src=url;
    }

    function frame(now){
      if(!start){start=now;last=now}
      var t=(now-start)/1000, dt=Math.min(.05,(now-last)/1000); last=now;
      for(var i=0;i<N;i++){
        var p=t-tb[i], o=i*4, ma=255, r=0,g=0,b=0,a=0, k;
        if(fl){
          if(p>=C)ma=0;
          else if(p>=0){
            k=p/C;ma=255*(1-k);
            var rf=Math.random(),fu=(i%W)/W,fv=((i/W)|0)/H;
            if(rf<.0012)spawn(fu,fv,"f");else if(rf<.002)spawn(fu,fv,"t");else if(rf<.00205)spawn(fu,fv,"w");else if(rf<.0022)spawn(fu,fv,"g");
          }
          rd[o]=0;rd[o+1]=0;rd[o+2]=0;rd[o+3]=0;md[o]=0;md[o+1]=0;md[o+2]=0;md[o+3]=ma;
          continue;
        }
        if(p<0){
          if(p>-PRE){k=1+p/PRE;r=120;g=62;b=18;a=k*k*150}
        }else if(p<G){
          k=p/G;r=255;g=235-125*k;b=130-110*k;a=255;
          var u=(i%W)/W, w=((i/W)|0)/H, rr=Math.random();
          if(rr<.0025)spawn(u,w,"s"); else if(rr<.0031)spawn(u,w,"g");
        }else if(p<C){
          k=(p-G)/(C-G);r=70-50*k;g=34-18*k;b=12;a=235;ma=255*(1-k);
          var rr2=Math.random();
          if(rr2<.0012)spawn((i%W)/W,((i/W)|0)/H,"a"); else if(rr2<.0016)spawn((i%W)/W,((i/W)|0)/H,"m");
        }else{ma=0}
        rd[o]=r;rd[o+1]=g;rd[o+2]=b;rd[o+3]=a;
        md[o]=0;md[o+1]=0;md[o+2]=0;md[o+3]=ma;
      }
      cr.putImageData(imR,0,0); cmx.putImageData(imM,0,0); applyMask();

      fc.clearRect(0,0,fxW,fxH);
      for(var j=parts.length-1;j>=0;j--){
        var q=parts[j]; q.l+=dt;
        if(q.l>=q.life){parts.splice(j,1);continue}
        var f=q.l/q.life;
        q.x+=(q.vx+Math.sin(q.l*3+q.ph)*q.sw)*dt; q.y+=q.vy*dt;
        if(q.t==="s"){
          fc.globalCompositeOperation="lighter";
          fc.fillStyle="rgba(255,"+(150+((1-f)*80|0))+",60,"+((1-f)*(.5+.5*Math.random())).toFixed(2)+")";
          fc.beginPath();fc.arc(q.x,q.y,q.r,0,6.3);fc.fill();
        }else if(q.t==="g"){
          fc.globalCompositeOperation="lighter";
          var gr=fc.createRadialGradient(q.x,q.y,0,q.x,q.y,q.r);
          var gc=q.col||"255,120,30";gr.addColorStop(0,"rgba("+gc+","+(.14*(1-f)).toFixed(3)+")");gr.addColorStop(1,"rgba("+gc+",0)");
          fc.fillStyle=gr;fc.fillRect(q.x-q.r,q.y-q.r,q.r*2,q.r*2);
        }else if(q.t==="f"){
          q.vy*=1+dt*.6;
          fc.globalCompositeOperation="source-over";
          fc.save();fc.translate(q.x,q.y);fc.rotate(q.rot+q.l*q.rs*.5);fc.scale(1,Math.cos(q.fl+q.l*q.fs));
          fc.globalAlpha=Math.min(1,(1-f)*1.6);fc.fillStyle=paperCol;
          fc.fillRect(-q.r,-q.r*.7,q.r*2,q.r*1.4);fc.restore();fc.globalAlpha=1;
          if(Math.random()<.12)spawn2(q.x,q.y,"t");
        }else if(q.t==="t"){
          fc.globalCompositeOperation=lite?"source-over":"lighter";
          var tw=(1-f)*(.5+.5*Math.sin(q.l*18+q.ph));
          fc.fillStyle=(lite?"rgba(90,120,200,":"rgba(190,215,255,")+tw.toFixed(2)+")";
          fc.beginPath();fc.arc(q.x,q.y,q.r,0,6.3);fc.fill();
        }else if(q.t==="w"){
          q.vy*=1+dt*.4;
          fc.globalCompositeOperation="source-over";
          fc.save();fc.translate(q.x,q.y);fc.rotate(Math.sin(q.l*2+q.ph)*.25);
          fc.font="26px Caveat,cursive";fc.shadowColor="rgba(160,200,255,.9)";fc.shadowBlur=12;
          fc.globalAlpha=Math.min(1,(1-f)*1.8)*Math.min(1,f*8);fc.fillStyle=lite?"#2a3350":"#f4f7ff";
          fc.fillText(q.word,0,0);fc.restore();fc.globalAlpha=1;
        }else if(q.t==="m"){
          fc.globalCompositeOperation="source-over";
          fc.fillStyle="rgba(140,140,150,"+(.08*(1-f)*Math.min(1,f*6)).toFixed(3)+")";
          fc.beginPath();fc.arc(q.x,q.y,q.r*(1+f*2.2),0,6.3);fc.fill();
        }else{
          fc.globalCompositeOperation="source-over";
          fc.save();fc.translate(q.x,q.y);fc.rotate(q.rot+q.l*q.rs);
          fc.fillStyle="rgba("+q.c+","+q.c+","+q.c+","+((1-f)*.85).toFixed(2)+")";
          fc.fillRect(-q.r,-q.r*.5,q.r*2,q.r);fc.restore();
        }
      }
      if(t>mxT+C+.05&&!finished){paper.style.visibility="hidden";finished=true}
      if(finished&&parts.length===0){fc.clearRect(0,0,fxW,fxH);done();return}
      raf=requestAnimationFrame(frame);
    }
    raf=requestAnimationFrame(frame);
  }

  burn.addEventListener("click",function(){submit("burn")});
  flt.addEventListener("click",function(){submit("float")});

  again.addEventListener("click",function(){
    restoreForm(true);
    msg.focus();
  });
  
  update();
})();
