const express = require('express')
const app = express()

app.use('/fetch', require('./fetch'))
app.use('/tokens', require('./tokens'))

module.exports = app
