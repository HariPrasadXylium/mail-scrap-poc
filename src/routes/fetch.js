
const express = require('express')
const router = express.Router()
const mailController = require('../controllers/mailController')
const fs = require('fs')
const path = require('path')

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

router.get('/emails', async (req, res) => {
    try {
        return mailController.getMails(req, res)
    }catch (err) {
        console.error('Error in /fetch/emails route:', err.message || err)
        return res.status(500).send('Internal server error')
    }
})

router.get('/threads/:messageId', async (req, res) => {
    try {
        return mailController.getThreads(req, res)
    }catch (err) {
        console.error('Error in /fetch/threads/:messageId route:', err.message || err)
        return res.status(500).send('Internal server error')
    }
})

module.exports = router