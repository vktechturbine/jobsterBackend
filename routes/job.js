const express = require('express');

const router = express.Router();
const jobAuth = require('../controllers/jobs');
const isAuth = require('../middleware/isauth');


router.post('/createJob',isAuth,jobAuth.createJob);
router.get('/jobs',isAuth,jobAuth.getAllJob);
router.get('/stats',isAuth,jobAuth.getstats);
module.exports = router;


