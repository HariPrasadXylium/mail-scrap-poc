const { messageQueue } = require('../queues/queueManager')
const { getAuthenticatedGmail } = require('../services/gmailService')

const INTERVAL_MS = process.env.CRON_INTERVAL_MS ? parseInt(process.env.CRON_INTERVAL_MS, 10) : 1000 * 60 * 5 // default 5 min

async function runCronOnce() {
    try{
        let subjectsEnv = process.env.CRON_SUBJECTS || ''
        let subjects = subjectsEnv.split(',').map(s => s.trim()).filter(Boolean)
        if (subjects.length === 0) return

        let gmail = await getAuthenticatedGmail()

        for (const subject of subjects) {
            try {
                let q = `subject:${subject}`
                let listRes = await gmail.users.messages.list({ userId: 'me', q, maxResults: 100 })
                let messages = listRes.data.messages || []
                for (const m of messages) {
                    await messageQueue.add('message', { messageId: m.id })
                }
            } catch (err) {
                console.error(`Cron fetch failed for subject ${subject}:`, err && err.message ? err.message : err)
            }
        }

    }catch (err) {
        console.error('Error in runCronOnce:', err.message || err)  
    }
}

let timer = null

function startCron() {
    if (timer) return
    timer = setInterval(() => {
        runCronOnce().catch(err => console.error('Cron error', err))
    }, INTERVAL_MS)
    runCronOnce().catch(err => console.error('Cron initial run error', err))
}

module.exports = { startCron, runCronOnce }
