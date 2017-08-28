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
    // description: {
    //     type: String,
    //     default: '',
    // },
    ordering: {
        type: Number,
        default: 0
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
    // image: {
    //     type: String,
    //     default: ''
    // },
    // type: {
    //     type: String,
    //     default: 'content',
    // },
    // scope: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Category'
    // },
    //Đếm số lượng người dùng tag
    count: {
        type: Number,
        default: 0
    },
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    type: {
        type: String,
        default: 'product',
        enum: ['product', 'post']
    }
}, {
    versionKey: false // You should be aware of the outcome after set to false
});

Tag.pre('save', function(next) {
    if (this._id) {
        let that = this;
        if (that.type == 'product') {
            let product = mongoose.model("Product");
            product.find({
                    is_collection: true,
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
        }
    } else {
        next();
    }
});

module.exports = mongoose.model('Tag', Tag);