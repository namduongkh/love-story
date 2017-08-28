'use strict';

const mongoose = require('mongoose');
const _ = require('lodash');
const Schema = mongoose.Schema;

var RecomenedSchema = new Schema({
    postId: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    userId: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    // is_collection: {
    //     type: Boolean,
    //     default: false
    // },
    created: {
        type: Date,
        default: Date.now
    }
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

RecomenedSchema.pre('save', function(next) {
    var that = this;
    var recomenedModel = mongoose.model('Recomened', RecomenedSchema);
    recomenedModel.findOne({
            userId: that.userId,
            postId: that.postId
        })
        .then(function(fa) {
            if (fa) {
                // that = _.extend(that, fa);
                fa.remove().then(function() {
                    next();
                });
            } else {
                next();
            }
        })
});

module.exports = mongoose.model('Recomened', RecomenedSchema);