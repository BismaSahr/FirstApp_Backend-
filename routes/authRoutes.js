const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const bcrypt = require('bcrypt');
require('dotenv').config();

router.post('/signin', (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required.' });
  }

  // First check if email exists in the user table
  const userQuery = 'SELECT * FROM user WHERE email = ?';
  db.query(userQuery, [email], async (err, userResults) => {
    if (err) {
      console.error('Sign-in error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (userResults.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResults[0];

    // Check if role matches
    if (user.user_type !== role.toLowerCase()) {
      return res.status(401).json({ error: 'Role mismatch. Incorrect role selected.' });
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    // Now get additional info based on the role
    let detailsQuery = '';
    if (role.toLowerCase() === 'employer') {
      detailsQuery = 'SELECT * FROM employers WHERE user_id = ?';
    } else if (role.toLowerCase() === 'jobseeker') {
      detailsQuery = 'SELECT * FROM job_seekers WHERE user_id = ?';
    } else {
      return res.status(400).json({ error: 'Invalid role' });
    }

    db.query(detailsQuery, [user.user_id], (err, detailsResults) => {
      if (err) {
        console.error('Error fetching user details:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (detailsResults.length === 0) {
        return res.status(404).json({ error: 'User details not found' });
      }
                const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, {
                    expiresIn: process.env.JWT_EXPIRES_IN
                    });

        res.status(200).json({
         message: 'Sign-in successful',
         token,
         user: {
           ...user,
           details: detailsResults[0]
         }
       });
    });

  });
});


//logOut


router.post('/logout', (req, res) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(400).json({ message: 'No token provided' });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            // Token is invalid or expired, send a 401 Unauthorized response
            return res.status(401).json({ message: 'Invalid or expired token, logged out successfully' });
        }

        // Token is valid, send a success message
        return res.status(200).json({ message: 'Logged out successfully' });
    });
});




module.exports = router;
