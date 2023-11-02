import express from 'express';
import fetch from 'node-fetch';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json()); // This middleware is required to parse JSON bodies

// Send 'index.html' for the root route '/'
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Proxy endpoint for OpenAI calls
app.post('/api/callOpenAI', async (req, res) => {
  const api_key = process.env.OPENAI_API_KEY; // Your API key from the environment variable
  const data = req.body;

  try {
    const apiRes = await fetch('https://api.openai.com/v1/engines/text-davinci-002/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    const apiResJson = await apiRes.json();
    res.json(apiResJson);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error calling OpenAI API' });
  }
});

// Proxy endpoint for DALL·E calls
// app.post('/api/callDalleAPI', async (req, res) => {
//   const api_key = process.env.OPENAI_API_KEY; // Your API key from the environment variable
//   const data = req.body;

//   try {
//     const apiRes = await fetch('https://api.openai.com/v1/images/generations', {
//       method: 'POST',
//       headers: {
//         'Authorization': `Bearer ${api_key}`,
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify(data)
//     });
//     const apiResJson = await apiRes.json();
//     res.json(apiResJson);
//   } catch (error) {
//     console.error('Error:', error);
//     res.status(500).json({ error: 'Error calling DALL·E API' });
//   }
// });

app.post('/api/callDalleAPI', async (req, res) => {
  const api_key = process.env.OPENAI_API_KEY;
  const data = req.body;

  try {
    const apiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${api_key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });
    const apiResJson = await apiRes.json();
    res.json(apiResJson); // This should be the JSON response sent to the client.
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error calling DALL·E API' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  // Visit http://localhost:3000/ in your browser to see the index.html page
});
