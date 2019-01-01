'use strict';
const mongoose = require('mongoose');

const itemSchema = mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  itemTitle: { type: String, required: true },
  itemDate: { type: Date, required: true },
  itemNotes: { type: String }
});

itemSchema.methods.serialize = function() {
  return {
    id: this._id,
    user: this.user,
    itemTitle: this.itemTitle,
    itemDate: this.itemDate,
    itemNotes: this.itemNotes
  };
};

const Item = mongoose.model('Item', itemSchema);
module.exports = { Item };
