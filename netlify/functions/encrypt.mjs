import nodeForge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { data } = JSON.parse(event.body);
    if (!data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Please provide data' }) };
    }

    // Read cert from file (stored in repo root, accessible via relative path)
    const certPath = path.join(__dirname, '../../server-cert.pem');
    const certPem = fs.readFileSync(certPath, 'utf-8');

    const cert = nodeForge.pki.certificateFromPem(certPem);
    const publicKey = cert.publicKey;

    const encrypted = publicKey.encrypt(data, 'RSA-OAEP');
    const encryptedBase64 = nodeForge.util.encode64(encrypted);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalData: data, encryptedData: encryptedBase64 })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}