const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import Routes
const authRoutes = require('./routes/auth.route');

const app = express();
app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('AlumNet API Running...');
});

// Routes
app.use('/api/auth', authRoutes);

module.exports = app;
