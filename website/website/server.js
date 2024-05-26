import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import cors from 'cors';

// This is necessary to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

app.use(cors({ origin: 'http://localhost:5173' })); // Enable CORS for your React app

// Function to generate a random seed
const generateRandomSeed = () => {
  const seed = crypto.randomBytes(4).readUInt32LE(0);
  return seed;
};

app.get('/random-seed', (req, res) => {
  console.log('Received request for /random-seed');
  
  const seed = generateRandomSeed();
  console.log('Generated seed:', seed);
  res.json({ seed });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
