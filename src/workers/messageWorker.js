const { Worker } = require('bullmq')
const { connection, MESSAGE_QUEUE, THREAD_QUEUE } = require('../queues/queueManager')
const { getAuthenticatedGmail } = require('../services/gmailService')
const { processMessage } = require('../services/messageProcessor')
const { threadQueue } = require('../queues/queueManager')
const path = require('path')

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, '..', '..', 'uploads')

const worker = new Worker(MESSAGE_QUEUE, async (job) => {
    let { messageId, savedFromThread, originMessageId } = job.data

    let gmail = await getAuthenticatedGmail()

    let msgRes = await gmail.users.messages.get({ userId: 'me', id: messageId, format: 'full' })
    let msg = msgRes.data

    let outcome = await processMessage({ gmail, msgObj: msg, uploadDir, opts: { savedFromThread, originMessageId } })

    if (!outcome.saved && msg.threadId) {
        await threadQueue.add('thread', { threadId: msg.threadId, originMessageId: messageId })
    }

    return outcome
}, { connection })

worker.on('completed', (job) => {
  console.log(`Message job ${job.id} completed`)
})
worker.on('failed', (job, err) => {
  console.error(`Message job ${job ? job.id : '<unknown>'} failed`, err && err.message ? err.message : err)
})

module.exports = worker
