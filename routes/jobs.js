const express = require('express');
const router = express.Router();
const db = require('../db'); // Your database connection module

// Route to create a new job posting
router.post('/', (req, res) => {
     const {
        employer_id,
        category_id,
        location_id,
        title,
        description,
        requirements,
        salary_range,
        job_type,
        deadline,
      } = req.body;

  if (!category_id || !location_id || !title || !description || !requirements || !salary_range || !job_type || !deadline) {
    return res.status(400).json({ message: 'All Fields are required.' });
  }

  const query =
   `INSERT INTO jobs (
      employer_id, category_id, location_id, title, description, requirements,
      salary_range, job_type, deadline
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(query, [employer_id,
                           category_id,
                           location_id,
                           title,
                           description,
                           requirements,
                           salary_range,
                           job_type,
                           deadline], (err, results) => {
    if (err) {
      console.error('Error inserting job:', err);
      return res.status(500).json({ message: 'Failed to create job.' });
    }

    res.status(201).json({ id: results.insertId, title, description, salary_range });
  });
});

// Route to get all categories
router.get('/categories', (req, res) => {
    const query = 'SELECT * FROM job_categories';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching categories:', err);
        return res.status(500).json({ message: 'Failed to fetch categories.' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'categories not found.' });
      }
      res.json(results);
});
});

// Route to get all locations
router.get('/locations', (req, res) => {
    const query = 'SELECT * FROM job_locations';
    db.query(query, (err, results) => {
      if (err) {
        console.error('Error fetching location:', err);
        return res.status(500).json({ message: 'Failed to fetch location.' });
      }
      if (results.length === 0) {
        return res.status(404).json({ message: 'location not found.' });
      }
      res.json(results);
});
});



//search
router.get('/search', (req, res) => {

  const rawQuery = req.query.query || '';
  const searchTerm = rawQuery.toLowerCase();
  const searchQuery = `%${searchTerm}%`;

  const query = `
    SELECT
      jobs.*,
      job_categories.category_name,
      job_locations.city,
      job_locations.state,
      job_locations.country,
      employers.company_name,
      employers.website
    FROM jobs
    JOIN job_categories ON jobs.category_id = job_categories.category_id
    JOIN job_locations ON jobs.location_id = job_locations.location_id
    JOIN employers ON jobs.employer_id = employers.user_id
    WHERE jobs.title LIKE ?
       OR job_categories.category_name LIKE ?
       OR job_locations.city LIKE ?
       OR job_locations.country LIKE ?
       OR employers.company_name LIKE ?
  `;

  console.log('Search Query:', rawQuery);

  db.query(query, [searchQuery, searchQuery, searchQuery, searchQuery, searchQuery], (err, results) => {
    if (err) {
      console.error('Error searching jobs:', err);
      return res.status(500).json({ message: 'Failed to search jobs.' });
    }

    console.log('Search results count:', results.length);

    if (!results.length) {
      return res.status(200).json({ status: "Ok", data: [], message: "No jobs found." });
    }

    res.json({ status: "Ok", data: results });
  });
});



// route to get all jobs
router.get('/:employer_id', (req, res) => {
  const employer_id = req.params.employer_id;

  const query = `
    SELECT
      jobs.*,
      job_categories.category_name,
      job_locations.city,
      job_locations.state,
      job_locations.country
    FROM jobs
    JOIN job_categories ON jobs.category_id = job_categories.category_id
    JOIN job_locations ON jobs.location_id = job_locations.location_id
    WHERE jobs.employer_id = ?
  `;

  db.query(query, [employer_id], (err, results) => {
    if (err) {
      console.error('Error fetching jobs:', err);
      return res.status(500).json({ message: 'Failed to fetch jobs.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this employer.' });
    }

    res.json(results);
  });
});




//route to get Job by ID

router.get('/jobGet/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  const query = 'SELECT * FROM jobs WHERE job_id = ?';
  db.query(query, [jobId], (err, results) => {
    if (err) {
      console.error('Error fetching job:', err);
      return res.status(500).json({ message: 'Failed to fetch job.' });
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'No jobs found for this ID.' });
    } else {
      res.json(results[0]);
    }
  });
});


//get All Jobs
router.get('/', (req, res) => {
  const query = `
    SELECT
      jobs.*,
      job_categories.category_name,
      job_locations.city,
      job_locations.state,
      job_locations.country,
      employers.company_name,
      employers.website
    FROM jobs
    JOIN job_categories ON jobs.category_id = job_categories.category_id
    JOIN job_locations ON jobs.location_id = job_locations.location_id
    JOIN employers ON jobs.employer_id = employers.user_id
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching jobs:', err);
      return res.status(500).json({ message: 'Failed to fetch jobs.' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No jobs found.' });
    }

    res.json(results);
  });
});


//route to update job
router.put('/update/:jobId', (req, res) => {
  const jobId = req.params.jobId;

  const {
    employer_id,
    category_id,
    location_id,
    title,
    description,
    requirements,
    salary_range,
    job_type,
    deadline,
  } = req.body;

  if (
    !category_id ||
    !location_id ||
    !title ||
    !description ||
    !requirements ||
    !salary_range ||
    !job_type ||
    !deadline
  ) {
    return res.status(400).json({ message: 'All Fields are required.' });
  }

  const query =
    'UPDATE jobs SET employer_id = ?, category_id = ?, location_id = ?, title = ?, description = ?, requirements = ?, salary_range = ?, job_type = ?, deadline = ? WHERE job_id = ?';
  db.query(
    query,
    [
      employer_id,
      category_id,
      location_id,
      title,
      description,
      requirements,
      salary_range,
      job_type,
      deadline,
      jobId,
    ],
    (err, results) => {
      if (err) {
        console.error('Error updating job:', err);
        return res.status(500).json({ message: 'Failed to update job.' });
      }
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Job not found.' });
      }
      res.status(200).json({ message: 'Job updated successfully.' });
    }
  );
});



// Route to delete

router.delete('/delete/:jobId', (req, res) => {

  const jobId = req.params.jobId;
  const query = 'DELETE FROM jobs WHERE job_id = ?';
  db.query(query, [jobId], (err, results) => {
    if (err) {
      console.error('Error deleting job:', err);
      return res.status(500).json({ message: 'Failed to delete job.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ message: 'Job not found.' });
    }

        res.json({ message: 'Job deleted successfully.' });
  });
});



module.exports = router;
