const express = require('express');
const router = express.Router();
const db = require('../db');

// Get profile based on user role (handling GET request with query parameters and JOIN with user table)
router.get('/profile', (req, res) => {
  const { userId, role } = req.query;

  if (!userId || !role) {
    return res.status(400).json({ error: 'User ID and Role are required in the query parameters' });
  }

  let query = '';
  if (role.toLowerCase() === 'employer') {
    query = `
      SELECT e.company_name, e.website, e.industry, u.email, e.user_id
      FROM employers e
      JOIN user u ON e.user_id = u.user_id
      WHERE e.user_id = ?
    `;
  } else if (role.toLowerCase() === 'jobseeker') {
    query = `
      SELECT j.full_name, j.phone, j.location, j.skills, j.experience_level,
             j.desired_job_titles, j.education, u.email, j.user_id
      FROM job_seekers j
      JOIN user u ON j.user_id = u.user_id
      WHERE j.user_id = ?
    `;
  } else {
    return res.status(400).json({ error: 'Invalid role' });
  }

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Error fetching profile:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    res.status(200).json({ profile: results[0] });
  });
});

// Edit profile route (PUT request with data in the body)
router.put('/profile', (req, res) => {
  const { userId, role, email, ...updatedData } = req.body; // Expecting email in the request body

  if (!userId || !role || !updatedData || Object.keys(updatedData).length === 0) {
    return res.status(400).json({ error: 'User ID, role, and update data are required in the request body' });
  }

  db.beginTransaction(err => { // Start a transaction to ensure atomicity
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // 1. Update the user's email in the user table
    db.query(
      'UPDATE user SET email = ? WHERE user_id = ?',
      [email, userId],
      (err, userResults) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error updating user email:', err);
            return res.status(500).json({ error: 'Server error' });
          });
        }

        if (userResults.affectedRows === 0) {
          return db.rollback(() => {
            return res.status(404).json({ error: 'User not found' });
          });
        }

        let query = '';
        let params = [];
        if (role.toLowerCase() === 'employer') {
          const employerUpdateFields = ['company_name', 'website', 'industry'];
          const validEmployerUpdates = {};
          employerUpdateFields.forEach(field => {
            if (updatedData.hasOwnProperty(field) && field !== 'email') { // Exclude 'email'
              validEmployerUpdates[field] = updatedData[field];
            }
          });
          if (Object.keys(validEmployerUpdates).length > 0) {
            query = 'UPDATE employers SET ? WHERE user_id = ?';
            params = [validEmployerUpdates, userId];
          }
        } else if (role.toLowerCase() === 'jobseeker') {
          const jobseekerUpdateFields = ['full_name', 'phone', 'location', 'skills', 'experience_level', 'desired_job_titles', 'education'];
          const validJobseekerUpdates = {};
          jobseekerUpdateFields.forEach(field => {
            if (updatedData.hasOwnProperty(field) && field !== 'email') { // Exclude 'email'
              validJobseekerUpdates[field] = updatedData[field];
            }
          });
          if (Object.keys(validJobseekerUpdates).length > 0) {
            query = 'UPDATE job_seekers SET ? WHERE user_id = ?';
            params = [validJobseekerUpdates, userId];
          }
        } else {
          return db.rollback(() => {
            return res.status(400).json({ error: 'Invalid role' });
          });
        }

        // 2. Update the job_seekers or employers table if there are other fields to update
        if (query) {
          db.query(query, params, (err, profileResults) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error updating profile:', err);
                return res.status(500).json({ error: 'Server error' });
              });
            }

            db.commit(err => {
              if (err) {
                return db.rollback(() => {
                  console.error('Error committing transaction:', err);
                  return res.status(500).json({ error: 'Server error' });
                });
              }
              res.status(200).json({ message: 'Profile updated successfully' });
            });
          });
        } else {
          // If only the email was updated, commit the transaction
          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Error committing transaction:', err);
                return res.status(500).json({ error: 'Server error' });
              });
            }
            res.status(200).json({ message: 'Profile updated successfully' });
          });
        }
      }
    );
  });
});

// Delete account route (DELETE request with data in the body)
router.delete('/profile', (req, res) => {
  const { userId, role } = req.body;

  if (!userId || !role) {
    return res.status(400).json({ error: 'User ID and role are required in the request body' });
  }

  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting delete transaction:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    let profileQuery = '';
    if (role.toLowerCase() === 'employer') {
      profileQuery = 'DELETE FROM employers WHERE user_id = ?';
    } else if (role.toLowerCase() === 'jobseeker') {
      profileQuery = 'DELETE FROM job_seekers WHERE user_id = ?';
    } else {
      return db.rollback(() => {
        return res.status(400).json({ error: 'Invalid role' });
      });
    }

    db.query(profileQuery, [userId], (err, profileResults) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error deleting profile data:', err);
          return res.status(500).json({ error: 'Server error' });
        });
      }

      if (profileResults.affectedRows > 0) {
        const deleteUserQuery = 'DELETE FROM user WHERE user_id = ?';
        db.query(deleteUserQuery, [userId], (err, userResults) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error deleting user from user table:', err);
              return res.status(500).json({ error: 'Server error' });
            });
          }
          db.commit(err => {
            if (err) {
              console.error('Error committing delete transaction:', err);
              return res.status(500).json({ error: 'Server error' });
            }
            res.status(200).json({ message: 'Account deleted successfully' });
          });
        });
      } else {
        db.rollback(() => {
          res.status(404).json({ error: 'Profile not found' });
        });
      }
    });
  });
});

module.exports = router;