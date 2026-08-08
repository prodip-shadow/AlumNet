const express = require('express');
const router = express.Router();

const alumniController = require('../controllers/alumni.controller');
const { verifyToken } = require('../middlewares/auth.middleware');

// List Alumni Directory (search, sort, page)
router.get('/', verifyToken, alumniController.getAlumniDirectory);

// Public Alumni Profile (with connection contact info privacy check)
router.get('/:userId', verifyToken, alumniController.getAlumniProfileById);

module.exports = router;
