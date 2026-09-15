import "server-only";

/**
 * Envio de e-mail transacional.
 *
 * Usa Resend (plano gratuito: 3.000 e-mails/mes) quando RESEND_API_KEY
 * estiver definida. Sem a chave, o codigo e apenas registrado no log do
 * servidor - o login continua funcionando (basta ler o log no Render),
 * sem depender de servico externo para subir.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendResult {
  delivered: boolean;
  /** true quando caiu no fallback de log (sem servico configurado). */
  loggedOnly: boolean;
}

function fromAddress(): string {
  /*
    onboarding@resend.dev funciona sem verificar dominio, mas o Resend so
    entrega para o e-mail dono da conta. Para enviar a qualquer destinatario,
    verifique um dominio e defina MAIL_FROM.
  */
  return process.env.MAIL_FROM?.trim() || "onboarding@resend.dev";
}

export async function sendLoginCode(
  email: string,
  code: string,
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();

  if (!apiKey) {
    console.warn(
      `\n[login] RESEND_API_KEY ausente. Codigo para ${email}: ${code}\n` +
        `[login] Configure RESEND_API_KEY para receber por e-mail.\n`,
    );
    return { delivered: false, loggedOnly: true };
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Preço de Banana <${fromAddress()}>`,
        to: [email],
        subject: `${code} é o seu código de acesso`,
        text:
          `Seu código de acesso ao painel é: ${code}\n\n` +
          `Ele vale por 10 minutos e só pode ser usado uma vez.\n` +
          `Se você não pediu este código, ignore este e-mail.`,
        html: `
          <div style="font-family:system-ui,-apple-system,sans-serif;max-width:420px;margin:0 auto;padding:24px">
            <p style="font-size:14px;color:#4a3a24;margin:0 0 16px">
              Seu código de acesso ao painel:
            </p>
            <p style="font-size:34px;font-weight:800;letter-spacing:7px;
                      background:#fef3c7;color:#2b2013;padding:16px;
                      border-radius:12px;text-align:center;margin:0">
              ${code}
            </p>
            <p style="font-size:12px;color:#7c6849;margin:16px 0 0">
              Vale por 10 minutos e só pode ser usado uma vez.
              Se você não pediu este código, ignore este e-mail.
            </p>
          </div>`,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error(`[login] Resend HTTP ${response.status}: ${detail.slice(0, 200)}`);
      // Fallback: o admin ainda consegue entrar lendo o log.
      console.warn(`[login] Codigo para ${email}: ${code}`);
      return { delivered: false, loggedOnly: true };
    }

    return { delivered: true, loggedOnly: false };
  } catch (error) {
    console.error("[login] falha ao enviar e-mail:", error);
    console.warn(`[login] Codigo para ${email}: ${code}`);
    return { delivered: false, loggedOnly: true };
  }
}
