'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var slug = require('slug');
/**
 * Chapter Schema
 */
var ChapterSchema = new Schema({
    title: {
        type: String,
        default: '',
        required: 'Please fill title',
        trim: true
    },
    slug: {
        type: String,
        default: '',
        trim: true
    },
    shortId: {
        type: String
    },
    postId: {
        type: Schema.ObjectId,
        ref: 'Post'
    },
    content: {
        type: String,
        default: '',
        // required: 'Please fill content',
        trim: true
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
    meta: {
        title: String,
        description: String,
        keyword: String
    }
}, {
    versionKey: false // You should be aware of the outcome after set to false
});
ChapterSchema.index({ slug: 1 });

ChapterSchema.pre('update', function(next) {
    if (!this.slug) {
        this.slug = slug(this.title);
    }
    this.slug = this.slug.toLowerCase();
    this.modified = Date.now();
    next();
});
ChapterSchema.pre('save', function(next) {
    if (!this.slug) {
        this.slug = slug(this.title);
    }
    this.slug = this.slug.toLowerCase();
    this.modified = Date.now();
    next();
});

function makeShortId(len, reply) {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < len; i++)
        id += possible.charAt(Math.floor(Math.random() * possible.length));

    let Chapter = mongoose.model("Chapter");
    Chapter.findOne({
            shortId: id
        })
        .then(post => {
            if (post && post.length) {
                id += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return reply({
                shortId: id
            });
        })
        .catch(err => {
            return reply({
                shortId: id
            });
        });
}

ChapterSchema.pre('save', function(next) {
    if (!this.shortId) {
        makeShortId(10, resp => {
            this.shortId = resp.shortId;
            next();
        });
    } else {
        next();
    }
});

module.exports = mongoose.model('Chapter', ChapterSchema);