const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Configure multer for file storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../uploads/profile_images'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });


// Get profile based on user role
router.get('/profile', (req, res) => {
    const { userId, role } = req.query;

    if (!userId || !role) {
        return res.status(400).json({ error: 'User ID and Role are required in the query parameters' });
    }

    let query = '';
    if (role.toLowerCase() === 'employer') {
        query = `
            SELECT e.company_name, e.website, e.industry, u.email, e.user_id, 
                   e.profile_image
            FROM employers e
            JOIN user u ON e.user_id = u.user_id
            WHERE e.user_id = ?
        `;
    } else if (role.toLowerCase() === 'jobseeker') {
        query = `
            SELECT j.full_name, j.phone, j.location, j.skills, j.experience_level,
                   j.desired_job_titles, j.education, u.email, j.user_id, 
                   j.profile_image
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
// Edit profile route
router.put('/profile', (req, res) => {
    const { userId, role, email, ...updatedData } = req.body;

    if (!userId || !role || !updatedData || Object.keys(updatedData).length === 0) {
        return res.status(400).json({ error: 'User ID, role, and update data are required in the request body' });
    }

    db.beginTransaction(err => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: 'Server error' });
        }

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
                        if (updatedData.hasOwnProperty(field) && field !== 'email') {
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
                        if (updatedData.hasOwnProperty(field) && field !== 'email') {
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

// Route for updating the profile image
router.post('/profile/image', upload.single('profileImage'), (req, res) => {
    const { userId, role } = req.body;

    if (!userId || !role) {
        if (req.file) {
            const fs = require('fs');
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        return res.status(400).json({ error: 'User ID and role are required in the request body' });
    }

    if (!req.file) {
        return res.status(400).json({ error: 'No profile image file uploaded' });
    }
    const baseUrl = `${req.protocol}://${req.get('host')}`;  // Get server base URL

    const imagePath = `/uploads/profile_images/${req.file.filename}`;
    const fullImagePath = baseUrl + imagePath; // Store full URL

    let query = '';
    const params = [fullImagePath, userId];  // Use full URL

    if (role.toLowerCase() === 'employer') {
        query = 'UPDATE employers SET profile_image = ? WHERE user_id = ?';
    } else if (role.toLowerCase() === 'jobseeker') {
        query = 'UPDATE job_seekers SET profile_image = ? WHERE user_id = ?';
    } else {
        if (req.file) {
            const fs = require('fs');
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error deleting uploaded file:', err);
            });
        }
        return res.status(400).json({ error: 'Invalid role' });
    }

    db.query(query, params, (err, results) => {
        if (err) {
            console.error('Error updating profile image:', err);
            if (req.file) {
                const fs = require('fs');
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                });
            }
            return res.status(500).json({ error: 'Server error' });
        }

        if (results.affectedRows > 0) {
            res.status(200).json({ message: 'Profile image updated successfully', imagePath: fullImagePath }); // Return full URL
        } else {
            if (req.file) {
                const fs = require('fs');
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error deleting uploaded file:', err);
                });
            }
            return res.status(404).json({ error: 'User not found' });
        }
    });
});

// Delete account route
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
