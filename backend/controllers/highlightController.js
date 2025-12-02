const Highlight = require('../models/Highlight');

// Get all highlights for a specific book and user
exports.getHighlights = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const highlights = await Highlight.find({ userId, bookId })
            .sort({ page: 1, createdAt: 1 });

        res.status(200).json({
            success: true,
            count: highlights.length,
            data: highlights
        });
    } catch (error) {
        console.error('Error fetching highlights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch highlights',
            error: error.message
        });
    }
};

// Create a new highlight
exports.createHighlight = async (req, res) => {
    try {
        const userId = req.user._id;
        const { bookId, text, page, color, position } = req.body;

        // Validate required fields
        if (!bookId || !text || !page || !position) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: bookId, text, page, and position are required'
            });
        }

        // Validate position data
        if (typeof position.startOffset !== 'number' || typeof position.endOffset !== 'number') {
            return res.status(400).json({
                success: false,
                message: 'Position must include startOffset and endOffset as numbers'
            });
        }

        const highlight = await Highlight.create({
            userId,
            bookId,
            text,
            page,
            color: color || 'rgba(255, 248, 220, 0.6)',
            position
        });

        res.status(201).json({
            success: true,
            data: highlight
        });
    } catch (error) {
        console.error('Error creating highlight:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create highlight',
            error: error.message
        });
    }
};

// Delete a specific highlight
exports.deleteHighlight = async (req, res) => {
    try {
        const { highlightId } = req.params;
        const userId = req.user._id;

        const highlight = await Highlight.findOne({ _id: highlightId, userId });

        if (!highlight) {
            return res.status(404).json({
                success: false,
                message: 'Highlight not found or you do not have permission to delete it'
            });
        }

        await Highlight.deleteOne({ _id: highlightId });

        res.status(200).json({
            success: true,
            message: 'Highlight deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting highlight:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete highlight',
            error: error.message
        });
    }
};

// Delete all highlights for a specific book
exports.deleteAllHighlights = async (req, res) => {
    try {
        const { bookId } = req.params;
        const userId = req.user._id;

        const result = await Highlight.deleteMany({ userId, bookId });

        res.status(200).json({
            success: true,
            message: `Deleted ${result.deletedCount} highlight(s)`,
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error deleting highlights:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete highlights',
            error: error.message
        });
    }
};
