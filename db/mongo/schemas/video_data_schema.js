'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const videoDataSchema = new Schema({
    videoFile: {
        type: String,
        required: true
    },
    sound: {
        type: Schema.Types.ObjectId,
        ref: 'SoundData'
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    discoverySection: {
        type: Schema.Types.ObjectId,
        ref: 'DiscoverySection'
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

module.exports = mongoose.model('VideoData', videoDataSchema);