const crypto = require('crypto');
const area = process.argv[2] || 'Ongole';
const days = parseInt(process.argv[3] || '7', 10);
if (!/^[A-Za-z ]+$/.test(area) || !(days > 0)) {
  console.log('Usage: node invite.js Ongole 7');
  process.exit(1);
}
const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const part = () => Array.from({ length: 4 }, () =>
  abc[crypto.randomInt(abc.length)]).join('');
const code = 'CIVIC-' + part() + '-' + part() + '-' + part();
const hash = crypto.createHash('sha256').update(code).digest('hex');
const sql =
  "INSERT INTO authority_invites (id,code_hash,area,expires_at) VALUES " +
  "('inv_'||substr(md5(random()::text),1,12),'" + hash + "','" + area +
  "',NOW()+INTERVAL '" + days + " days');";
console.log('CODE: ' + code);
console.log(sql);
