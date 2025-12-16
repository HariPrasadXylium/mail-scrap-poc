const mongoose = require('mongoose')

const TokenSchema = new mongoose.Schema({
  name: { type: String, default: 'default', unique: true },
  access_token: { type: String },
  refresh_token: { type: String },
  scope: { type: String },
  token_type: { type: String },
  expiry_date: { type: Number },
  raw: { type: Object },
}, { timestamps: true })

module.exports = mongoose.model('Token', TokenSchema)
