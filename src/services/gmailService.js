const { google } = require('googleapis')
const { createOAuthClient } = require('../googleAuth')
const { loadTokens, saveTokens } = require('./tokenService')

async function getAuthenticatedGmail() {
    try{
        let oAuth2Client = createOAuthClient()
        let tokens = await loadTokens()
        if (!tokens) throw new Error('No tokens found. Visit /auth to authorize.')

        oAuth2Client.setCredentials(tokens)

        try {
            await oAuth2Client.getAccessToken()
            await saveTokens(oAuth2Client.credentials)
        } catch (err) {
            console.error('Failed to refresh token', err.message || err)
            throw err
        }

        return google.gmail({ version: 'v1', auth: oAuth2Client })
    }   catch(err){
        console.error('Error in getAuthenticatedGmail:', err.message || err)
        throw err
    }
}

module.exports = { getAuthenticatedGmail }
