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
// Задача: добавить вывод версии в консоль
const API_VERSION = '1.0.0';
console.log(📦 Версия API: ${API_VERSION});
console.log(👨‍💻 Разработчик: Artem Stariy);
