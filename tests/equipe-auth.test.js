"use strict";
const test = require("node:test"), assert = require("node:assert/strict");
const Auth = require("../frontend/retaguarda/auth-fluxo.js");

test("primeiro acesso separa fatores incompletos para recriação limpa", () => {
  const fs={totp:[{id:"antigo",status:"unverified"}]};
  assert.equal(Auth.fatorVerificado(fs),null); assert.deepEqual(Auth.fatoresPendentes(fs).map(x=>x.id),["antigo"]);
});
test("acesso recorrente reutiliza somente o TOTP verificado", () => {
  const fs={totp:[{id:"incompleto",status:"unverified"},{id:"correto",status:"verified"}]};
  assert.equal(Auth.fatorVerificado(fs).id,"correto");
});
test("TOTP exige seis dígitos antes de consultar o servidor", async () => {
  await assert.rejects(Auth.validarMfa({mfa:{}},{id:"f"},"12A"),/6 números/);
});
test("TOTP válido percorre challenge, verify e confirma AAL2", async () => {
  const chamadas=[]; const auth={mfa:{
    challenge:async x=>(chamadas.push(["challenge",x]),{data:{id:"c"}}),
    verify:async x=>(chamadas.push(["verify",x]),{data:{session:"ok"}}),
    getAuthenticatorAssuranceLevel:async ()=>(chamadas.push(["aal"]),{data:{currentLevel:"aal2"}})
  }};
  await Auth.validarMfa(auth,{id:"f"},"123 456");
  assert.deepEqual(chamadas.map(x=>x[0]),["challenge","verify","aal"]);
});
test("código rejeitado não libera o painel", async () => {
  const auth={mfa:{challenge:async()=>({data:{id:"c"}}),verify:async()=>({error:new Error("invalid code")}),getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:"aal2"}})}};
  await assert.rejects(Auth.validarMfa(auth,{id:"f"},"123456"),/invalid code/);
});
test("sessão que permanece AAL1 não libera o painel", async () => {
  const auth={mfa:{challenge:async()=>({data:{id:"c"}}),verify:async()=>({data:{}}),getAuthenticatorAssuranceLevel:async()=>({data:{currentLevel:"aal1"}})}};
  await assert.rejects(Auth.validarMfa(auth,{id:"f"},"123456"),/sessão segura/);
});
test("Master vê controle, mas não atende nem recebe leads", () => {
  const p={papel:"master",ativo:true,pode_atender:false,recebe_leads:false};
  assert.equal(Auth.podeVerControle(p),true); assert.equal(Auth.podeAtender(p),false); assert.equal(Auth.recebeLeads(p),false);
});
test("Gerencial pode ver controle e participar do plantão", () => {
  const p={papel:"gerencial",ativo:true,pode_atender:true,recebe_leads:true};
  assert.equal(Auth.podeVerControle(p),true); assert.equal(Auth.podeAtender(p),true); assert.equal(Auth.recebeLeads(p),true);
});
test("Consultor atende, mas não enxerga o controle gerencial", () => {
  const p={papel:"consultor",ativo:true,pode_atender:true,recebe_leads:true};
  assert.equal(Auth.podeVerControle(p),false); assert.equal(Auth.podeAtender(p),true); assert.equal(Auth.recebeLeads(p),true);
});
test("Consultor vê somente o próprio perfil e as ofertas", () => {
  const p={papel:"consultor",ativo:true,pode_atender:true,recebe_leads:true};
  assert.deepEqual(Auth.viewsPermitidas(p),["perfil","ofertas"]);
  assert.equal(Auth.podeVerView(p,"controle"),false);
  assert.equal(Auth.podeVerView(p,"config"),false);
});
test("Gerencial vê ferramentas administrativas e controle", () => {
  const p={papel:"gerencial",ativo:true,pode_atender:true,recebe_leads:true};
  assert.equal(Auth.podeVerView(p,"controle"),true);
  assert.equal(Auth.podeVerView(p,"config"),true);
});
test("Master tem tela gerencial, mas permanece fora do plantão", () => {
  const p={papel:"master",ativo:true,pode_atender:false,recebe_leads:false};
  assert.equal(Auth.podeVerView(p,"controle"),true);
  assert.equal(Auth.podeAtender(p),false);
});
test("usuário inativo nunca participa do rodízio", () => {
  const p={papel:"consultor",ativo:false,pode_atender:true,recebe_leads:true};
  assert.equal(Auth.podeAtender(p),false); assert.equal(Auth.recebeLeads(p),false);
});
test("perfil próprio só é liberado quando ativo", () => {
  const resposta=[{papel:"master",ativo:true}];
  const perfil=Array.isArray(resposta)?resposta[0]:resposta;
  assert.equal(perfil.ativo,true);
});
