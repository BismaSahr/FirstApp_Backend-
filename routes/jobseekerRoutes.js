const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
  const {
    fullName, email, password, phone, location,
    skills, experienceLevel, desiredJobTitles, education
  } = req.body;

  try {
    const checkQuery = 'SELECT * FROM user WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
      if (err) {
        console.error('Error checking email:', err);
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertUserQuery = `
          INSERT INTO user (email, password, user_type)
          VALUES (?, ?, 'jobseeker')
        `;
        db.query(insertUserQuery, [email, hashedPassword], (err, userResult) => {
          if (err) {
            console.error('Error inserting into user table:', err);
            return res.status(500).json({ message: 'Signup failed' });
          }

          const userId = userResult.insertId;

          const insertJobSeekerQuery = `
            INSERT INTO job_seekers
            (user_id, full_name, phone, location, skills, experience_level, desired_job_titles, education)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `;
          db.query(insertJobSeekerQuery, [
            userId, fullName, phone, location,
            skills, experienceLevel, desiredJobTitles, education
          ], (err, jobSeekerResult) => {
            if (err) {
              console.error('Error inserting into job_seekers table:', err);
              return res.status(500).json({ message: 'Signup failed at job_seeker' });
            }

            // ✅ Generate JWT Token for auto-login
            const token = jwt.sign(
              { userId, email, role: 'jobseeker' },
              process.env.JWT_SECRET || 'your_secret_key',
              { expiresIn: '1h' }
            );

            res.status(201).json({
              message: 'Signup successful and logged in',
              token,
              user: { userId, email, role: 'jobseeker' }
            });
          });
        });

      } catch (hashError) {
        console.error('Hashing error:', hashError);
        return res.status(500).json({ message: 'Signup failed', error: hashError.message });
      }
    });

  } catch (err) {
    console.error('Unexpected error:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
