const { fetchAndSaveEmails } = require('../services/mailService')
const path = require('path')
const fs = require('fs')

function mailController() {
    this.getMails = async (req, res) => {
        try{
            let subjectTemplate = req.query.subject
            if (!subjectTemplate) return res.status(400).send('Provide subject query param, e.g. ?subject=Invoice')

            let UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')
            if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

            try {
              let results = await fetchAndSaveEmails(subjectTemplate, UPLOAD_DIR)
              return res.json({ ok: true, results })
            } catch (err) {
              console.error('Error fetching emails', err.message || err)
              if (err.message && err.message.includes('No tokens found')) {
                return res.status(401).send('Auth required. Visit /auth to re-authorize.')
              }
              return res.status(500).send('Failed to fetch/process emails')
            }
        }catch(err){
            console.error('Error in getMails controller:', err.message || err)
            return res.status(500).send('Internal server error')
        }
    }

    this.getThreads = async(req, res) => {
        try {
            const messageId = req.params?.messageId
            if (!messageId) return res.status(400).send('Missing messageId')

            const Email = require('../models/Email')
            const root = await Email.findOne({ messageId }).lean()
            if (!root) return res.status(404).send('Message not found')

            const threadId = root.threadId
            if (!threadId) return res.json({ threadId: null, messages: [] })

            const messages = await Email.find({ threadId }).sort({ date: 1 }).lean()
            const mapped = messages.map(m => ({ messageId: m.messageId, from: m.from, subject: m.subject, date: m.date, savedFromThread: m.savedFromThread || false, originMessageId: m.originMessageId || null }))
            return res.json({ threadId, messages: mapped })
        }catch (err) {
            console.error('Error in /fetch/threads/:messageId', err.message || err)
            return res.status(500).send('Internal server error')
        }
    }
}

module.exports = new mailController()