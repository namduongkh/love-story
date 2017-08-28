'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
    Schema = mongoose.Schema;
var slug = require('slug');
/**
 * Post Schema
 */
var PostSchema = new Schema({
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
    teaser: {
        type: String,
        default: '',
        trim: true
    },
    image: {
        type: String,
        default: '',
        trim: true
    },
    thumb: {
        type: String,
        default: '',
        trim: true
    },
    content: {
        type: String,
        default: '',
        // required: 'Please fill content',
        trim: true
    },
    feature: {
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
    category: {
        type: Schema.ObjectId,
        ref: 'Category'
    },
    user: {
        type: Schema.ObjectId,
        ref: 'User'
    },
    attrs: {
        title: String,
        description: String,
        keyword: String
    },
    total_recommened: { // Tổng số lượt khuyên nên đọc
        type: Number,
        default: 0
    },
    communityId: {
        type: Schema.ObjectId,
        ref: 'Community'
    },
    tags: [{ // Danh sách các tag của bài đăng này
        type: Schema.ObjectId,
        ref: 'Tag'
    }],
    recomenedList: [{ // Danh sách các lần bấm nên đọc
        type: Schema.ObjectId,
        ref: 'Recomened'
    }],
    userRecomened: [{ // Danh sách user bấm nên đọc
        type: Schema.ObjectId,
        ref: 'User'
    }]
}, {
    versionKey: false // You should be aware of the outcome after set to false
});
PostSchema.index({ slug: 1 });

PostSchema.pre('update', function(next) {
    if (!this.slug) {
        this.slug = slug(this.title);
    }
    this.slug = this.slug.toLowerCase();
    this.modified = Date.now();
    next();
});
PostSchema.pre('save', function(next) {
    if (!this.slug) {
        this.slug = slug(this.title);
    }
    this.slug = this.slug.toLowerCase();
    this.modified = Date.now();
    next();
});

function syncTag(tagId) {
    tagId = tagId._id || tagId;
    let tag = mongoose.model("Tag");
    tag.findById(tagId)
        .then(function(tag) {
            if (tag) {
                tag.save();
            }
        });
}

PostSchema.post('save', function(doc) {
    // console.log("post save", doc.title, doc.tags);
    if (doc.tags && doc.tags.length) {
        for (var i = 0; i < doc.tags.length; i++) {
            syncTag(doc.tags[i]);
        }
    }
});

PostSchema.pre('save', function(next) {
    if (this._id) {
        // console.log("pre save", this.title, this.tags);
        let tag = mongoose.model("Tag");
        let post = mongoose.model("Post");
        let that = this;
        post.findById(that._id).select("tags").lean().then(function(post) {
            if (post && post.tags && post.tags.length) {
                post.tags = post.tags || [];
                that.tags = that.tags || [];
                tag.find({
                        $and: [
                            { _id: { $in: post.tags } },
                            { _id: { $nin: that.tags } },
                        ]
                    })
                    .then(function(tags) {
                        for (var i = 0; i < tags.length; i++) {
                            syncTag(tags[i]);
                        }
                    });
            }
            next();
        });
    } else {
        next();
    }
});

PostSchema.pre('remove', function(next) {
    // console.log("remove", this);
    if (this.tags && this.tags.length) {
        for (var i = 0; i < this.tags.length; i++) {
            syncTag(this.tags[i]);
        }
    }
    next();
});

function makeShortId(len, reply) {
    var id = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  
    for (var i = 0; i < len; i++)
      id += possible.charAt(Math.floor(Math.random() * possible.length));
    
    let Post = mongoose.model("Post");
    Post.findOne({
        shortId: id
    })
    .then(post=>{
        if (post && post.length) {
            id += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return reply({
            shortId: id
        })
    })
    .catch(err=>{
        return reply({
            shortId: id
        })
    });
}

PostSchema.pre('save', function(next) {
    if (!this.shortId) {   
        makeShortId(10, resp=>{
            this.shortId = resp.shortId;
            next();
        })
    } else {
        next();
    }
});

module.exports = mongoose.model('Post', PostSchema);