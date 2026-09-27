(function(){
  "use strict";
  var c=window.CESAMAR_CONFIG.supabase, sb=window.supabase.createClient(c.url,c.publishableKey), Auth=window.CesamarAuthFluxo, perfil=null, fator=null;
  var form=document.getElementById("form-login"), msg=document.getElementById("login-msg"), mfa=document.getElementById("mfa-etapa");
  function estado(texto,tipo){ msg.textContent=texto||""; msg.dataset.tipo=tipo||""; }
  function erro(e){
    var texto=(e&&e.message)||"Não foi possível entrar.";
    if(/invalid.*code|challenge|factor/i.test(texto)) texto="Código inválido ou expirado. Aguarde o próximo código do aplicativo e tente novamente.";
    estado(texto,"erro");
  }
  function rpc(nome,args){ return sb.rpc(nome,args||{}).then(function(r){if(r.error)throw r.error;return r.data;}); }
  async function carregarPerfil(){
    var u=await sb.auth.getUser(); if(u.error||!u.data.user)throw new Error("Sua sessão expirou. Entre novamente.");
    var r=await sb.rpc("meu_perfil_equipe");
    if(r.error) throw r.error;
    perfil=Array.isArray(r.data)?r.data[0]:r.data;
    if(!perfil||!perfil.ativo) throw new Error("Usuário sem acesso ativo ao portal.");
    sessionStorage.setItem("cesamar.equipe.perfil",JSON.stringify(perfil));
    document.querySelectorAll("#adm-nav button").forEach(function(b){
      var view=b.dataset.equipeView||b.dataset.view;
      b.hidden=!Auth.podeVerView(perfil,view);
    });
    var inicial=Auth.podeVerView(perfil,"painel")?"painel":"perfil";
    window.CesamarAdminEntrar(perfil.nome_completo,inicial);
  }
  async function aposSenha(){
    var aal=await sb.auth.mfa.getAuthenticatorAssuranceLevel(); if(aal.error)throw aal.error;
    if(aal.data.currentLevel==="aal2") return carregarPerfil();
    var fs=await sb.auth.mfa.listFactors(); if(fs.error)throw fs.error;
    var fatores=Auth.fatoresTotp(fs.data);
    fator=Auth.fatorVerificado(fs.data);
    mfa.hidden=false; form.querySelector("button[type=submit]").hidden=true; form.usuario.closest(".field").hidden=true; form.senha.closest(".field").hidden=true;
    document.getElementById("l-totp").value="";
    if(fator){ document.getElementById("mfa-qr").innerHTML=""; document.getElementById("mfa-ajuda").textContent="Digite o código atual do seu aplicativo autenticador."; }
    else{
      var pendentes=Auth.fatoresPendentes(fs.data); for(var i=0;i<pendentes.length;i++) await sb.auth.mfa.unenroll({factorId:pendentes[i].id});
      var en=await sb.auth.mfa.enroll({factorType:"totp",friendlyName:"Cesamar Turismo"}); if(en.error)throw en.error; fator=en.data;
      document.getElementById("mfa-qr").innerHTML='<img src="'+fator.totp.qr_code+'" alt="QR Code para configurar o autenticador" style="width:210px;display:block;margin:15px auto">';
      document.getElementById("mfa-ajuda").textContent="Primeiro acesso: escaneie o QR Code e informe o código gerado.";
    }
  }
  form.addEventListener("submit",function(e){e.preventDefault();e.stopImmediatePropagation();estado("Entrando…","progresso");
    sb.auth.signInWithPassword({email:form.usuario.value.trim(),password:form.senha.value}).then(function(r){if(r.error)throw r.error;estado("");return aposSenha();}).catch(erro);
  },true);
  async function validarTotp(){
    var botao=document.getElementById("btn-totp");
    try{ var codigo=document.getElementById("l-totp").value;
      botao.disabled=true; estado("Validando código…","progresso");
      await Auth.validarMfa(sb.auth,fator,codigo);
      estado("Código confirmado. Abrindo o painel…","sucesso"); await carregarPerfil();
    }catch(e){erro(e);botao.disabled=false;document.getElementById("l-totp").select();}
  }
  document.getElementById("btn-totp").addEventListener("click",validarTotp);
  document.getElementById("l-totp").addEventListener("keydown",function(e){if(e.key==="Enter"){e.preventDefault();validarTotp();}});
  document.getElementById("btn-sair").addEventListener("click",async function(){await sb.auth.signOut();sessionStorage.clear();location.href="../index.html";});

  function esc(valor){return String(valor==null?"":valor).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
  function htmlPerfil(){
    return '<header class="adm-head"><div><span class="eyebrow">Minha conta</span><h1>Perfil e plantão</h1></div></header><div class="adm-grid2"><section class="adm-card"><h3>Status de atendimento</h3><p id="status-texto" class="muted">Consultando…</p>'+
      (Auth.podeAtender(perfil)?'<button class="btn btn--block" id="btn-plantao">Carregando…</button>':'<div class="adm-alert">Este usuário não participa do plantão nem recebe contatos.</div>')+'</section><section class="adm-card"><h3>Meus dados</h3><form id="form-perfil" class="form"><div class="field full"><label>Nome completo</label><input name="nome" value="'+esc(perfil.nome_completo)+'" required></div><div class="field full"><label>E-mail</label><input value="'+esc(perfil.email)+'" disabled></div><div class="field full"><label>WhatsApp</label><input name="whatsapp" value="'+esc(perfil.whatsapp||'')+'" placeholder="5521964898458" pattern="55[1-9][0-9]{9,10}" required><small>Somente números: 55 + DDD + número.</small></div><button class="btn full" type="submit">Salvar dados</button></form></section></div>';
  }
  async function abrirPerfil(){
    document.getElementById("adm-main").innerHTML=htmlPerfil(); var on=await rpc("meu_status_plantao"), b=document.getElementById("btn-plantao"), t=document.getElementById("status-texto");
    function pintar(){if(!b)return;b.dataset.on=on?"1":"0";b.textContent=on?"Atendendo":"Indisponível";b.style.background=on?"#16834f":"#b3261e";t.textContent=on?"Você está recebendo contatos pelo rodízio até sair ou até 23h59.":"Você não está recebendo contatos.";} pintar();
    if(b)b.onclick=async function(){b.disabled=true;try{on=await rpc("alternar_plantao",{deseja_atender:!on});pintar();}catch(e){alert(e.message);}b.disabled=false;};
    document.getElementById("form-perfil").onsubmit=async function(e){e.preventDefault();var w=this.whatsapp.value.replace(/\D/g,"");try{await rpc("atualizar_meu_perfil",{p_nome:this.nome.value,p_whatsapp:w});perfil.nome_completo=this.nome.value;perfil.whatsapp=w;alert("Dados atualizados.");}catch(x){alert(x.message);}};
  }
  async function abrirControle(){
    if(!Auth.podeVerControle(perfil))return; var p=await sb.from("staff_profiles").select("id,nome_completo,papel").order("nome_completo"), s=await sb.from("duty_sessions").select("user_id,inicio,fim,motivo_fim").gte("inicio",new Date(Date.now()-60*864e5).toISOString()).order("inicio",{ascending:false});
    var abertas={};(s.data||[]).forEach(function(x){if(!x.fim)abertas[x.user_id]=true;});
    document.getElementById("adm-main").innerHTML='<header class="adm-head"><div><span class="eyebrow">Somente Gerencial</span><h1>Controle gerencial</h1></div></header><div class="adm-card adm-table-wrap"><table class="adm-table"><thead><tr><th>Funcionário</th><th>Perfil</th><th>Status atual</th><th>Histórico (60 dias)</th></tr></thead><tbody>'+(p.data||[]).map(function(x){var hist=(s.data||[]).filter(function(y){return y.user_id===x.id;}).map(function(y){return '<small>'+new Date(y.inicio).toLocaleString('pt-BR')+' — '+(y.fim?new Date(y.fim).toLocaleString('pt-BR'):'agora')+'</small>';}).join('');return '<tr><td><b>'+esc(x.nome_completo)+'</b></td><td>'+esc(x.papel)+'</td><td><span class="st '+(abertas[x.id]?'st-publicado':'st-rejeitado')+'">'+(abertas[x.id]?'Atendendo':'Indisponível')+'</span></td><td>'+ (hist||'Sem registros')+'</td></tr>';}).join('')+'</tbody></table></div>';
  }
  document.getElementById("adm-nav").addEventListener("click",function(e){var b=e.target.closest("[data-equipe-view]");if(!b)return;e.preventDefault();e.stopImmediatePropagation();if(b.dataset.equipeView==="perfil")abrirPerfil();else abrirControle();},true);
  (async function(){try{if(location.search.indexOf("logout=1")>=0){await sb.auth.signOut();history.replaceState({},"",location.pathname);}var u=await sb.auth.getUser();if(u.data&&u.data.user)await aposSenha();}catch(e){erro(e);}})();
})();
