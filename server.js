const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  // Strip query string and decode URL to handle spaces/special characters
  const cleanUrl = req.url.split('?')[0];
  const decodedUrl = decodeURIComponent(cleanUrl);
  let filePath = path.join(__dirname, decodedUrl);
  
  // Check if target is directory or root
  if (decodedUrl === '/' || decodedUrl === '') {
    filePath = path.join(__dirname, 'index.html');
  } else {
    try {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        if (fs.existsSync(path.join(filePath, 'index.html'))) {
          filePath = path.join(filePath, 'index.html');
        } else if (fs.existsSync(path.join(filePath, 'dashboard.html'))) {
          filePath = path.join(filePath, 'dashboard.html');
        } else if (fs.existsSync(path.join(filePath, 'login.html'))) {
          filePath = path.join(filePath, 'login.html');
        }
      }
    } catch (e) {}
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code);
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
}).listen(PORT);

console.log(`\n==================================================`);
console.log(`IDB Global Federal Credit Union Server is running!`);
console.log(`Open your browser and navigate to:`);
console.log(`http://localhost:${PORT}/`);
console.log(`==================================================\n`);
