'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const soundSectionSchema = new Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
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
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('SoundSection', soundSectionSchema);