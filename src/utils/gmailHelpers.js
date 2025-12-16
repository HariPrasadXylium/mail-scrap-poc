function extractBody(payload) {
    let body = ''

    function walk(part) {
        if (!part) return

        if (part.mimeType === 'text/html' && part.body?.data) {
          const data = part.body.data.replace(/-/g, '+').replace(/_/g, '/')
          body = Buffer.from(data, 'base64').toString('utf-8')
        }

        if (part.mimeType === 'text/plain' && !body && part.body?.data) {
          const data = part.body.data.replace(/-/g, '+').replace(/_/g, '/')
          body = Buffer.from(data, 'base64').toString('utf-8')
        }

        if (part.parts) part.parts.forEach(walk)
    }

    walk(payload)
    return body
}

function parseTemplate(body) {
    let txn = body.match(/Transaction ID:\s*(\w+)/i)?.[1] || null;
    let amount = body.match(/Amount:\s*₹?\s*([\d,]+)/i)?.[1] || null;
    let date = body.match(/Date:\s*([\d-]+)/i)?.[1] || null;

    return {
      transactionId: txn,
      amount,
      date
    }
}

module.exports = { extractBody, parseTemplate }
