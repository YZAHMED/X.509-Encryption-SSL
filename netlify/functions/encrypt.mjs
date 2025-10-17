import nodeForge from 'node-forge';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { data } = JSON.parse(event.body);
    if (!data) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Please provide data' }) };
    }

    // Load server public key from environment variable
    const certPem = process.env.SERVER_CERT;
    if (!certPem) {
      return { statusCode: 503, body: JSON.stringify({ error: 'Server certificate not configured' }) };
    }

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