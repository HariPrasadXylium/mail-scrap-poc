const { Worker } = require('bullmq')
const { connection, THREAD_QUEUE } = require('../queues/queueManager')
const { getAuthenticatedGmail } = require('../services/gmailService')
const { messageQueue } = require('../queues/queueManager')

const worker = new Worker(THREAD_QUEUE, async (job) => {
    let { threadId, originMessageId } = job.data
    let gmail = await getAuthenticatedGmail()

    let threadRes = await gmail.users.threads.get({ userId: 'me', id: threadId, format: 'full' })
    let thread = threadRes.data
    let threadMsgs = thread.messages || []

    for (const tm of threadMsgs) {
      await messageQueue.add('message', { messageId: tm.id, savedFromThread: true, originMessageId })
    }

    return { threadId, enqueued: threadMsgs.length }
}, { connection })

worker.on('completed', (job) => console.log(`Thread job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`Thread job ${job ? job.id : '<unknown>'} failed`, err && err.message ? err.message : err))

module.exports = worker
