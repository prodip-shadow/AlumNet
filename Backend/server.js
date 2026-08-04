require('dotenv').config();

const http = require('http');
const app = require('./src/app');
require('./src/config/db');

const PORT = process.env.PORT;

const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
