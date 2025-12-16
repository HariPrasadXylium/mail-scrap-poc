const mongoose = require('mongoose');

const AttachmentSchema = new mongoose.Schema({
    filename: String,
    path: String,
    mimeType: String,
    size: Number
}, { _id: false })

const EmailSchema = new mongoose.Schema({
    messageId: { type: String, unique: true, index: true },
    threadId: String,
    savedFromThread: { type: Boolean, default: false },
    originMessageId: { type: String, index: true, sparse: true },
    from: String,
    to: [String],
    subject: String,
    snippet: String,
    date: Date,
    body: String,
    attachments: [AttachmentSchema],
    rawHeaders: mongoose.Schema.Types.Mixed,
    parsedData: {
        transactionId: String,
        amount: String,
        date: String
    }
}, { timestamps: true })

module.exports = mongoose.model('Email', EmailSchema)
