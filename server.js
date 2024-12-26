const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3000;

const variantsFile = path.join(__dirname, 'variants.json');
const statsFile = path.join(__dirname, 'stats.json');

function readJSON(filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading JSON file:", error);
    return {}; // Return empty object if error
  }
}

function writeJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error("Error writing JSON file:", error);
  }
}


app.get('/page', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/variants', (req, res) => {
  const variants = readJSON(variantsFile);
  res.json(variants);
});

app.post('/stat', (req, res) => {
  const stats = readJSON(statsFile);
  res.json(stats);
});

app.post('/vote', express.json(), (req, res) => {
  const vote = req.body.vote;
  if (!vote) {
    return res.status(400).json({ error: "No vote selected" });
  }

  const stats = readJSON(statsFile);
  stats[vote] = (stats[vote] || 0) + 1;
  writeJSON(statsFile, stats);
  res.json(stats);
});

app.delete('/vote', (req, res) => {
  const stats = readJSON(statsFile);
  const lastVote = Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b);
  if (lastVote) {
      stats[lastVote] -= 1;
      if (stats[lastVote] < 0) stats[lastVote] = 0;
  }
  writeJSON(statsFile, stats);
  res.json(stats);
});



app.get('/results', (req, res) => {
  const stats = readJSON(statsFile);
  const acceptHeader = req.headers.accept;

  if (acceptHeader.includes('application/json')) {
    res.json(stats);
  } else if (acceptHeader.includes('text/html')) {
    let html = '<html><body><table>';
    for (const variant in stats) {
      html += `<tr><td>${variant}</td><td>${stats[variant]}</td></tr>`;
    }
    html += '</table></body></html>';
    res.send(html);
  } else if (acceptHeader.includes('application/xml')) {
    let xml = '<results>';
    for (const variant in stats) {
      xml += `<variant name="${variant}">${stats[variant]}</variant>`;
    }
    xml += '</results>';
    res.type('xml').send(xml);
  } 
});


app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
