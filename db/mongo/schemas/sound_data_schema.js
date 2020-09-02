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
    soundSection: {
        type: Schema.Types.ObjectId,
        ref: 'SoundSection'
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    versionKey: false,
    timestamps: true
});

module.exports = mongoose.model('SoundData', soundDataSchema);