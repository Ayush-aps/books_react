const express = require('express');
const router = express.Router();
const { getHighlights, createHighlight, deleteHighlight, deleteAllHighlights } = require('../controllers/highlightController');
const { ensureAuthenticated } = require('../middleware/auth');

/**
 * @swagger
 * /api/highlights/{bookId}:
 *   get:
 *     tags: [Highlights]
 *     summary: Get all highlights for a book in the reader
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/BookIdParam'
 *     responses:
 *       200:
 *         description: Highlight list
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 count:   { type: integer }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:      { type: string }
 *                       bookId:   { type: string }
 *                       text:     { type: string }
 *                       page:     { type: integer }
 *                       color:    { type: string }
 *                       position:
 *                         type: object
 *                         properties:
 *                           startOffset: { type: integer }
 *                           endOffset:   { type: integer }
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/:bookId', ensureAuthenticated, getHighlights);

/**
 * @swagger
 * /api/highlights:
 *   post:
 *     tags: [Highlights]
 *     summary: Save a new text highlight
 *     security:
 *       - sessionCookie: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookId, text, page, position]
 *             properties:
 *               bookId: { type: string, description: Book ID to highlight in }
 *               text:   { type: string, description: Selected text content }
 *               page:   { type: integer, description: Page number of highlight }
 *               color:  { type: string, example: "rgba(255, 248, 220, 0.6)", description: Highlight colour }
 *               position:
 *                 type: object
 *                 required: [startOffset, endOffset]
 *                 properties:
 *                   startOffset: { type: integer, description: Character start offset }
 *                   endOffset:   { type: integer, description: Character end offset }
 *     responses:
 *       201:
 *         description: Highlight saved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: Missing required fields or invalid position
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.post('/', ensureAuthenticated, createHighlight);

/**
 * @swagger
 * /api/highlights/{highlightId}:
 *   delete:
 *     tags: [Highlights]
 *     summary: Delete a specific highlight by its ID
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - name: highlightId
 *         in: path
 *         required: true
 *         schema: { type: string }
 *         description: MongoDB ObjectId of the highlight
 *     responses:
 *       200:
 *         description: Highlight deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/:highlightId', ensureAuthenticated, deleteHighlight);

/**
 * @swagger
 * /api/highlights/book/{bookId}:
 *   delete:
 *     tags: [Highlights]
 *     summary: Delete all highlights for a specific book
 *     security:
 *       - sessionCookie: []
 *     parameters:
 *       - $ref: '#/components/parameters/BookIdParam'
 *     responses:
 *       200:
 *         description: All highlights deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/book/:bookId', ensureAuthenticated, deleteAllHighlights);

module.exports = router;
