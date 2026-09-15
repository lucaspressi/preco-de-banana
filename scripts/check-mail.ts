import "dotenv/config";

/**
 * Diagnostica o envio de e-mail (Resend).
 *
 * Uso (no Shell do Render):
 *   npx tsx scripts/check-mail.ts seu@email.com
 *
 * Mostra a resposta real da API - o fluxo de login registra falhas apenas
 * no log, entao este script e o caminho rapido para ver o motivo.
 */

const to = process.argv[2];

if (!to) {
  console.error("Uso: npx tsx scripts/check-mail.ts destinatario@email.com");
  process.exit(1);
}

const apiKey = process.env.RESEND_API_KEY?.trim();
const from = process.env.MAIL_FROM?.trim() || "onboarding@resend.dev";

console.log("\n=== Diagnostico de e-mail ===\n");
console.log(`RESEND_API_KEY: ${apiKey ? `definida (${apiKey.slice(0, 6)}...)` : "AUSENTE"}`);
console.log(`MAIL_FROM:      ${from}${process.env.MAIL_FROM ? "" : "  (padrao)"}`);
console.log(`Destinatario:   ${to}\n`);

if (!apiKey) {
  console.error("✗ Sem RESEND_API_KEY nao ha envio. Defina no painel do Render.");
  process.exit(1);
}

if (!apiKey.startsWith("re_")) {
  console.warn("⚠ Chaves do Resend costumam comecar com 're_'. Confira o valor.\n");
}

const response = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: `Preço de Banana <${from}>`,
    to: [to],
    subject: "Teste de envio — Preço de Banana",
    text: "Se você recebeu este e-mail, o envio está funcionando.",
  }),
});

const body = await response.text();
console.log(`Status HTTP: ${response.status}`);
console.log(`Resposta:    ${body}\n`);

if (response.ok) {
  console.log("✓ Aceito pelo Resend. Confira a caixa de entrada e o spam.");
  console.log("  Se nao chegar, veja em https://resend.com/emails o status real.\n");
} else {
  console.error("✗ Falha no envio.\n");

  if (body.includes("domain") || body.includes("verif")) {
    console.error("  Causa provavel: dominio do MAIL_FROM nao verificado.");
    console.error("  Verifique o dominio em https://resend.com/domains");
    console.error("  ou deixe MAIL_FROM vazio para usar onboarding@resend.dev.\n");
  }

  if (body.includes("testing") || body.includes("own email")) {
    console.error("  Causa provavel: com onboarding@resend.dev o Resend SO entrega");
    console.error("  para o e-mail dono da conta. Para enviar a outros enderecos,");
    console.error("  verifique um dominio e defina MAIL_FROM.\n");
  }

  if (response.status === 401 || response.status === 403) {
    console.error("  Causa provavel: API key invalida ou revogada.\n");
  }
}
