import { readFile } from 'node:fs/promises';
import { Resend } from 'resend';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from '../config/env.js';
import { LOGO_CID } from './templates.js';

const LOGO_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), 'assets', 'logo.png');

let resendClient = null;

const getClient = () => {
  if (!resendClient) {
    resendClient = new Resend(env.resend.apiKey);
  }
  return resendClient;
};

export const mailConfigured = () => Boolean(env.resend.apiKey);

export function fromAddress() {
  return env.resend.from;
}

export function explainMailError(error) {
  return String(error?.message || error || 'Unknown Resend error.');
}

export async function verifyMail() {
  if (!mailConfigured()) {
    return {
      ok: false,
      reason: 'RESEND_API_KEY is not configured.',
    };
  }

  return { ok: true, reason: 'Resend API key is configured.' };
}

export async function sendMail({ to, subject, text, html }) {
  if (!mailConfigured()) {
    console.error(`[mail] Resend is not configured. Email to ${to} was NOT sent.`);
    return { sent: false, error: 'RESEND_API_KEY is not configured.' };
  }

  try {
    const attachments =
      html && html.includes(`cid:${LOGO_CID}`)
        ? [
            {
              content: (await readFile(LOGO_PATH)).toString('base64'),
              filename: 'citysync-logo.png',
              contentId: LOGO_CID,
            },
          ]
        : [];
    const { data, error } = await getClient().emails.send({
      from: fromAddress(),
      to: [to],
      subject,
      ...(text ? { text } : {}),
      ...(html ? { html } : {}),
      ...(attachments.length ? { attachments } : {}),
    });

    if (error) {
      const reason = explainMailError(error);
      console.error(`[mail] FAILED to send "${subject}" to ${to}: ${reason}`);
      return { sent: false, error: reason };
    }

    console.log(`[mail] sent "${subject}" to ${to} (${data?.id || 'ok'})`);
    return { sent: true };
  } catch (error) {
    const reason = explainMailError(error);
    console.error(`[mail] FAILED to send "${subject}" to ${to}: ${reason}`);
    return { sent: false, error: reason };
  }
}

export async function checkMailOnStartup() {
  if (!mailConfigured()) {
    console.warn('[mail] RESEND_API_KEY is not set. Emails cannot be sent.');
    return;
  }

  console.log(`[mail] Resend API configured. Sending as ${fromAddress()}.`);
}

export * from './templates.js';
