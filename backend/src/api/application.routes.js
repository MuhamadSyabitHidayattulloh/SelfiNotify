const express = require('express');
const ApplicationController = require('../controllers/application.controller');
const { verifyToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @route POST /api/applications
 * @desc Create new application
 * @access Private
 */
router.post('/', verifyToken, ApplicationController.create);

/**
 * @route GET /api/applications
 * @desc Get all applications
 * @access Private
 */
router.get('/', verifyToken, ApplicationController.getAll);

/**
 * @route GET /api/applications/:id
 * @desc Get application by ID
 * @access Private
 */
router.get('/:id', verifyToken, ApplicationController.getById);

/**
 * @route PUT /api/applications/:id
 * @desc Update application
 * @access Private
 */
router.put('/:id', verifyToken, ApplicationController.update);

/**
 * @route DELETE /api/applications/:id
 * @desc Delete application
 * @access Private
 */
router.delete('/:id', verifyToken, ApplicationController.delete);

/**
 * @route POST /api/applications/:id/regenerate-token
 * @desc Regenerate application token
 * @access Private
 */
router.post('/:id/regenerate-token', verifyToken, ApplicationController.regenerateToken);

module.exports = router;

