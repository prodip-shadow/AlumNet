const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import Routes
const authRoutes = require('./routes/auth.route');
const facultyRoutes = require('./routes/faculty.route')
const departmentRoutes = require('./routes/department.route');
const verificationRoutes = require('./routes/verification.route');



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
app.use('/api/faculties', facultyRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/verification', verificationRoutes);


module.exports = app;
