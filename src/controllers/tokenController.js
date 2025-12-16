const { loadTokens, deleteTokens } = require('../services/tokenService')

function tokenController() {

    this.getStatus = async (req, res) => {
        try {
            let tokens = await loadTokens()
            if (!tokens) return res.json({ present: false })

            return res.json({ present: true, expiry_date: new Date(tokens.expiry_date).toLocaleString() || null })
        }catch (err) {
            console.error('Error reading token status', err.message || err)
            return res.status(500).send('Failed to read token status')
        }
    }

    this.delete = async (req, res) => {
        try {
            await deleteTokens()
            return res.json({ ok: true })
        }catch (err) {
            console.error('Failed to delete tokens', err.message || err)
            return res.status(500).send('Failed to delete tokens')
        }
    }
}

module.exports = new tokenController()
