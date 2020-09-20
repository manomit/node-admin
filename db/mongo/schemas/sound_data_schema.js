'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const soundDataSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    soundFile: {
        type: String,
        required: true
    },
    soundSection: [{
        type: Schema.Types.ObjectId,
        ref: 'SoundSection'
    }],
    soundLanguage: [{
        type: Schema.Types.ObjectId,
        ref: 'SoundLanguage'
    }],
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

module.exports = mongoose.model('SoundData', soundDataSchema);