const { Queue } = require('bullmq')

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
}

const MESSAGE_QUEUE = process.env.MESSAGE_QUEUE_NAME || 'messageQueue'
const THREAD_QUEUE = process.env.THREAD_QUEUE_NAME || 'threadQueue'


const messageQueue = new Queue(MESSAGE_QUEUE, { connection })
const threadQueue = new Queue(THREAD_QUEUE, { connection })

module.exports = { connection, messageQueue, threadQueue, MESSAGE_QUEUE, THREAD_QUEUE }
