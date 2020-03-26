const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const invoiceSchema = new Schema(
  {
    invoiceNumber: {
      type: String,
      required: true
    },
    date: {
      type: Date,
      default: Date.now
    },
    recipient: {
      name: {
        type: String,
        trim: true
      },
      city: {
        type: String,
        required: true,
        trim: true
      },
      street: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      wechatId: {
        type: String,
        required: true,
        trim: true
      }
    },
    rows: [
      {
        description: {
          type: String,
          required: true,
          trim: true
        },
        quantity: {
          type: Number,
          required: true,
          trim: true
        },
        price: {
          type: Number,
          required: true,
          trim: true
        },
        amount: {
          type: Number,
          required: true,
          trim: true
        }
      }
    ],
    total: Number,
    owner: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Invoice', invoiceSchema);
