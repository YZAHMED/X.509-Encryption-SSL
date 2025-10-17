import https from 'https';
import http from 'http';
import express from 'express';
import fs from 'fs';
import nodeForge from 'node-forge';

// try load TLS credentials (from env or files)
let credentials = null;
let useHttps = false;

const maybeKey = process.env.SERVER_KEY;
const maybeCert = process.env.SERVER_CERT;
const maybeCa = process.env.CA_CERT;

try {
  if (maybeKey && maybeCert) {
    credentials = { key: maybeKey, cert: maybeCert, ca: maybeCa };
    useHttps = true;
    console.log('TLS credentials loaded from environment variables.');
  } else {
    const key = fs.readFileSync('server-key.pem', 'utf-8');
    const cert = fs.readFileSync('server-cert.pem', 'utf-8');
    const ca = fs.existsSync('ca-cert.pem') ? fs.readFileSync('ca-cert.pem', 'utf-8') : undefined;
    credentials = { key, cert, ca };
    useHttps = true;
    console.log('TLS credentials loaded from disk.');
  }
} catch (err) {
  console.log('No TLS credentials available; falling back to HTTP. (' + err.message + ')');
  useHttps = false;
}

// 2. Create an Express Application
const app = express();
app.use(express.json()); // middleware to parse JSON bodies

// 2. Load Server's Public/Private Keys for Encryption Logic (if available)
let serverPublicKey = null;
let serverPrivateKey = null;
try {
  const certPem = credentials ? credentials.cert : fs.readFileSync('server-cert.pem', 'utf-8');
  const keyPem = credentials ? credentials.key : fs.readFileSync('server-key.pem', 'utf-8');
  serverPublicKey = nodeForge.pki.certificateFromPem(certPem).publicKey;
  serverPrivateKey = nodeForge.pki.privateKeyFromPem(keyPem);
  console.log('Server public/private keys loaded for encryption.');
} catch (err) {
  console.log('Encryption keys not available — /encrypt and /decrypt endpoints will return 503 if used. (' + err.message + ')');
}

// 3. Define Routes

app.get("/", (req, res) => {
  res.send("<h1>Hello, Secure World!</h1><p>Your connection is encrypted (if using HTTPS).</p>");
});

app.post("/encrypt", (req, res) => {
  if (!serverPublicKey) {
    return res.status(503).json({ error: 'Server public key not available on this instance.' });
  }
  const { data } = req.body;
  if (!data) {
    return res.status(400).json({ error: "Please provide data in the JSON body." });
  }
  const encrypted = serverPublicKey.encrypt(data, 'RSA-OAEP');
  const encryptedBase64 = nodeForge.util.encode64(encrypted);
  res.json({ originalData: data, encryptedData: encryptedBase64, note: "Encrypted with server public key." });
});

app.post("/decrypt", (req, res) => {
  if (!serverPrivateKey) {
    return res.status(503).json({ error: 'Server private key not available on this instance.' });
  }
  const { encryptedData } = req.body;
  if (!encryptedData) {
    return res.status(400).json({ error: "Please provide encryptedData in the JSON body." });
  }
  const encryptedBytes = nodeForge.util.decode64(encryptedData);
  const decrypted = serverPrivateKey.decrypt(encryptedBytes, 'RSA-OAEP');
  res.json({ encryptedData, decryptedData: decrypted });
});

// listen: use environment PORT if provided, else default (HTTPS 8443 or HTTP 3000)
const envPort = process.env.PORT ? Number(process.env.PORT) : undefined;
const PORT = envPort || (useHttps ? 8443 : 3000);

if (useHttps && credentials) {
  https.createServer(credentials, app).listen(PORT, () => {
    console.log(`HTTPS Server running on https://localhost:${PORT}`);
  });
} else {
  // start plain HTTP (platforms like Render, Replit usually terminate TLS for you)
  http.createServer(app).listen(PORT, () => {
    console.log(`HTTP Server running on http://localhost:${PORT}`);
  });
}

