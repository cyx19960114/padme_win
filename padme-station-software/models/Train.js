const mongoose = require('mongoose');
const TrainSchema = new mongoose.Schema({
  jobid: {
    type: String,
    required: true
  },
  // the pid of the job in url format used for metadata
  train_iri: {
    type: String,
    require: false
  },
  trainstoragelocation: {
    type: String,
    required: true
  },
  trainclassid:{
    type: String,
    required: true
  },
  currentstation: {
    type: String,
    required: true
  },
  nextstation:{
      type: String,
      required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const Train = mongoose.model('Train', TrainSchema);

module.exports = Train;