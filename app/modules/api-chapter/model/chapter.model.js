'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var slug = require('slug');
var async = require('async');
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
    order: {
        type: Number,
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

ChapterSchema.pre('save', function(next) {
    var Chapter = mongoose.model("Chapter");
    var that = this;
    if (!this.order) {
        Chapter.find({
                postId: this.postId,
            })
            .lean()
            .sort("-order")
            .limit(1)
            .then(chapter => {
                that.order = (chapter && chapter.length ? chapter[0].order : 0) + 1;
                next();
            });
    } else {
        next();
    }
});

ChapterSchema.post('save', function(doc) {
    var Post = mongoose.model("Post");
    var Chapter = mongoose.model("Chapter");
    async.parallel({
        publishChapters: function(c) {
            Chapter.find({ postId: doc.postId, status: 1 })
                .lean()
                .count()
                .then(count => {
                    c(null, count);
                });
        },
        post: function(c) {
            Post.findOne({ _id: doc.postId })
                .then(post => {
                    c(null, post);
                });
        }
    }, function(err, result) {
        result.post.publishChapters = result.publishChapters;
        result.post.save();
    });
});

module.exports = mongoose.model('Chapter', ChapterSchema);