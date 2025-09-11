const mongoose = require('mongoose');

const TransActionLogSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  user: {
    type: String,
  },
  logMessage: {
    type: String,
    required: true
  }
})

const TransactionLog = mongoose.model('TransactionLog', TransActionLogSchema)

module.exports = TransactionLog