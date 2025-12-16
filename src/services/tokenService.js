const Token = require('../models/Token')

async function saveTokens(tokens) {
    let fields = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
      raw: tokens
    }

    await Token.findOneAndUpdate({ name: 'default' }, { $set: fields }, { upsert: true, new: true })
}

async function loadTokens() {
    let doc = await Token.findOne({ name: 'default' }).lean()
    if (!doc) return null
    let { access_token, refresh_token, scope, token_type, expiry_date } = doc
    return { access_token, refresh_token, scope, token_type, expiry_date }
}

async function deleteTokens() {
    await Token.deleteOne({ name: 'default' })
}

module.exports = { saveTokens, loadTokens, deleteTokens }
