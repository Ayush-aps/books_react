const mongoose = require('mongoose');

const highlightSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    bookId: {
        type: String,
        required: true,
        index: true
    },
    text: {
        type: String,
        required: true
    },
    page: {
        type: Number,
        required: true
    },
    color: {
        type: String,
        default: 'rgba(255, 248, 220, 0.6)' // Cream color with 60% opacity
    },
    position: {
        startOffset: {
            type: Number,
            required: true
        },
        endOffset: {
            type: Number,
            required: true
        },
        boundingRect: {
            top: Number,
            left: Number,
            width: Number,
            height: Number
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound index for efficient querying
highlightSchema.index({ userId: 1, bookId: 1 });

const Highlight = mongoose.model('Highlight', highlightSchema);

module.exports = Highlight;
