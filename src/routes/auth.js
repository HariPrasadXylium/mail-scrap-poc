const express = require('express')
const router = express.Router()
const { getAuthUrl } = require('../googleAuth')
const AuthController = require('../controllers/authController')


router.get('/auth', (req, res) => {
    const loginHint = req.query.email || process.env.DEFAULT_USER_EMAIL || ''
    const url = getAuthUrl(loginHint)
    res.redirect(url)
});


router.get('/oauthcallback', async (req, res) => {
    return AuthController.processLoginCallback(req, res)
});

module.exports = router
