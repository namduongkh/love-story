'use strict';

const mongoose = require('mongoose');
const Boom = require('boom');
const Post = mongoose.model('Post');
const Recomened = mongoose.model('Recomened');
const User = mongoose.model('User');
const mkdirp = require('mkdirp');
const fs = require('fs-extra');
const download = require('image-downloader');
const ErrorHandler = require(BASE_PATH + '/app/utils/error.js');
const Striptags = require('striptags');
const Entities = require("entities");
const _ = require('lodash');
const async = require('async');
const Slug = require('slug');
const Tag = mongoose.model('Tag');
const Joi = require('joi');

exports.getImageFromContent = {
    handler: function(request, reply) {
        let configManager = request.server.plugins['hapi-kea-config'];
        let data = request.payload;

        function savePost(post, cb) {
            cb = cb || function() {};
            post.save().then(function() {
                cb();
            });
        }
        Post.findOne({
                _id: data.id
            })
            .then(post => {
                let re = /<img[^>]+src="([^">]+)"/g;
                let url_img = re.exec(post.content);
                let postDir = configManager.get('web.upload.post') + '/' + post._id;

                // Move ảnh image vào trong id của bài post
                if (post.image && fs.existsSync(configManager.get('web.upload.post') + '/' + post.image)) {
                    fs.move(configManager.get('web.upload.post') + '/' + post.image, postDir + '/' + post.image, function(err) {
                        if (err)
                            throw err;
                    });
                }
                // Move ảnh thumb vào trong id của bài post
                if (post.thumb && fs.existsSync(configManager.get('web.upload.post') + '/' + post.thumb)) {
                    fs.move(configManager.get('web.upload.post') + '/' + post.thumb, postDir + '/' + post.thumb, function(err) {
                        if (err)
                            throw err;
                    });
                }

                // Nếu không có ảnh image thì lấy ảnh trong content ra làm ảnh image
                if (post.image == '' && url_img && url_img[1] != '') {
                    mkdirp(postDir, function(err) {
                        let webUrl = configManager.get('web.context.settings.services.webUrl')
                        let imageUrl = url_img[1];
                        let webUrlReg = new RegExp(webUrl + "/files/posts/" + "(.+)", "gi");
                        let execImageUrl = webUrlReg.exec(imageUrl);
                        if (execImageUrl && execImageUrl[1]) {
                            let imageName = execImageUrl[1].split("/").pop();
                            fs.copySync(configManager.get('web.upload.post') + "/" + execImageUrl[1], postDir + "/" + imageName);
                            post.image = imageName;
                            savePost(post, function() {
                                return reply({
                                    status: 'OK'
                                });
                            });
                        } else {
                            let options = {
                                url: url_img[1],
                                dest: postDir
                            };
                            // console.log("options", options);
                            download.image(options)
                                .then(({ filename, image }) => {
                                    // console.log("download", filename, image);
                                    post.image = filename.split('/').pop().split('#')[0].split('?')[0];
                                    savePost(post);
                                }).catch((err) => {
                                    return reply({
                                        status: 'Fail'
                                    });
                                });
                        }
                    });
                } else {
                    reply({
                        status: 'OK'
                    });
                }
            });
    },
    tags: ['api'],
    validate: {
        payload: {
            id: Joi.string().required().description('Post id'),
        }
    },
    plugins: {
        'hapi-swagger': {
            responses: {
                '400': {
                    'description': 'Bad Request'
                }
            },
            payloadType: 'form'
        }
    },
};

exports.getList = {
    handler: function(request, reply) {
        let itemPerPage = 16;
        let {
            categoryIds, // array
            tagIds, // array
            page,
            communityId
        } = request.payload;

        page = page || 1;

        let userId = null;
        if (request.auth.isAuthenticated)
            userId = request.auth.credentials.id;

        let options = {};
        options.communityId = communityId;
        if (categoryIds && categoryIds.length) {
            options.category = { $in: categoryIds };
        }
        if (tagIds && tagIds.length) {
            options.tags = { $in: tagIds };
        }

        Post.find(options)
            .populate('user', 'name avatar phone')
            .populate('category', 'name slug')
            .lean()
            .sort({ "feature": -1, "modified": -1 })
            .paginate(page, itemPerPage, (err, items, total) => {
                if (err) {
                    // request.log(['error'], err);
                    return reply({
                        message: err,
                        status: false
                    });
                }
                items.forEach(function(item) {
                    item.text = Striptags(item.content);
                    item.text = Entities.decodeHTML(item.text);
                    if (userId) {
                        if (item.userRecomened.length > 0) {
                            item.userRecomened.forEach(function(val, i) {
                                if (val.toString() == userId) {
                                    item.hasRecommended = true;
                                    return false;
                                }
                            })
                        } else {
                            item.hasRecommended = false;
                        }
                    }
                });
                let end = false;
                if (items.length < itemPerPage) {
                    end = true;
                }
                // if (userId) {
                //     items.forEach(function(item, index) {
                //         if (item.userRecomened.length > 0) {
                //             item.userRecomened.forEach(function(val, i) {
                //                 if (val.toString() == userId) {
                //                     item.hasRecommended = true;
                //                     return false;
                //                 }
                //             })
                //         } else {
                //             item.hasRecommended = false;
                //         }

                //     })
                // }
                return reply({
                    status: true,
                    items: items,
                    total: total,
                    end,
                    user_login: userId
                });
            });
    }
};

exports.getDetail = {
    handler: function(request, reply) {
        let { postId } = request.payload;
        if (postId) {
            Post.findOne({
                    _id: postId,
                    status: 1
                })
                .populate('tags', 'name slug')
                .lean()
                .then(function(post) {
                    return reply(post);
                });
        } else {
            return reply({
                status: false,
                message: "Không có id bài đăng"
            });
        }
    }
};

exports.recommenedPost = {
    handler: function(request, reply) {
        let { user_id, post_id } = request.payload;

        if (!user_id || !post_id) {
            return reply({
                status: false,
                message: 'Vui lòng đăng nhập!',
                login: false
            });
        } else {
            async.parallel({
                recommened: function(cb) {
                    Recomened.findOne({
                            postId: post_id,
                            userId: user_id
                        })
                        .then(recommened => {
                            if (recommened) {
                                recommened.remove().then(function() {
                                    cb(null, {
                                        status: false,
                                        recommened_id: recommened._id
                                    })
                                })
                            } else {
                                let recommenedData = new Recomened({
                                    postId: post_id,
                                    userId: user_id
                                });
                                recommenedData.save()
                                    .then(recommened => {
                                        cb(null, {
                                            status: true,
                                            recommened_id: recommened._id
                                        });
                                    })
                            }
                        });
                },
                post: function(cb) {
                    Post.findOne({
                            _id: post_id
                        })
                        .then(post => {
                            cb(null, post);
                        })
                },
                user: function(cb) {
                    User.findOne({
                            _id: user_id
                        })
                        .then(user => {
                            cb(null, user);
                        })
                }
            }, (err, result) => {
                let { recommened, post, user } = result;
                let { status, recommened_id } = recommened;

                var parallel = [
                    function(cb) {
                        if (status) {
                            post.recomenedList.push(recommened_id);
                            post.total_recommened++;
                            post.userRecomened.push(user_id);
                        } else {
                            let index = post.recomenedList.indexOf(recommened_id);
                            let index2 = post.userRecomened.indexOf(user_id);
                            if (index > -1 || index2 > -1) {
                                post.recomenedList.splice(index, 1);
                                post.userRecomened.splice(index2, 1);
                                post.total_recommened--;
                            }
                        }
                        post.save()
                            .then(function() {
                                cb();
                            })
                    },
                    function(cb) {
                        if (status) {
                            user.recommened_post.push(post_id);
                            user.total_recommened++;
                        } else {
                            let index = user.recommened_post.indexOf(post_id);
                            if (index > -1) {
                                user.recommened_post.splice(index, 1);
                                user.total_recommened--;
                            }
                        }
                        user.save()
                            .then(function() {
                                cb();
                            })
                    }
                ];
                async.parallel(parallel, function() {
                    return reply({
                        recommened_status: status,
                        total_recommened: post.total_recommened
                    });
                });
            })
        }
    }
}

exports.create = {
    pre: [{
            method: newSlug,
            assign: 'newSlug'
        },
        {
            method: checkAndCreateIfNewTag,
            assign: 'tags'
        }
    ],
    handler: function(request, reply) {
        if (!request.auth.isAuthenticated) {
            return reply().redirect("/trang-khong-tim-thay");
        }
        let { newSlug, tags } = request.pre;
        let post = new Post(request.payload);
        post.slug = newSlug.slug;
        post.user = request.auth.credentials.id;
        post.tags = tags;

        let promise = post.save();
        promise.then(function(post) {
            reply({
                status: 'OK',
                post: {
                    id: post._id,
                    slug: post.slug,
                    shortId: post.shortId
                }
            });
        }).catch(function(err) {
            reply({
                status: "Error"
            });
        });
    }
}

exports.update = {
    pre: [{
            method: getById,
            assign: 'post'
        },
        {
            method: newSlug,
            assign: 'checkSlug'
        },
        {
            method: checkAndCreateIfNewTag,
            assign: 'tags'
        }
    ],
    handler: function(request, reply) {
        if (!request.auth.isAuthenticated) {
            return reply().redirect("/trang-khong-tim-thay");
        }

        let {
            post,
            checkSlug,
            tags
        } = request.pre;

        let { title, category, content } = request.payload;
        post.title = title;
        post.category = category;
        post.content = content;
        post.tags = tags;
        post.slug = checkSlug.slug;

        let promise = post.save();

        promise.then(function(post) {
            reply({
                status: 'OK',
                post: {
                    id: post._id,
                    slug: post.slug,
                    shortId: post.shortId
                }
            });
        }).catch(function(err) {
            reply({
                status: "Error"
            });
        });
    }
}

function newSlug(request, reply) {
    let {
        id,
        slug,
        title
    } = request.payload || request.params;
    let newSlug, promise;
    if (!slug) {
        newSlug = Slug(title);
    } else {
        newSlug = Slug(slug);
    }
    newSlug = newSlug.toLowerCase();
    if (id) {
        promise = Post.find({
            slug: newSlug,
            _id: {
                $ne: id
            }
        });
    } else {
        promise = Post.find({
            slug: newSlug
        });
    }
    promise.then(function(result) {
        if (result && result.length > 0)
            newSlug = newSlug + '-' + +Math.floor((1 + Math.random()) * 0x10000);
        return reply({
            status: true,
            slug: newSlug
        })
    }).catch(err => {
        return reply({
            status: false,
            slug: newSlug
        })
    })
}

function checkAndCreateIfNewTag(request, reply) {
    let {
        tags,
        communityId
    } = request.payload || request.params;
    var tmpTags = [];

    async.each(tags, function(item, callback) {
        if (item && item.search(" ") == -1 && mongoose.Types.ObjectId.isValid(item)) {
            let promise = Tag.find({
                _id: item
            });

            promise.then(function(result) {
                tmpTags.push(item.toString());
                callback();
            });
        } else {
            makeNewTagSlug(item, function(slug) {
                let tag = new Tag({
                    name: item,
                    slug: slug,
                    communityId: communityId,
                    type: 'post'
                });

                let promise = tag.save();

                promise.then(function(result) {
                    tmpTags.push(result._id.toString());
                    callback();
                });
            });
        }
    }, function(err) {
        return reply(tmpTags);
    });
}

function makeNewTagSlug(name, callback, count) {
    if (typeof count == 'undefined') count = 0;
    else name = name + ' ' + count;

    let slug = Slug(name).toLowerCase();
    let promise = Tag.find({
        slug: slug,
        type: 'post'
    });

    promise.then(function(result) {
        if (result.length > 0) {
            return makeNewTagSlug(name, callback, count + 1);
        } else {
            if (typeof callback == 'function') callback(slug);
        }
    });
}

function getById(request, reply) {
    const id = request.params.id || request.payload.id;
    let promise = Post.findOne({ '_id': id });
    promise.then(function(post) {
        reply(post);
    }).catch(function(err) {
        request.log(['error'], err);
        return reply.continue();
    })
}