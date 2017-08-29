'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Tag = new Schema({
    name: {
        type: String,
        default: '',
        required: 'Please fill Category name',
        trim: true
    },
    slug: {
        type: String,
        default: '',
        trim: true
    },
    description: {
        type: String,
        default: '',
    },
    status: {
        type: Number,
        default: 1
    },
    created: {
        type: Date,
        default: Date.now
    },
    modified: {
        type: Date
    },
    //Đếm số lượng người dùng tag
    count: {
        type: Number,
        default: 0
    },
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

Tag.pre('save', function(next) {
    if (this._id) {
        let that = this;
        let post = mongoose.model("Post");
        post.find({
                // is_collection: true,
                status: 1,
                tags: that._id
            })
            .count()
            .then(function(count) {
                that.count = count;
                next();
            })
            .catch(function(err) {
                console.log(err);
                next();
            });
    } else {
        next();
    }
});

module.exports = mongoose.model('Tag', Tag);