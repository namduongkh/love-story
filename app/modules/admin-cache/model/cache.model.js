'use strict';
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var CacheSchema = new Schema({
    _id: {
        type: String
    },
    value: {
        type: Object
    }
}, {
    collection: 'cache'
}, {
    versionKey: false
});

module.exports = mongoose.model('Cache', CacheSchema);