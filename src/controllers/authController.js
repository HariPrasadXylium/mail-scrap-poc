const { createOAuthClient } = require('../googleAuth')
const { saveTokens } = require('../services/tokenService')


function authController() {
    this.processLoginCallback = async (req, res) => {
        let code = req.query.code
        if (!code) return res.status(400).send('Missing code in callback')
    
        let oAuth2Client = createOAuthClient()
    
        try {
          let { tokens } = await oAuth2Client.getToken(code)
    
          if (!tokens || !tokens.access_token) {
            console.error('No access_token returned by token exchange')
            return res.status(500).send('Token exchange failed — no access_token returned')
          }
    
          await saveTokens(tokens)
    
          oAuth2Client.setCredentials(tokens)
    
          return res.send(`
            <h3>Authentication successful</h3>
            <p>Tokens saved to database.</p>
            <p>You can now call the Gmail fetch endpoints.</p>
          `)
        }catch (err) {
          console.error('Error exchanging code', err.message || err)
          return res.status(500).send('Authentication failed: ' + (err.message || err.toString()))
        } 
    }
}

module.exports = new authController()