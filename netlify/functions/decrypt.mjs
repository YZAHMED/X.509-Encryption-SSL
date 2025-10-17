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
    const { encryptedData } = JSON.parse(event.body);
    if (!encryptedData) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Please provide encryptedData' }) };
    }

    // Read key from file
    const keyPath = path.join(__dirname, '../../server-key.pem');
    const keyPem = fs.readFileSync(keyPath, 'utf-8');

    const privateKey = nodeForge.pki.privateKeyFromPem(keyPem);
    const encryptedBytes = nodeForge.util.decode64(encryptedData);
    const decrypted = privateKey.decrypt(encryptedBytes, 'RSA-OAEP');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ encryptedData, decryptedData: decrypted })
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}