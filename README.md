# ProjectSSL — CryptoEncryption

A hands-on demo project I built to explore X.509 certificates, RSA encryption, and serverless deployment. This shows how to set up end-to-end encryption using self-signed certificates and deploy it as serverless functions.

**Live Demo:**
- https://encryption.yaqoobahmed.com/
- API endpoints: `/api/encrypt` and `/api/decrypt`

## What I Built

This project demonstrates several concepts I wanted to learn:

**Public Key Infrastructure (PKI)**
- Generating self-signed CA and server certificates (X.509 format)
- Using certificates for both TLS and application-level encryption
- Understanding how certificate chains work

**Asymmetric Encryption**
- RSA keypair generation using node-forge
- RSA-OAEP encryption/decryption (industry standard padding)
- Base64 encoding for safe data transport

**Modern Node.js Development**
- ES Modules (type: module) vs CommonJS
- Handling module system differences when bundling for serverless
- Robust path resolution that works in both ESM and bundled environments

**Serverless Deployment**
- Netlify Functions for API endpoints
- Routing configuration with netlify.toml
- Bundling certificate files with functions (working around AWS Lambda's 4KB env var limit)
- Environment-aware configuration

**UI/UX**
- Clean, modern interface with gradient design
- Real-time encryption/decryption with visual feedback
- Copy-to-clipboard functionality
- Loading states and error handling
- Responsive design for mobile devices

## Tech Stack

- **Runtime:** Node.js with ES Modules
- **Local Server:** Express.js
- **Crypto Library:** node-forge (RSA, X.509)
- **Hosting:** Netlify (static site + serverless functions)
- **Frontend:** Vanilla JavaScript with modern CSS

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Generate Certificates
This creates the CA and server certificates needed for encryption:
```bash
node generate-certs.js
```

This will generate:
- `ca-key.pem` and `ca-cert.pem` (Certificate Authority)
- `server-key.pem` and `server-cert.pem` (Server certificate)

### 3. Run Locally
Start the Express server:
```bash
node server.js
```

The server will:
- Use HTTPS on port 8443 if certificates are found
- Fall back to HTTP on port 3000 if no certificates
- Respect the `PORT` environment variable if set

Test it:
```bash
curl -i http://localhost:3000/
```

### 4. Test Netlify Functions Locally (Optional)
If you want to test the serverless functions before deploying:
```bash
npm i -g netlify-cli
netlify dev
```

This runs the Netlify dev server on port 8888:
```bash
curl -i http://localhost:8888/api/encrypt
```

## API Reference

### Encrypt Endpoint
**POST** `/api/encrypt`

Request body:
```json
{
  "data": "your plain text here"
}
```

Response:
```json
{
  "originalData": "your plain text here",
  "encryptedData": "base64-encoded-encrypted-data"
}
```

### Decrypt Endpoint
**POST** `/api/decrypt`

Request body:
```json
{
  "encryptedData": "base64-encoded-encrypted-data"
}
```

Response:
```json
{
  "encryptedData": "base64-encoded-encrypted-data",
  "decryptedData": "your original plain text"
}
```

## Example Usage

### Basic Health Check
```bash
curl -i https://encryption.yaqoobahmed.com/
```

### Encrypt Some Data
```bash
curl -s -X POST https://encryption.yaqoobahmed.com/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data":"hello world"}' | jq .
```

### Full Roundtrip (Encrypt then Decrypt)
```bash
# Encrypt
ENC=$(curl -s -X POST https://encryption.yaqoobahmed.com/api/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data":"demo message"}' | jq -r .encryptedData)

# Decrypt
curl -s -X POST https://encryption.yaqoobahmed.com/api/decrypt \
  -H "Content-Type: application/json" \
  -d "{\"encryptedData\":\"$ENC\"}" | jq .
```

## Certificate Management

The `generate-certs.js` script creates a complete certificate chain:
- **CA Certificate:** Root certificate authority (self-signed)
- **Server Certificate:** Signed by the CA, used for encryption operations

For local development, these PEM files are read directly from disk. For Netlify Functions, they're bundled alongside the function code (see `netlify.toml` configuration).

**Important Security Note:** In this demo, private keys are committed to the repository for simplicity. In production, you should:
- Use a secrets manager (AWS Secrets Manager, HashiCorp Vault, etc.)
- Store keys in environment variables (if small enough)
- Use a secure file injection system provided by your hosting platform

## Deployment to Netlify

The project is configured for easy Netlify deployment:

**Configuration (`netlify.toml`):**
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

**Deployment Steps:**
1. Push to your GitHub repository
2. Connect the repo to Netlify
3. Set publish directory to `public`
4. Set functions directory to `netlify/functions`
5. Deploy!

The certificate files need to be in `netlify/functions/keys/`:
- `server-cert.pem`
- `server-key.pem`

## Architecture

**Local Development:**
- Express.js server handles HTTP/HTTPS
- Certificates loaded from PEM files in project root
- Direct file system access for keys

**Production (Netlify):**
- Static HTML/CSS/JS served from `public/`
- Serverless functions handle `/api/*` routes
- Functions read certificates from bundled files
- Path resolution works in both ESM and bundled CJS contexts

## Challenges I Solved

While building this, I ran into several issues and here's how I fixed them:

**Module System Conflicts**
- Problem: `SyntaxError: Cannot use import outside a module`
- Solution: Added `"type": "module"` to package.json

**Import Variations**
- Problem: node-forge imports differently in different contexts
- Solution: Standardized on default imports consistently

**Lambda Environment Variable Limits**
- Problem: AWS Lambda has a 4KB limit on environment variables, certificates are larger
- Solution: Bundle PEM files with functions using `included_files` in netlify.toml

**Path Resolution in Bundled Code**
- Problem: `import.meta.url` is undefined when code is bundled to CJS
- Solution: Implemented a fallback that checks for `__dirname` first, then falls back to `import.meta.url`

**Empty Static Directory**
- Problem: Netlify needs files in the publish directory
- Solution: Created `public/index.html` with the web interface

## Recent Updates

- ✨ Modern UI with gradient design and smooth animations
- 📋 Copy-to-clipboard functionality for all text fields
- ⚡ Loading states and visual feedback during operations
- 🎨 Responsive design that works great on mobile
- 🔔 Better error handling with user-friendly messages
- 🔐 Custom favicon with encryption theme

## Future Ideas

Some things I'm thinking about adding:
- Hybrid encryption scheme (RSA for key exchange + AES-GCM for payloads) for better performance
- Key rotation with version IDs
- Unit tests and CI/CD pipeline
- Proper secrets management integration
- Support for multiple encryption algorithms
- Certificate expiration monitoring

## Custom Domain

The project is now live at **https://encryption.yaqoobahmed.com/**

The domain is configured through Netlify's domain management, with automatic SSL certificate provisioning via Let's Encrypt.

## License

ISC

---

**Built by Yaqoob Ahmed** | Exploring cryptography, serverless architecture, and modern web development

For questions or suggestions, feel free to open an issue or reach out!
