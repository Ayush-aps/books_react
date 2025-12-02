const express = require('express');
const router = express.Router();
const {
    getHighlights,
    createHighlight,
    deleteHighlight,
    deleteAllHighlights
} = require('../controllers/highlightController');
const { ensureAuthenticated } = require('../middleware/auth');

// Get all highlights for a book
router.get('/:bookId', ensureAuthenticated, getHighlights);

// Create a new highlight
router.post('/', ensureAuthenticated, createHighlight);

// Delete a specific highlight
router.delete('/:highlightId', ensureAuthenticated, deleteHighlight);

// Delete all highlights for a book
router.delete('/book/:bookId', ensureAuthenticated, deleteAllHighlights);

module.exports = router;
