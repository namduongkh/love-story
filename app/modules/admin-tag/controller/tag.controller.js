'use strict';
const mongoose = require('mongoose');
const Tag = mongoose.model('Tag');
const Boom = require('boom');
const Joi = require('joi');
const _ = require('lodash');
const ErrorHandler = require(BASE_PATH + '/app/utils/error.js');

exports.getAll = {
    handler: function(request, reply) {

        let config = request.server.configManager;
        let page = request.query.page || 1;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');
        let options = {};
        let {
            communityId,
            status,
            getList,
            order,
            type
        } = request.payload || request.query;
        if (typeof order == 'string') order = JSON.parse(order);

        if (communityId) {
            options.communityId = communityId.toObjectId();
        }
        if (status) {
            options.status = parseInt(status);
        }
        if (type) {
            options.type = type;
        }
        if (request.query.keyword && request.query.keyword.length > 0) {
            let re = new RegExp(request.query.keyword, 'i');
            options.name = re;
        }
        if (getList == 'true') {
            Tag.find(options)
                .sort('-count')
                .then(items => {
                    let dataRes = {
                        items: items
                    };
                    return reply(dataRes);
                }).catch(err => {
                    if (err) {
                        request.log(['error', 'list', 'category'], err);
                        return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                    }
                });

        } else {
            if (order && order.field == 'communityId') {
                var promise = Tag.aggregate([{
                        $match: options
                    },
                    {
                        $lookup: {
                            from: "communities",
                            localField: "communityId",
                            foreignField: "_id",
                            as: "communities"
                        }
                    },
                    {
                        $unwind: {
                            path: "$communities",
                            // includeArrayIndex: <string>,
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $sort: {
                            'communities.title': parseInt(order.type)
                        }
                    },
                    {
                        $skip: (page - 1) * 20
                    },
                    {
                        $limit: 20
                    }
                ]);

                Tag.find(options).count(function(err, total) {
                    promise.then(function(result) {
                        for (var i = 0; i < result.length; i++) {
                            result[i].communityId = result[i].communities;
                        }

                        let dataRes = {
                            status: 1,
                            totalItems: total,
                            totalPage: Math.ceil(total / 20),
                            currentPage: page,
                            itemsPerPage: 20,
                            numberVisiblePages: numberVisiblePages,
                            items: result
                        };

                        return reply(dataRes);
                    });
                });
            } else {
                Tag.find(options)
                    .sort(order ? (order.type == 1 ? order.field : '-' + order.field) : '_id')
                    .populate('communityId')
                    .paginate(page, itemsPerPage, function(err, items, total) {
                        if (err) {
                            request.log(['error', 'list', 'category'], err);
                            return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                        }
                        let totalPage = Math.ceil(total / itemsPerPage);
                        let dataRes = {
                            status: 1,
                            totalItems: total,
                            totalPage: totalPage,
                            currentPage: page,
                            itemsPerPage: itemsPerPage,
                            numberVisiblePages: numberVisiblePages,
                            items: items
                        };
                        return reply(dataRes);
                    });
            }
        }

    },

}
exports.edit = {
    pre: [{
        method: getById,
        assign: 'tag'
    }],
    handler: function(request, reply) {
        const tag = request.pre.tag;
        if (tag) {
            return reply(tag);
        } else {
            reply(Boom.notFound('Tag is not found'));
        }
    }
}
exports.getByIdentity = {
    handler: function(request, reply) {
        Tag.findOne({
                identity: request.params.identity
            })
            .lean()
            .then(function(category) {
                if (category) {
                    return reply(category);
                } else {
                    return reply(null);
                }
            });
    },

}
exports.delete = {
    pre: [{
        method: getById,
        assign: 'tag'
    }],
    handler: function(request, reply) {
        const tag = request.pre.tag;
        tag.remove((err) => {
            if (err) {
                reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            }
            return reply(tag);
        });
    }
}

exports.save = {
    handler: function(request, reply) {
        let tag = new Tag(request.payload);
        console.log('tao tag', request.payload);
        let promise = tag.save();
        promise.then(function(tag) {
            return reply(tag);
        }).catch(function(err) {
            console.log(err);
            request.log(['error', 'tag'], err);
            return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        });
    },
    description: 'Created tag',
    tags: ['api'],
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
    validate: {
        payload: {
            name: Joi.string().required().description('Title'),
            slug: Joi.string().description('Slug'),
            ordering: Joi.any().description('Ordering'),
            type: Joi.any().description('Type'),
            status: Joi.number().required().description('Status'),
            communityId: Joi.string().required().description('community'),
            count: Joi.number().required().description('Count'),
            // description: Joi.any().description('Description'),
            // scope: Joi.string().description('Scope'),
            // type: Joi.string().description('Type'),
            // image: Joi.any().description('Image'),
        },
        options: {
            allowUnknown: true
        }
    }
};

exports.update = {
    pre: [{
        method: getById,
        assign: 'tag'
    }],
    handler: function(request, reply) {
        let tag = request.pre.tag;
        tag = _.extend(tag, request.payload);
        let promise = tag.save();
        promise.then(function(tag) {
            reply(tag);
        }).catch(function(err) {
            reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        });
    },
    description: 'Update category',
    tags: ['api'],
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
    validate: {
        payload: {
            name: Joi.string().required().description('Name'),
            slug: Joi.string().description('Slug'),
            status: Joi.number().required().description('Status'),
            _id: Joi.string().description('MongoID'),
            modified: Joi.any().description('Modified'),
            ordering: Joi.any().description('Ordering'),
            type: Joi.any().description('Type'),
            communityId: Joi.string().required().description('community'),
            count: Joi.number().required().description('Count'),
            // scope: Joi.string().description('Scope'),
            // type: Joi.string().description('Type'),
            // image: Joi.any().description('Image'),
            // description: Joi.any().description('Description'),
        },
        options: {
            allowUnknown: true
        }
    }
}

exports.getList = {
    handler: function(request, reply) {
        let promise = Tag.find({
            status: 1,
            count: { $gt: 0 },
            type: "post"
        });
        promise.then(function(tag) {
            reply({ status: 1, items: tag });
        }).catch(function(err) {
            request.log(['error'], err);
            return reply(err);
        })
    }
}

function getById(request, reply) {
    const id = request.params.id || request.payload.id;
    let promise = Tag.findOne({
        '_id': id
    });
    promise.then(function(tag) {
        reply(tag);
    }).catch(function(err) {
        request.log(['error'], err);
        return reply(err);
    })


}