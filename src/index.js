require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const authRoutes = require('./routes/auth');
const fetchRoutes = require('./routes/fetch');
const mainroutes = require('./routes/mainrouters')
require('./workers/messageWorker')
require('./workers/threadWorker')
const { startCron } = require('./cron/fetchCron')

if (process.env.CRON_SUBJECTS) startCron()

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/status', (req, res) => res.json({ ok: true }));

app.use('/', authRoutes);
//ACTIVE MIDDLEWARE IMPLEMENTATION FOR ACCESSING AUTHENTICATED ROUTES
app.use('/api', mainroutes)

const PORT = process.env.APP_PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/gmail_poc';

mongoose.connect(MONGO_URI).then(() => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}).catch(err => {
  console.error('Mongo connection error:', err);
});

module.exports = app;