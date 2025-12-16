const Email = require('../models/Email')
const path = require('path')
const { getAuthenticatedGmail } = require('./gmailService')
const { extractBody, parseTemplate } = require('../utils/gmailHelpers')
const { saveAttachmentsFromParts } = require('../helpers/attachmentHelper')

async function fetchAndSaveEmails(subjectTemplate, uploadDir) {
    try{
      let gmail = await getAuthenticatedGmail()

      let q = `subject:${subjectTemplate}`
      let listRes = await gmail.users.messages.list({ userId: 'me', q, maxResults: 10 })

      let messages = listRes.data.messages || []
      let results = []

      let processedIds = new Set()

      async function processAndSaveMessage(msgObj, opts = {}) {
        let msgId = msgObj.id
        if (processedIds.has(msgId)) return null
        processedIds.add(msgId)

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
      }

      for (const m of messages) {
        let msgId = m.id
        let msgRes = await gmail.users.messages.get({ userId: 'me', id: msgId, format: 'full' })
        let msg = msgRes.data

        let outcome = await processAndSaveMessage(msg)
        if (outcome && outcome.saved) {
          results.push(outcome)
          continue
        }

        let threadId = msg.threadId
        if (threadId) {
          try {
            let threadRes = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' })
            let thread = threadRes.data
            let newSaved = []
            let threadMsgs = thread.messages || []
            for (const tm of threadMsgs) {
              if (tm.id === msgId) continue
              let tmOutcome = await processAndSaveMessage(tm, { savedFromThread: true, originMessageId: msgId })
              if (tmOutcome && tmOutcome.saved) newSaved.push(tmOutcome.messageId)
            }

            if (newSaved.length > 0) {
              results.push({ messageId: msgId, saved: false, reason: 'threadProcessed', newSaved })
            } else {
              results.push({ messageId: msgId, saved: false, reason: 'already exists' })
            }
          } catch (err) {
            results.push({ messageId: msgId, saved: false, reason: 'already exists' })
          }
        } else {
          results.push({ messageId: msgId, saved: false, reason: 'already exists' })
        }
      }

      return results
    } catch (err) {
      console.error('Error in fetchAndSaveEmails:', err.message || err)
      throw err
    }
}

async function processAndSaveMessage(msgObj, opts = {}) {
    let msgId = msgObj.id
    if (processedIds.has(msgId)) return null
    processedIds.add(msgId)

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
}

module.exports = { fetchAndSaveEmails }
