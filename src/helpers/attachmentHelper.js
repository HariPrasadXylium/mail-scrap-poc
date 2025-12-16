const fs = require('fs')
const path = require('path')

async function saveAttachmentsFromParts(parts, gmail, msgId, uploadDir) {
    let attachments = []

    async function walkParts(partsArr) {
        if (!partsArr) return
        for (const p of partsArr) {
            if (p.filename && p.filename.length > 0 && p.body && p.body.attachmentId) {
                const attachId = p.body.attachmentId
                const attachRes = await gmail.users.messages.attachments.get({
                userId: 'me', messageId: msgId, id: attachId
                })
                const data = attachRes.data?.data
                if (data) {
                const buff = Buffer.from(data.replace(/-/g, '+').replace(/_/g, '/'), 'base64')
                const filename = p.filename
                const savePath = path.join(uploadDir, `${msgId}_${filename}`)
                fs.writeFileSync(savePath, buff)
                attachments.push({
                    filename,
                    path: savePath,
                    mimeType: p.mimeType,
                    size: buff.length
                })
                }
            } else if (p.parts) {
                await walkParts(p.parts)
            }
        }
    }

    await walkParts(parts)
    return attachments
}

module.exports = { saveAttachmentsFromParts }
