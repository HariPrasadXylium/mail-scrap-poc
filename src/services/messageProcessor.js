const Email = require('../models/Email')
const { extractBody, parseTemplate } = require('../utils/gmailHelpers')
const { saveAttachmentsFromParts } = require('../helpers/attachmentHelper')


async function processMessage({ gmail, msgObj, uploadDir, opts = {} }) {
    try{
        let msgId = msgObj.id

        let headers = msgObj.payload?.headers || []
        let headerMap = {}
        headers.forEach(h => { headerMap[h.name.toLowerCase()] = h.value })

        let from = headerMap['from'] || ''
        let subject = headerMap['subject'] || ''
        let date = headerMap['date'] ? new Date(headerMap['date']) : new Date()
        let snippet = msgObj.snippet || ''
        let body = extractBody(msgObj.payload)
        
        let attachments = await saveAttachmentsFromParts([msgObj.payload], gmail, msgId, uploadDir)

        let existing = await Email.findOne({ messageId: msgId })
        if (!existing) {
          let payload = {
            messageId: msgId,
            threadId: msgObj.threadId,
            from,
            to: headerMap['to'] ? headerMap['to'].split(',').map(s => s.trim()) : [],
            subject,
            snippet,
            date,
            body: body,
            attachments,
            rawHeaders: headerMap,
            parsedData: parseTemplate(body),
          }

          if (opts.savedFromThread) payload.savedFromThread = true
          if (opts.originMessageId) payload.originMessageId = opts.originMessageId

          const emailDoc = new Email(payload)
          try {
            await emailDoc.save()
            return { messageId: msgId, saved: true }
          } catch (err) {
            if (err && err.code === 11000) {
              return { messageId: msgId, saved: false, reason: 'already exists' }
            }
            throw err
          }
        }

        return { messageId: msgId, saved: false, reason: 'already exists' }
    } catch (err) {
        console.error(`Error processing message ${msgObj.id}:`, err.message || err)
        throw err
    }
}

module.exports = { processMessage }
