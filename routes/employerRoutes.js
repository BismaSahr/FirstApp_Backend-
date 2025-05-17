const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

router.post('/signup', async (req, res) => {
  const {
    companyName,
    email,
    password,
    industry,
    website
  } = req.body;

  try {
    const checkQuery = 'SELECT * FROM user WHERE email = ?';
    db.query(checkQuery, [email], async (err, results) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      if (results.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const insertUserQuery = `
          INSERT INTO user (email, password, user_type)
          VALUES (?, ?, 'employer')
        `;
        db.query(insertUserQuery, [email, hashedPassword], (err, userResult) => {
          if (err) return res.status(500).json({ message: 'Signup failed' });

          const userId = userResult.insertId;

          const insertEmployerQuery = `
            INSERT INTO employers
            (user_id, company_name, industry, website)
            VALUES (?, ?, ?, ?)
          `;
          db.query(insertEmployerQuery, [userId, companyName, industry, website], (err, employerResult) => {
            if (err) return res.status(500).json({ message: 'Signup failed at employer' });


            const token = jwt.sign(
              { userId, email, role: 'employer' },
              process.env.JWT_SECRET || 'your_secret_key',
              { expiresIn: '1h' }
            );

            return res.status(201).json({
              message: 'Signup successful and logged in',
              token,
              user: { userId, email, role: 'employer' }
            });
          });
        });

      } catch (hashError) {
        return res.status(500).json({ message: 'Signup failed', error: hashError.message });
      }
    });

  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
