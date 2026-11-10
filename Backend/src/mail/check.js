// Usage: npm run mail:test
//        npm run mail:test your-email@example.com

import { mailConfigured, verifyMail, sendMail, fromAddress, passwordResetEmail } from './mailer.js';
import { env } from '../config/env.js';

const to = process.argv[2];

console.log(`Email provider: Resend`);
console.log(`From: ${fromAddress()}`);

if (!mailConfigured()) {
  console.error('\nRESEND_API_KEY is not configured.');
  process.exit(1);
}

const v = await verifyMail();

if (!v.ok) {
  console.error(`\nResend configuration error: ${v.reason}`);
  process.exit(1);
}

console.log('\nResend API key is configured.');

if (to) {
  const r = await sendMail({
    to,
    ...passwordResetEmail({
      name: 'there',
      portal: 'Citizen',
      link: `${env.appUrl}/citizen/?reset=sample-link-not-valid`,
      minutes: env.resetTokenMinutes,
    }),
  });

  console.log(r.sent ? `✔ Test email sent to ${to}. Check your inbox.` : `✘ Sending failed: ${r.error}`);

  process.exit(r.sent ? 0 : 1);
}
