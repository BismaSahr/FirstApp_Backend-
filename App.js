const express = require('express');
const app = express();
const path = require('path');


const jobseekerRoutes = require('./routes/jobseekerRoutes');
const employerRoutes = require('./routes/employerRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');
const jobsRouter = require('./routes/jobs');
const savedRoutes = require('./routes/savedRoutes');
const jobApplicationRoutes = require('./routes/jobApplicationRoutes');
const authenticateToken = require('./middleware/auth');


const port = 3000;

// Middleware to parse JSON and form-urlencoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
console.log('Serving uploads from:', path.join(__dirname, 'uploads'));

// API routes
app.use('/api/jobseekers', jobseekerRoutes);
app.use('/api/employers', employerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api',authenticateToken, profileRoutes);
app.use('/api/jobs',authenticateToken, jobsRouter);
app.use('/api/saved',authenticateToken, savedRoutes);
app.use('/api/job-applications',authenticateToken, jobApplicationRoutes);

// Start the server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server is running on http://192.168.0.101:${port}`);
});
