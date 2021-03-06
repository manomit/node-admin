'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const utility = require('../utility');

const adminSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
      set: utility.toLowerCaseConverter,
    },
    password: {
      type: String,
      required: true,
    },
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    gravatar: {
      type: String
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin'
    },
    adminType: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN"]
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

module.exports = mongoose.model('Admin', adminSchema);
