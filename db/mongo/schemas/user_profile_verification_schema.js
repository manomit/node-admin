'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const profileVerification = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    idCard: {
        type: String
    },
    photo: {
        type: String
    },
    status: {
        type: String,
        enum: ["APPROVED", "REJECTED"]
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin'
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'Admin'
    },
}, {
    toObject: {
      virtuals: true,
    },
    toJSON: {
      virtuals: true,
    },
    versionKey: false,
    timestamps: true,
});

module.exports = mongoose.model('ProfileVerification', profileVerification);