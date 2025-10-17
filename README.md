# CryptoEncryption

Small Node.js project that demonstrates generating a self-signed CA and a server certificate, then using those keys for simple RSA encrypt/decrypt endpoints.

Quick summary:
- ES module project (package.json contains `"type": "module"`).
- Uses node-forge to generate keys/certs and perform RSA operations.
- Express app exposes `/` (welcome), `/encrypt` and `/decrypt` endpoints.
- Can run with self-signed certs (HTTPS) or plain HTTP. Works on hosted platforms that provide a PORT env var.

## Setup

1. Install dependencies
```bash
npm install
```

2. (Optional) Generate local certs (creates `ca-key.pem`, `ca-cert.pem`, `server-key.pem`, `server-cert.pem`)
```bash
node generate-certs.js
```

3. Run the server locally
```bash
node server.js
# or explicitly set PORT
PORT=3000 node server.js
```

## Environment / Hosting

- The server respects `process.env.PORT`. If not provided, it defaults to 8443 (if TLS files found) or 3000 (HTTP).
- TLS can be provided either as PEM files in the project (`server-key.pem`, `server-cert.pem`, `ca-cert.pem`) or via environment variables `SERVER_KEY`, `SERVER_CERT`, `CA_CERT` containing PEM text.
- When deploying to a host that terminates TLS (Render, Vercel, Fly.io, Replit), you can run the app over plain HTTP and let the platform handle TLS.

Recommended free hosts for quick testing:
- Replit — quick dev loop + public URL
- Render — free web service with TLS
- Fly.io — small apps, public URL

## API (JSON)

GET /
- Returns a simple HTML welcome.

POST /encrypt
- Body: `{ "data": "<string to encrypt>" }`
- Response: `{ "originalData": "...", "encryptedData": "<base64>" }`
- Returns 503 if server public key not available.

POST /decrypt
- Body: `{ "encryptedData": "<base64>" }`
- Response: `{ "encryptedData": "...", "decryptedData": "<string>" }`
- Returns 503 if server private key not available.

## Curl examples

Local HTTP:
```bash
curl -i http://localhost:3000/
curl -i -X POST http://localhost:3000/encrypt -H "Content-Type: application/json" -d '{"data":"hello"}'
```

Local HTTPS with self-signed certs:
```bash
curl -i --insecure https://localhost:8443/
```

Hosted (valid TLS):
```bash
curl -i https://your-app.example.com/
```

## Notes
- For production use, do not keep private keys in plain files in a repo. Use your host's secret management.
- RSA is used here for demo/encryption endpoints; consider standard TLS and modern crypto practices for real apps.

License: ISC