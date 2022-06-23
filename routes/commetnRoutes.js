const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authenticate');
const commentController = require('../controllers/commentController');

router.post('/', authenticate, commentController.createComment);
router.delete('/:id', authenticate, commentController.deleteComment);

module.exports = router;