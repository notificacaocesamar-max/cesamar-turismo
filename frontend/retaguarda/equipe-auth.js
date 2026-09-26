(function(){
  "use strict";
  var c=window.CESAMAR_CONFIG.supabase, sb=window.supabase.createClient(c.url,c.publishableKey), perfil=null, fator=null;
  var form=document.getElementById("form-login"), msg=document.getElementById("login-msg"), mfa=document.getElementById("mfa-etapa");
  function erro(e){ msg.textContent=(e&&e.message)||"Não foi possível entrar."; }
  function rpc(nome,args){ return sb.rpc(nome,args||{}).then(function(r){if(r.error)throw r.error;return r.data;}); }
  async function carregarPerfil(){
    var r=await sb.from("staff_profiles").select("id,auth_user_id,nome_completo,email,whatsapp,papel,oculto,pode_atender,recebe_leads,ativo").single();
    if(r.error||!r.data||!r.data.ativo) throw new Error("Usuário sem acesso ativo ao portal."); perfil=r.data;
    sessionStorage.setItem("cesamar.equipe.perfil",JSON.stringify(perfil)); window.CesamarAdminEntrar(perfil.nome_completo);
    document.getElementById("nav-controle").hidden=perfil.papel==="consultor";
  }
  async function aposSenha(){
    var aal=await sb.auth.mfa.getAuthenticatorAssuranceLevel(); if(aal.error)throw aal.error;
    if(aal.data.currentLevel==="aal2") return carregarPerfil();
    var fs=await sb.auth.mfa.listFactors(); if(fs.error)throw fs.error;
    fator=(fs.data.totp||[]).filter(function(x){return x.status==="verified";})[0];
    mfa.hidden=false; form.querySelector("button[type=submit]").hidden=true; form.usuario.closest(".field").hidden=true; form.senha.closest(".field").hidden=true;
    if(fator){ document.getElementById("mfa-ajuda").textContent="Digite o código atual do seu aplicativo autenticador."; }
    else{
      var en=await sb.auth.mfa.enroll({factorType:"totp",friendlyName:"Cesamar Turismo"}); if(en.error)throw en.error; fator=en.data;
      document.getElementById("mfa-qr").innerHTML='<img src="'+fator.totp.qr_code+'" alt="QR Code para configurar o autenticador" style="width:210px;display:block;margin:15px auto">';
      document.getElementById("mfa-ajuda").textContent="Primeiro acesso: escaneie o QR Code e informe o código gerado.";
    }
  }
  form.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();msg.textContent="Entrando…";
    sb.auth.signInWithPassword({email:form.usuario.value.trim(),password:form.senha.value}).then(function(r){if(r.error)throw r.error;msg.textContent="";return aposSenha();}).catch(erro);
  },true);
  document.getElementById("btn-totp").addEventListener("click",async function(){
    try{ var codigo=document.getElementById("l-totp").value.replace(/\D/g,""); if(codigo.length!==6)throw new Error("Digite os 6 números do aplicativo.");
      var ch=await sb.auth.mfa.challenge({factorId:fator.id});if(ch.error)throw ch.error;
      var vr=await sb.auth.mfa.verify({factorId:fator.id,challengeId:ch.data.id,code:codigo});if(vr.error)throw vr.error;await carregarPerfil();
    }catch(e){erro(e);}
  });
  document.getElementById("btn-sair").addEventListener("click",async function(){await sb.auth.signOut();sessionStorage.clear();location.href="../index.html";});

  function htmlPerfil(){
    return '<header class="adm-head"><div><span class="eyebrow">Minha conta</span><h1>Perfil e plantão</h1></div></header><div class="adm-grid2"><section class="adm-card"><h3>Status de atendimento</h3><p id="status-texto" class="muted">Consultando…</p>'+
      (perfil.pode_atender?'<button class="btn btn--block" id="btn-plantao">Carregando…</button>':'<div class="adm-alert">Este usuário não participa do plantão nem recebe contatos.</div>')+'</section><section class="adm-card"><h3>Meus dados</h3><form id="form-perfil" class="form"><div class="field full"><label>Nome completo</label><input name="nome" value="'+perfil.nome_completo.replace(/"/g,"&quot;")+'" required></div><div class="field full"><label>E-mail</label><input value="'+perfil.email+'" disabled></div><div class="field full"><label>WhatsApp</label><input name="whatsapp" value="'+(perfil.whatsapp||'')+'" placeholder="5521964898458" pattern="55[1-9][0-9]{9,10}" required><small>Somente números: 55 + DDD + número.</small></div><button class="btn full" type="submit">Salvar dados</button></form></section></div>';
  }
  async function abrirPerfil(){
    document.getElementById("adm-main").innerHTML=htmlPerfil(); var on=await rpc("meu_status_plantao"), b=document.getElementById("btn-plantao"), t=document.getElementById("status-texto");
    function pintar(){if(!b)return;b.dataset.on=on?"1":"0";b.textContent=on?"Atendendo":"Indisponível";b.style.background=on?"#16834f":"#b3261e";t.textContent=on?"Você está recebendo contatos pelo rodízio até sair ou até 23h59.":"Você não está recebendo contatos.";} pintar();
    if(b)b.onclick=async function(){b.disabled=true;try{on=await rpc("alternar_plantao",{deseja_atender:!on});pintar();}catch(e){alert(e.message);}b.disabled=false;};
    document.getElementById("form-perfil").onsubmit=async function(e){e.preventDefault();var w=this.whatsapp.value.replace(/\D/g,"");try{await rpc("atualizar_meu_perfil",{p_nome:this.nome.value,p_whatsapp:w});perfil.nome_completo=this.nome.value;perfil.whatsapp=w;alert("Dados atualizados.");}catch(x){alert(x.message);}};
  }
  async function abrirControle(){
    if(perfil.papel==="consultor")return; var p=await sb.from("staff_profiles").select("id,nome_completo,papel").order("nome_completo"), s=await sb.from("duty_sessions").select("user_id,inicio,fim,motivo_fim").gte("inicio",new Date(Date.now()-60*864e5).toISOString()).order("inicio",{ascending:false});
    var abertas={};(s.data||[]).forEach(function(x){if(!x.fim)abertas[x.user_id]=true;});
    document.getElementById("adm-main").innerHTML='<header class="adm-head"><div><span class="eyebrow">Somente Gerencial</span><h1>Controle gerencial</h1></div></header><div class="adm-card adm-table-wrap"><table class="adm-table"><thead><tr><th>Funcionário</th><th>Perfil</th><th>Status atual</th><th>Histórico (60 dias)</th></tr></thead><tbody>'+(p.data||[]).map(function(x){var hist=(s.data||[]).filter(function(y){return y.user_id===x.id;}).map(function(y){return '<small>'+new Date(y.inicio).toLocaleString('pt-BR')+' — '+(y.fim?new Date(y.fim).toLocaleString('pt-BR'):'agora')+'</small>';}).join('');return '<tr><td><b>'+x.nome_completo+'</b></td><td>'+x.papel+'</td><td><span class="st '+(abertas[x.id]?'st-publicado':'st-rejeitado')+'">'+(abertas[x.id]?'Atendendo':'Indisponível')+'</span></td><td>'+ (hist||'Sem registros')+'</td></tr>';}).join('')+'</tbody></table></div>';
  }
  document.getElementById("adm-nav").addEventListener("click",function(e){var b=e.target.closest("[data-equipe-view]");if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.dataset.equipeView==="perfil")abrirPerfil();else abrirControle();},true);
  (async function(){try{if(location.search.indexOf("logout=1")>=0){await sb.auth.signOut();history.replaceState({},"",location.pathname);}var u=await sb.auth.getUser();if(u.data&&u.data.user)await aposSenha();}catch(e){erro(e);}})();
})();
