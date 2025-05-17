const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });


router.post('/upload', upload.single('resume'), (req, res) => {
  const {
    job_id,
    jobseeker_id,
    employer_id,
    full_name,
    email,
    phone,
    cover_letter
  } = req.body;

  const protocol = req.protocol;
  const host = req.get('host'); // includes hostname and port
  const resume_link = req.file ? `${protocol}://${host}/uploads/${req.file.filename}` : null;


  // Step 1: Check for existing application
  const checkQuery = `
    SELECT * FROM job_applications
    WHERE job_id = ? AND jobseeker_id = ?
  `;

  db.query(checkQuery, [job_id, jobseeker_id], (checkErr, checkResult) => {
    if (checkErr) {
      console.error('Error checking application:', checkErr);
      return res.status(500).json({ error: 'Database check error' });
    }

    if (checkResult.length > 0) {
      // Application already exists
      return res.status(409).json({ error: 'You have already applied for this job.' });
    }

    // Step 2: Insert application if no duplicate
    const insertQuery = `
      INSERT INTO job_applications
      (job_id, jobseeker_id, employer_id, full_name, email, phone, cover_letter, resume_link)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(
      insertQuery,
      [job_id, jobseeker_id, employer_id, full_name, email, phone, cover_letter, resume_link],
      (insertErr, result) => {
        if (insertErr) {
          console.error('Error inserting application:', insertErr);
          return res.status(500).json({ error: 'Database insert error' });
        }

        res.status(201).json({ message: 'Application submitted successfully' });
      }
    );
  });
});


// Route to get job applications received by an employer
router.get('/employer/:employer_id', (req, res) => {
  const { employer_id } = req.params;

  const query = `
SELECT
 ja.application_id AS id, ja.cover_letter, ja.resume_link, ja.application_date, jobs.job_id,
 jobs.title, jobs.description, jobs.requirements, jobs.salary_range, jobs.job_type, jobs.posted_at,
 jobs.deadline, js.user_id AS jobseeker_id, js.full_name, js.phone, js.location AS jobseeker_location,
 js.skills, js.experience_level, js.desired_job_titles, js.education, u.email AS email
  FROM jobs
 JOIN job_applications AS ja ON jobs.job_id = ja.job_id
 JOIN job_seekers AS js ON ja.jobseeker_id = js.user_id 
JOIN user AS u ON ja.jobseeker_id = u.user_id 
WHERE jobs.employer_id = ?
  `;

  db.query(query, [employer_id], (err, results) => {
    if (err) {
      console.error('Error fetching applications:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});




router.get('/jobseeker/:jobseeker_id', (req, res) => {
  const { jobseeker_id } = req.params;

  const query = `
    SELECT
      ja.application_id AS id,
      ja.full_name,
      ja.email,
      ja.phone,
      ja.cover_letter,
      ja.resume_link,
      ja.application_date,
      jobs.title,
      job_categories.category_name,
      job_locations.city,
      job_locations.state,
      job_locations.country,
      employers.company_name,
      employers.website
    FROM job_applications AS ja
    JOIN jobs ON ja.job_id = jobs.job_id
    JOIN job_categories ON jobs.category_id = job_categories.category_id
    JOIN job_locations ON jobs.location_id = job_locations.location_id
    JOIN employers ON jobs.employer_id = employers.user_id
    WHERE ja.jobseeker_id = ?
  `;

  db.query(query, [jobseeker_id], (err, results) => {
    if (err) {
      console.error('Error fetching applications:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(200).json(results);
  });
});



//Update
router.put('/update/:applicationId', upload.single('resume'), (req, res) => {
  const applicationId = req.params.applicationId;
  const { full_name, email, phone, cover_letter } = req.body;

  // If a resume file was uploaded, get its link
  const resumeLink = req.file
    ? `http://192.168.0.104:3000/uploads/${req.file.filename}`
    : null;

  if (!full_name || !email || !phone) {
    return res.status(400).json({ message: 'Full Name, Email, and Phone are required.' });
  }

  const updateQuery = `
    UPDATE job_applications
    SET full_name = ?, email = ?, phone = ?, cover_letter = ?, resume_link = COALESCE(?, resume_link)
    WHERE application_id = ?
  `;

  db.query(
    updateQuery,
    [full_name, email, phone, cover_letter, resumeLink, applicationId],
    (err, result) => {
      if (err) {
        console.error('Error updating application:', err);
        return res.status(500).json({ message: 'Failed to update application.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Application not found.' });
      }

      res.status(200).json({ message: 'Application updated successfully.' });
    }
  );
});





//delete
router.delete('/:application_id', (req, res) => {
  const { application_id } = req.params;

  const deleteQuery = `DELETE FROM job_applications WHERE application_id = ?`;

  db.query(deleteQuery, [application_id], (err, result) => {
    if (err) {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete application' });
    }
    res.status(200).json({ message: 'Application deleted successfully' });
  });
});




module.exports = router;
