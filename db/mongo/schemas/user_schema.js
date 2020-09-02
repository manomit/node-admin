'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    userId: {
      type: String,
      unique: true,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: [true, 'Enter name'],
      trim: true
    },
    username: {
      type: String,
      unique: [true, 'Username must be unique'],
      required: [true, 'Enter username'],
      trim: true,
      validate: {
        validator: function(v) {
          return this.model('User').findOne({ username: v }).then(user => !user)
        },
        message: props => `${props.value} is already used by another user`
      }
    },
    device: {
      type: String,
      enum: ['Android', 'iOS'],
      required: [true, 'Enter device type'],
      trim: true
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
    versionKey: false,
    timestamps: true,
  }
);

module.exports = mongoose.model('User', userSchema);
