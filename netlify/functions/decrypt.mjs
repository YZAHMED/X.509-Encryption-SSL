import forge from 'node-forge';
import fs from 'fs';
import path from 'path';

const DIR = typeof __dirname !== 'undefined'
  ? __dirname
  : path.dirname(new URL(import.meta.url).pathname);

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { encryptedData } = JSON.parse(event.body || '{}');
    if (!encryptedData) {
      return { statusCode: 400, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: 'Please provide encryptedData' }) };
    }

    const keyPem = fs.readFileSync(path.join(DIR, 'keys', 'server-key.pem'), 'utf8');
    const privateKey = forge.pki.privateKeyFromPem(keyPem);

    const encryptedBytes = forge.util.decode64(encryptedData);
    const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP');

    return { statusCode: 200, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ encryptedData, decryptedData: decrypted }) };
  } catch (err) {
    return { statusCode: 500, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ error: err.message }) };
  }
}