import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const DIR = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(new URL(import.meta.url).pathname);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json', 'X-Developed-By': 'Yaqoob Ahmed' }, body: JSON.stringify({ error: 'Method not allowed', developedBy: 'Yaqoob Ahmed' }) };
  }

  try {
    const { data } = JSON.parse(event.body || '{}');
    if (!data) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json', 'X-Developed-By': 'Yaqoob Ahmed' }, body: JSON.stringify({ error: 'Please provide data', developedBy: 'Yaqoob Ahmed' }) };
    }

    const certPem = fs.readFileSync(path.join(DIR, 'keys', 'server-cert.pem'), 'utf8');
    const publicKey = forge.pki.certificateFromPem(certPem).publicKey;

    const encrypted = publicKey.encrypt(data, 'RSA-OAEP');
    const encryptedBase64 = forge.util.encode64(encrypted);

    return { statusCode: 200, headers: { 'Content-Type': 'application/json', 'X-Developed-By': 'Yaqoob Ahmed' }, body: JSON.stringify({ originalData: data, encryptedData: encryptedBase64, developedBy: 'Yaqoob Ahmed' }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json', 'X-Developed-By': 'Yaqoob Ahmed' }, body: JSON.stringify({ error: err.message, developedBy: 'Yaqoob Ahmed' }) };
  }
}