'use strict';

const mongoose = require('mongoose');
const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const Chapter = mongoose.model('Chapter');
const _ = require('lodash');
const Slug = require('slug');
const async = require("async");
const Tag = mongoose.model('Tag');
const ErrorHandler = require(BASE_PATH + '/app/utils/error.js');

exports.getAll = {
    handler: function(request, reply) {
        let config = request.server.configManager;
        let page = request.query.page || 1;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');
        let {
            status,
            category,
            tags
        } = request.payload || request.query;
        let options = {};
        if (status) {
            options.status = parseInt(status);
        }
        if (category) {
            options.category = category;
        }
        if (tags) {
            options.tags = tags;
        }
        if (request.query.keyword && request.query.keyword.length > 0) {
            let re = new RegExp(request.query.keyword, 'i');
            options.title = re;
        }

        Chapter.find(options)
            .populate('category')
            .populate('user', 'name is_seed')
            .lean()
            .sort('-order -created')
            .paginate(page, itemsPerPage, function(err, items, total) {
                if (err) {
                    request.log(['error', 'list', 'chapter'], err);
                    console.log("err", err);
                    return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                }
                let totalPage = Math.ceil(total / itemsPerPage);
                let dataRes = { status: 1, totalItems: total, totalPage: totalPage, currentPage: page, itemsPerPage: itemsPerPage, numberVisiblePages: numberVisiblePages, items: items };
                return reply(dataRes);
            });
    }
};

exports.edit = {
    pre: [
        { method: getById, assign: 'chapter' }
    ],
    handler: function(request, reply) {
        let chapter = request.pre.chapter;
        if (chapter) {
            return reply(chapter);
        } else {
            reply(Boom.notFound('Chapter is not found'));
        }
    }
}

exports.save = {
    pre: [{
            method: checkSlug,
            assign: 'slugStatus'
        },
        {
            method: checkAndCreateIfNewTag,
            assign: 'tags'
        }
    ],
    handler: function(request, reply) {
        let {
            slugStatus,
            tags
        } = request.pre;

        if (!slugStatus.ok) {
            return reply(Boom.badRequest(slugStatus.message));
        } else {
            request.payload.slug = slugStatus.slug;
        }

        let chapter = new Chapter(request.payload);
        chapter.tags = tags;
        let promise = chapter.save();
        promise.then(function(chapter) {
            reply(chapter);
        }).catch(function(err) {
            request.log(['error', 'chapter'], err);
            reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));

        });
    },
    description: 'Created chapter',
    tags: ['api'],
    plugins: {
        'hapi-swagger': {
            responses: { '400': { 'description': 'Bad Request' } },
            payloadType: 'form'
        }
    },
    validate: {
        payload: {
            title: Joi.string().required().description('Title'),
            content: Joi.any().description('Content'),
            status: Joi.number().required().description('Status'),
            slug: Joi.string().description('Slug'),
            meta: Joi.any().description('Meta'),
            postId: Joi.any().description('Post Id'),
        }
    }
}

exports.update = {
    pre: [{
            method: getById,
            assign: 'chapter'
        },
        {
            method: checkSlug,
            assign: 'slugStatus'
        },
        {
            method: checkAndCreateIfNewTag,
            assign: 'tags'
        }
    ],
    handler: function(request, reply) {
        let {
            chapter,
            slugStatus,
            tags
        } = request.pre;

        if (!slugStatus.ok) {
            return reply(Boom.badRequest(slugStatus.message));
        } else {
            request.payload.slug = slugStatus.slug;
        }

        chapter = _.extend(chapter, request.payload);
        chapter.tags = tags;
        let promise = chapter.save();

        promise.then(function(chapter) {
            reply(chapter);
        }).catch(function(err) {
            reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        });
    },
    description: 'Update chapter',
    tags: ['api'],
    plugins: {
        'hapi-swagger': {
            responses: { '400': { 'description': 'Bad Request' } },
            payloadType: 'form'
        }
    },
    validate: {
        payload: {
            title: Joi.string().required().description('Title'),
            content: Joi.any().description('Content'),
            status: Joi.number().required().description('Status'),
            slug: Joi.string().description('Slug'),
            meta: Joi.any().description('Meta'),
            postId: Joi.any().description('Post Id'),
        },
        options: {
            allowUnknown: true
        }
    }
}
exports.delete = {
    pre: [
        { method: getById, assign: 'chapter' }
    ],
    handler: function(request, reply) {
        const chapter = request.pre.chapter;
        chapter.remove((err) => {
            return reply(chapter);
        });
    }
}

/**
 * Middleware
 */
function getById(request, reply) {
    const id = request.params.id || request.payload.id;
    let promise = Chapter.findOne({
        '_id': id
    });
    // .populate("user", "_id name");
    promise.then(function(chapter) {
        reply(chapter);
    }).catch(function(err) {
        request.log(['error'], err);
        return reply.continue();
    })
}

function checkSlug(request, reply) {
    let {
        _id,
        slug,
        title
    } = request.payload || request.params;
    if (!slug) {
        var newSlug = Slug(title);
    } else {
        var newSlug = Slug(slug);
    }
    newSlug = newSlug.toLowerCase();
    if (_id) {
        var promise = Chapter.find({
            slug: newSlug,
            _id: {
                $ne: _id
            }
        });
    } else {
        var promise = Chapter.find({
            slug: newSlug
        });
    }
    promise.then(function(result) {
        if (result &&
            result.length > 0) {
            if (slug) {
                var message = "Slug already exits";
            } else {
                var message = "System has generated a duplicate slug. Please enter a new slug";
            }
            return reply({
                ok: false,
                message: message
            });
        } else {
            return reply({
                ok: true,
                slug: newSlug
            });
        }
    }).catch(function(err) {
        return reply({
            ok: false,
            message: 'An error occurs'
        });
    });
}

function checkAndCreateIfNewTag(request, reply) {
    let {
        tags,
    } = request.payload || request.params;
    var tmpTags = [];
    if (tags) {
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
    } else {
        return reply(tmpTags);
    }

}

function makeNewTagSlug(name, callback, count) {
    if (typeof count == 'undefined') count = 0;
    else name = name + ' ' + count;

    let slug = Slug(name).toLowerCase();
    let promise = Tag.find({
        slug: slug,
    });

    promise.then(function(result) {
        if (result.length > 0) {
            return makeNewTagSlug(name, callback, count + 1);
        } else {
            if (typeof callback == 'function') callback(slug);
        }
    });
}