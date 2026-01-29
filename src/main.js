const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'DevSec API running', version: '1.0' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
console.log(`
╔══════════════════════════════════════╗
║      🚀 DevSec API запущен!         ║
║      📅 ${new Date().toLocaleString()}  ║
║      🌐 Порт: ${PORT}                ║
╚══════════════════════════════════════╝
`);
