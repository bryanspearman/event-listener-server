'use strict';
const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  eventTitle: { type: String, required: true },
  targetDate: { type: Date, required: true },
  eventNotes: { type: String }
});

eventSchema.methods.serialize = function() {
  return {
    id: this._id,
    user: this.user,
    eventTitle: this.eventTitle,
    targetDate: this.targetDate,
    eventNotes: this.eventNotes
  };
};

const Event = mongoose.model('Event', eventSchema);
module.exports = { Event };
