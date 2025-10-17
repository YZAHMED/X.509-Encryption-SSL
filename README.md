# ProjectSSL — CryptoEncryption

A small, end‑to‑end demo showing how to:
- Generate a self‑signed CA and server certificate (X.509) with RSA keys
- Expose simple RSA‑OAEP encrypt/decrypt APIs
- Run locally with Express and deploy serverless API endpoints on Netlify Functions
- Handle ESM vs CJS differences, environment config, and serverless bundling constraints

Live site
- https://projectssl.netlify.app/
- API (via Netlify Functions): https://projectssl.netlify.app/api/encrypt and /api/decrypt

## What this demonstrates

- Public Key Infrastructure basics:
  - Self‑signed CA and server certificates (X.509)
  - Key usage for TLS-like flows and application crypto
- Asymmetric encryption:
  - RSA keypair generation and RSA‑OAEP encryption/decryption (node‑forge)
  - Base64 encoding/decoding for transport
- Node.js module systems:
  - ES Modules in Node (type: module), and handling CJS when functions are bundled
  - Robust path resolution for serverless functions (fallback when import.meta.url isn’t available)
- Serverless deployment on Netlify:
  - Functions routing with netlify.toml (rewrite /api/*)
  - Bundling non‑code assets into functions (included_files)
  - Working around AWS Lambda’s 4KB environment variable limit (reading PEMs from files instead of env)
- DevOps hygiene:
  - Environment-aware ports (PORT vs defaults)
  - Separating local HTTPS from hosted TLS termination
  - .gitignore and security considerations for secrets in demos

## Stack

- Node.js (ESM), Express (for local dev)
- node‑forge for RSA and X.509
- Netlify for static hosting and serverless functions

## Local quick start

1) Install
```bash
npm install
```

2) Generate certificates (creates ca/server PEMs)
```bash
node generate-certs.js
```

3) Run locally with Express (HTTP defaults to 3000, HTTPS 8443 if PEMs found)
```bash
node server.js
# curl -i http://localhost:3000/
```

4) Local function testing (optional, via Netlify CLI)
```bash
npm i -g netlify-cli
netlify dev
# curl -i http://localhost:8888/api/encrypt
```

## API

- POST /api/encrypt
  - body: { "data": "<string>" }
  - resp: { "originalData": "...", "encryptedData": "<base64>" }

- POST /api/decrypt
  - body: { "encryptedData": "<base64>" }
  - resp: { "encryptedData": "...", "decryptedData": "<string>" }

## Curl examples

- Basic check
```bash
curl -i https://projectssl.netlify.app/
```

- Encrypt
```bash
curl -s -X POST https://projectssl.netlify.app/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data":"hello world"}' | jq .
```

- Roundtrip
```bash
ENC=$(curl -s -X POST https://projectssl.netlify.app/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data":"demo"}' | jq -r .encryptedData) \
&& curl -s -X POST https://projectssl.netlify.app/api/decrypt \
  -H "Content-Type: application/json" \
  -d "{\"encryptedData\":\"$ENC\"}" | jq .
```

## Certificates

- generate-certs.js builds:
  - ca-key.pem, ca-cert.pem (root CA)
  - server-key.pem, server-cert.pem (server)
- Local server can use these for HTTPS and for RSA encrypt/decrypt endpoints.

Note: For Netlify Functions, PEMs are bundled as files alongside the functions to avoid the 4KB environment variable limit.

## Netlify deployment

- Publish directory: public
- Functions directory: netlify/functions
- No build command needed
- Branch: main

netlify.toml (key parts)
```toml
[build]
  publish = "public"
  functions = "netlify/functions"

[functions]
  node_bundler = "esbuild"
  included_files = ["netlify/functions/keys/**"]

[[redirects]]
  from = "/api/*"
  to   = "/.netlify/functions/:splat"
  status = 200
```

Functions read PEMs from files (bundled with deploy):
- netlify/functions/keys/server-cert.pem
- netlify/functions/keys/server-key.pem

Security note: Committing private keys is only for this demo. In real projects, use a secrets manager or a host that supports secure file injection.

## Architecture overview

- Local:
  - Express app (server.js) with JSON endpoints and optional self‑signed HTTPS
  - RSA keys loaded from PEM files
- Hosted (Netlify):
  - Static site (public/index.html)
  - Serverless functions for /api/*
  - PEMs included in the function bundle via included_files
  - Path resolution compatible with both ESM and bundled CJS

## Troubleshooting I handled

- SyntaxError: Cannot use import outside a module
  - Fixed via package.json "type": "module"
- node‑forge import variations
  - Using default import consistently
- Netlify env var 4KB limit for Lambda
  - Moved PEMs from env to bundled files
- import.meta.url undefined in bundled CJS
  - Implemented __dirname fallback to resolve paths robustly
- Static publish dir empty
  - Added public/index.html

## Future improvements

- Replace RSA‑OAEP demo with a hybrid scheme (RSA for key exchange + AES‑GCM for payloads)
- Rotate keys and add key IDs in responses
- Add unit tests and GitHub Actions CI
- Use managed secrets instead of bundling PEMs for demo

## License

ISC