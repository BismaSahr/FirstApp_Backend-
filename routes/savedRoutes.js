const express = require('express');
const router = express.Router();
const db = require('../db');



router.post('/', (req, res) => {
const { job_id, jobseeker_id } = req.body;

if (!job_id || !jobseeker_id) {
return res.status(400).json({ error: 'job_id and jobseeker_id are required' });
}

// Check if already saved
const checkQuery = 'SELECT * FROM saved_jobs WHERE job_id = ? AND jobseeker_id = ?';
db.query(checkQuery, [job_id, jobseeker_id], (checkErr, checkResults) => {
if (checkErr) {
console.error('Error checking saved job:', checkErr);
return res.status(500).json({ error: 'Server error while checking' });
}

if (checkResults.length > 0) {
  return res.status(409).json({ message: 'Job already saved' });
}

// Insert new saved job
const insertQuery = 'INSERT INTO saved_jobs (job_id, jobseeker_id) VALUES (?, ?)';
db.query(insertQuery, [job_id, jobseeker_id], (insertErr, insertResults) => {
  if (insertErr) {
    console.error('Error saving job:', insertErr);
    return res.status(500).json({ error: 'Server error while saving' });
  }

  res.status(201).json({ message: 'Job saved successfully' });
});
});
});

// In your backend (likely in the same file you provided)
router.get('/:jobseekerId', (req, res) => {
  const { jobseekerId } = req.params;

  const query = `
    SELECT
      jobs.job_id,
      jobs.title,
      jobs.description,
      jobs.requirements,
      jobs.salary_range,
      jobs.job_type,
      jobs.deadline,
      saved_jobs.jobseeker_id,
      job_categories.category_name,
      job_locations.city,
      job_locations.state,
      job_locations.country,
      employers.company_name,
      employers.website
    FROM saved_jobs
    JOIN jobs ON saved_jobs.job_id = jobs.job_id
    JOIN job_categories ON jobs.category_id = job_categories.category_id
    JOIN job_locations ON jobs.location_id = job_locations.location_id
    JOIN employers ON jobs.employer_id = employers.user_id
    WHERE saved_jobs.jobseeker_id = ?
  `;

  db.query(query, [jobseekerId], (err, results) => {
    if (err) {
      console.error('Error fetching saved jobs with full details:', err);
      return res.status(500).json({ error: 'Server error' });
    }
    res.json(results);
  });
});


router.delete('/delete/:jobId', (req, res) => {

   const { jobId } = req.params;

   const query = 'DELETE FROM saved_jobs WHERE job_id = ?';

    db.query(query, [jobId], (err, result) => {
      if (err) {
        console.error('Error deleting saved job:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Job not found' });
      }

      res.json({ message: 'Job remove successfully' });
    });

});

module.exports = router;
