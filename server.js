const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data.json');

// Garantir que a pasta do banco de dados exista
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  try {
    fs.mkdirSync(dbDir, { recursive: true });
  } catch (err) {
    console.error('Erro ao criar pasta do banco:', err.message);
  }
}

// ── Persistência JSON ──────────────────────────────────────────────────────
function loadDB() {
  try {
    if (fs.existsSync(DB_PATH)) {
      return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    }
  } catch (e) {
    console.error('Erro ao carregar banco:', e.message);
  }
  return {
    freeText: '',
    files: []
  };
}

let saveTimer = null;
function scheduleDB() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
    } catch (e) {
      console.error('Erro ao salvar banco:', e.message);
    }
  }, 500); // debounce 500ms para não bater muito no disco
}

let db = loadDB();
console.log('📂 Banco carregado:', DB_PATH);

// ── HTTP Server ────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) { res.writeHead(404); res.end('Not found'); return; }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(data);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not found');
});

// ── WebSocket ──────────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server });
const clients = new Set();
let clientSeq = 0;

wss.on('connection', (ws, req) => {
  clientSeq++;
  ws._id = clientSeq;
  
  const ua = req.headers['user-agent'] || '';
  let deviceName = '💻 PC';
  if (ua.includes('iPhone')) deviceName = '📱 iPhone';
  else if (ua.includes('iPad')) deviceName = '📱 iPad';
  else if (ua.includes('Android')) deviceName = '📱 Android';
  else if (ua.includes('Windows')) deviceName = '💻 Windows';
  else if (ua.includes('Mac OS')) deviceName = '💻 Mac';
  else if (ua.includes('Linux')) deviceName = '💻 Linux';
  
  if (ua.includes('Chrome') && !ua.includes('Edg') && !ua.includes('OPR')) deviceName += ' (Chrome)';
  else if (ua.includes('Safari') && !ua.includes('Chrome') && !ua.includes('Android')) deviceName += ' (Safari)';
  else if (ua.includes('Firefox')) deviceName += ' (Firefox)';
  else if (ua.includes('Edg')) deviceName += ' (Edge)';
  else if (ua.includes('OPR')) deviceName += ' (Opera)';

  ws._deviceName = deviceName;
  clients.add(ws);
  console.log(`[+] Cliente #${ws._id} (${deviceName}) conectado  |  total: ${clients.size}`);

  // Estado completo para o recém-chegado
  safeSend(ws, { type: 'init', state: db, clientId: ws._id });
  broadcastClients();

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {

      case 'freeText':
        db.freeText = msg.value;
        scheduleDB();
        broadcast({ type: 'freeText', value: msg.value, from: ws._id }, ws);
        break;



      case 'clearText':
        db.freeText = '';
        scheduleDB();
        broadcast({ type: 'clearText' }, ws);
        break;

      case 'fileUpload': {
        // Tamanho máximo 10 MB por arquivo
        const maxSize = 10 * 1024 * 1024;
        const approxSize = msg.dataUrl ? Math.round(msg.dataUrl.length * 0.75) : 0;
        if (approxSize > maxSize) {
          safeSend(ws, { type: 'error', msg: 'Arquivo muito grande (máx 10 MB).' });
          break;
        }
        const file = {
          id: Date.now() + Math.random(),
          name: String(msg.name).slice(0, 200),
          fileType: String(msg.fileType || 'application/octet-stream'),
          size: msg.size || 0,
          dataUrl: msg.dataUrl,
          uploadedAt: new Date().toISOString(),
          uploadedBy: ws._id
        };
        db.files.push(file);
        if (db.files.length > 50) db.files = db.files.slice(-50);
        scheduleDB();
        // Não reenviar dataUrl para quem já tem — transmitir metadado + url
        broadcast({ type: 'fileAdded', file }, null);
        break;
      }

      case 'fileDelete':
        db.files = db.files.filter(f => f.id !== msg.id);
        scheduleDB();
        broadcast({ type: 'fileDeleted', id: msg.id }, null);
        break;
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[-] Cliente #${ws._id} saiu  |  total: ${clients.size}`);
    broadcastClients();
  });

  ws.on('error', (err) => {
    console.error(`Erro no cliente #${ws._id}:`, err.message);
    clients.delete(ws);
  });
});

function broadcast(msg, exclude) {
  const data = JSON.stringify(msg);
  for (const c of clients) {
    if (c !== exclude && c.readyState === WebSocket.OPEN) safeSend(c, null, data);
  }
}

function broadcastClients() {
  const list = Array.from(clients).map(c => ({ id: c._id, name: c._deviceName }));
  broadcast({ type: 'clients', list }, null);
}

function safeSend(ws, obj, raw) {
  try {
    if (ws.readyState === WebSocket.OPEN)
      ws.send(raw ?? JSON.stringify(obj));
  } catch {}
}

// ── Graceful shutdown ──────────────────────────────────────────────────────
function shutdown() {
  clearTimeout(saveTimer);
  try { fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8'); } catch {}
  console.log('\n💾 Dados salvos. Encerrando...');
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// ── Start ──────────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`✅ SyncDoc rodando em http://localhost:${PORT}`);
});
