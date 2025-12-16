const express = require('express')
const router = express.Router()
const tokenController = require('../controllers/tokenController')

router.get('/status', async (req, res) => tokenController.getStatus(req, res))
router.post('/delete', async (req, res) => tokenController.delete(req, res))

module.exports = router
