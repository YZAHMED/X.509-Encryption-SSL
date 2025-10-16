import nodeForge from 'node-forge';
import fs from 'fs';

// Start of the application
console.log('Generating self-signed certificates...');

// 1. Root CA Key Pair Generation
const caKeys = nodeForge.pki.rsa.generateKeyPair(2048);
//console.log(caKeys);

// 2. Self-Signed Certificate for Root CA.

const caCert = nodeForge.pki.createCertificate();
//cconsole.log(caCert);

caCert.publicKey = caKeys.publicKey;
caCert.serialNumber = '01';
caCert.validity.notBefore = new Date();
caCert.validity.notAfter = new Date();
caCert.validity.notAfter.setFullYear(
    caCert.validity.notBefore.getFullYear() + 10
);

const caAttrs = [
  { name: 'commonName', value: 'Yaqoob\'s Awesome CA' },
  { name: 'countryName', value: 'CA' },
  { name: 'stateOrProvinceName', value: 'Ontario' },
  { name: 'localityName', value: 'Toronto' },
  { name: 'organizationName', value: 'CryptoYaqoob Inc.' }
];

caCert.setSubject(caAttrs);
caCert.setIssuer(caAttrs);
caCert.setExtensions([
    {
        name: 'basicConstraints',
        cA: true    }
]);

// Self-sign the CA certificate
caCert.sign(caKeys.privateKey, nodeForge.md.sha256.create());
console.log('CA Certificate generated.');


// 3. Server Key Pair Generation
const serverKeys = nodeForge.pki.rsa.generateKeyPair(2048);

// 4. Create a Certificate for our Server, Signed by our CA ---

const serverCert = nodeForge.pki.createCertificate();
serverCert.publicKey = serverKeys.publicKey;
serverCert.serialNumber = '02';
serverCert.validity.notAfter = new Date();
serverCert.validity.notBefore = new Date();
serverCert.validity.notAfter.setFullYear(
    serverCert.validity.notBefore.getFullYear() + 1
);

const serverAttrs = [
  { name: 'commonName', value: 'localhost' }
];

serverCert.setSubject(serverAttrs);
serverCert.setIssuer(caCert.subject); // The issuer is our CA

// Sign the server certificate with the CA's private key
console.log('Signing server certificate with CA private key...');
serverCert.sign(caKeys.privateKey, nodeForge.md.sha256.create());

//5. Save all keys and certificates to PEM files

fs.writeFileSync('ca-key.pem', nodeForge.pki.privateKeyToPem(caKeys.privateKey));
fs.writeFileSync('ca-cert.pem', nodeForge.pki.certificateToPem(caCert));
fs.writeFileSync('server-key.pem', nodeForge.pki.privateKeyToPem(serverKeys.privateKey));
fs.writeFileSync('server-cert.pem', nodeForge.pki.certificateToPem(serverCert));

console.log('All files generated successfully!');


