// server.js

const express = require('express');
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');
const path = require('path');
const app = express();
const dotenv = require('dotenv');
const crypto = require('crypto');
dotenv.config();

// option 2
// const storage = new Storage({
//   projectId: process.env.GCP_project_id,
//   credentials: {
//     type: process.env.GCP_type,
//     project_id: process.env.GCP_project_id,
//     private_key_id: process.env.GCP_private_key_id,
//     private_key: process.env.GCP_private_key,
//     client_email: process.env.GCP_client_email,
//     client_id: process.env.GCP_client_id,
//     auth_uri: process.env.GCP_auth_uri,
//     token_uri: process.env.GCP_token_uri,
//     auth_provider_x509_cert_url: process.env.GCP_auth_provider_x509_cert_url,
//     client_x509_cert_url: process.env.GCP_client_x509_cert_url,
//     universe_domain: process.env.GCP_universe_domain
//     }
// });

function decryptText(encryptedText, key) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

const key = process.env.ENCRYPTION_KEY;

const encryptedText = process.env.ENCRYPTED_GCP_DATA;
const decryptedText = decryptText(encryptedText, key);

// convert string to json
const jsonData = JSON.parse(decryptedText);

const storage = new Storage({
  projectId: process.env.GCP_project_id,
  credentials: jsonData
});
// console.log(process.env.ENCRYPTED_GCP_DATA)
// Other possible option:
// const storage = new Storage({
//   keyFilename: 'path_to_your_service_account_key.json'
// }); 
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME;
const bucket = storage.bucket(bucketName);

const upload = multer({ dest: './uploads' });

//TODO: add the Access-Control-Allow-Origin header in the response, specifying the origin(s) allowed to access the resource
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  next();
})

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({error: 'No file uploaded.'});
  }

  const imagePath = path.join(__dirname, req.file.path);
  const imageFile = bucket.file(req.file.originalname);

  await bucket.upload(imagePath, {
    destination: req.file.originalname,
  });

  res.status(200).send({message: 'File uploaded to Google Cloud Storage.'});
});

app.get('/', (req, res) => {
  res.status(200).send('status ok.');
});

app.listen(3001, () => {
  console.log('Server is running on port 3001');
});