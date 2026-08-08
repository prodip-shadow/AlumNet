
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');

// Import Routes
const authRoutes = require('./routes/auth.route');
const facultyRoutes = require('./routes/faculty.route')
const departmentRoutes = require('./routes/department.route');
const verificationRoutes = require('./routes/verification.route');
const profileRoutes = require('./routes/profile.route');
const skillRoutes = require('./routes/skill.route');
const projectRoutes = require('./routes/project.route');
const postRoutes = require('./routes/post.route');
const postLikeRoutes = require('./routes/postLike.route');
const commentRoutes = require('./routes/comment.route');
const replyRoutes = require('./routes/reply.route');
const commentLikeRoutes = require('./routes/commentLike.route');
const replyLikeRoutes = require('./routes/replyLike.route');
const alumniRoutes = require('./routes/alumni.route');
const connectionRoutes = require('./routes/connection.route');
const opportunityRoutes = require('./routes/opportunity.route');

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
app.use('/api/profile', profileRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', postLikeRoutes);
app.use('/api', commentRoutes);
app.use('/api', replyRoutes);
app.use('/api/comments', commentLikeRoutes);
app.use('/api/replies', replyLikeRoutes);
app.use('/api/alumni', alumniRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/opportunities', opportunityRoutes);

module.exports = app;
