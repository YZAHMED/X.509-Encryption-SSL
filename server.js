import https from 'https';
import express from 'express';
import fs from 'fs';
import nodeForge from 'node-forge';

// 1. Load Keys and Certificates

const privateKey = fs.readFileSync('server-key.pem', 'utf-8');
const certificate = fs.readFileSync("server-cert.pem","utf-8");
const ca = fs.readFileSync("ca-cert.pem","utf-8"); //our server CA


const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
};

// 2. Create an Express Application

const app = express();
app.use(express.json()); // middlewarre to parse JSON bodies

// 2. Load Server's Public/Private Keys for Encryption Logic

const serverPublicKey = nodeForge.pki.certificateFromPem(certificate).publicKey;
const serverPrivateKey = nodeForge.pki.privateKeyFromPem(privateKey);

// 3. Define Routes

app.get("/",( req, res)=> {
    res.send("<h1>Hello, Secure World!</h1><p>Your connection is encrypted.</p>");

});

app.post("/encrypt", (req, res) => {
    const { data } = req.body;
    if (!data){
        return res.status(400).json({
            error: "Please provide data in the JSON body."
        });
    }

    // Encrypt data using server's public key
    const encrypted = serverPublicKey.encrypt(data, 'RSA-OAEP');
    const encryptedBase64 = nodeForge.util.encode64(encrypted);

    console.log("\nOriginal Data:", data);
    console.log("Encrypted Data (Base64):", encryptedBase64);

    res.json(
        {
            originalData: data,
            encryptedData: encryptedBase64,
            note: "This data was encrypted with the server's public key."
        }
    );

}); 

// decrypt endpoint for testing decryption
app.post("/decrypt", ( req, res )=>{
    const {  encryptedData } = req.body;
    if (!encryptedData){
        return res.status(400).json(
            {
                error: "Please provide encryptedData in the JSON body."
            }
        )
    }

    // decrypt the data using the server's private key
    const encryptedBytes = nodeForge.util.decode64(encryptedData);
    const decrypted = serverPrivateKey.decrypt(encryptedBytes, 'RSA-OAEP');

    console.log("\nEncrypted Data (Base64):", encryptedData);
    console.log("Decrypted Data:", decrypted);

    res.json({
        encryptedData: encryptedData,
        decryptedData: decrypted,
        note: "This data was successfully decrypted with the server's private key."
    })

});

// 4. Create HTTPS Server
const httpsServer = https.createServer(credentials, app);
const PORT = 8443;

httpsServer.listen(PORT, () =>{
    console.log(`HTTPS Server running on https://localhost:${PORT}`);
})

