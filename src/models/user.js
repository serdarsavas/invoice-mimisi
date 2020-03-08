const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  street: {
    type: String,
    required: true
  },
  zip: {
    type: String,
    reguired: true
  },
  city: {
    type: String,
    required: true
  },
  wechatId: {
    type: String,
    required: true
  },
  position: String,
  registrationNumber: String,
  resetToken: String,
  resetTokenExpiration: Date
});

userSchema.virtual('invoices', {
  ref: 'Invoice',
  localField: '_id',
  foreignField: 'owner'
});

module.exports = mongoose.model('User', userSchema);
