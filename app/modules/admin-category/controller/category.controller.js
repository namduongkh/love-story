'use strict';

const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const ErrorHandler = require(BASE_PATH + '/app/utils/error.js');
const _ = require('lodash');

exports.getAll = {
    handler: function(request, reply) {
        let config = request.server.configManager;
        let page = request.query.page || 1;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');
        let options = {};
        if (request.query.type) {
            options.type = request.query.type;
        }
        if (request.query.keyword && request.query.keyword.length > 0) {
            let re = new RegExp(request.query.keyword, 'i');
            options.name = re;
        }
        Category.find(options).populate('communityId').sort('id').paginate(page, itemsPerPage, function(err, items, total) {
            if (err) {
                request.log(['error', 'list', 'category'], err);
                reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
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
            reply(dataRes);
        });

    }
}

exports.edit = {
    pre: [{
        method: getById,
        assign: 'category'
    }],
    handler: function(request, reply) {
        const category = request.pre.category;
        if (category) {
            return reply(category);
        } else {
            reply(Boom.notFound('Category is not found'));
        }
    }
};

exports.getByIdentity = {
    handler: function(request, reply) {
        Category.findOne({
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
    }
};

exports.getById_ref = function(ID) {

    return Category.findOne({
        '_id': ID
    }, (err, category) => {
        if (!err) {
            return category;
        } else {
            return [];
        }
    });


}

exports.save = {
    handler: function(request, reply) {
        let category = new Category(request.payload);
        let promise = category.save();
        promise.then(function(category) {
            reply(category);
        }).catch(function(err) {
            request.log(['error', 'category'], err);
            reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        });
    },
    description: 'Created category',
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
            type: Joi.string().required().description('Type'),
            image: Joi.any().description('Image'),
            status: Joi.number().required().description('Status'),
            description: Joi.any().description('Description'),
            communityId: Joi.any().description('CommunityId'),
        },
        options: {
            allowUnknown: true
        }
    }
}
exports.update = {
    pre: [{
        method: getById,
        assign: 'category'
    }],
    handler: function(request, reply) {
        let category = request.pre.category;
        category = _.extend(category, request.payload);
        let promise = category.save();
        promise.then(function(category) {
            reply(category);
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
            description: Joi.any().description('Description'),
            slug: Joi.string().description('Slug'),
            // identity: Joi.string().required().description('Identity'),
            type: Joi.string().required().description('Type'),
            status: Joi.number().required().description('Status'),
            _id: Joi.string().description('MongoID'),
            image: Joi.any().description('Image'),
            modified: Joi.any().description('Modified'),
            ordering: Joi.any().description('Ordering'),
            communityId: Joi.any().description('CommunityId'),
            //parent: Joi.any().description('Parent'),

        },
        options: {
            allowUnknown: true
        }
    }
}
exports.delete = {
    pre: [{
        method: getById,
        assign: 'category'
    }],
    handler: function(request, reply) {
        const category = request.pre.category;
        Sticker.update({
                category: category._id
            }, {
                $set: {
                    status: 0
                }
            })
            .then(function(result) {
                category.remove((err) => {
                    if (err) {
                        reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                    }
                    return reply(category);
                });
            });
    }
}

/**
 * Middleware
 */
function getById(request, reply) {
    const id = request.params.id || request.payload.id;
    let promise = Category.findOne({
        '_id': id
    });
    promise.then(function(category) {
        reply(category);
    }).catch(function(err) {
        request.log(['error'], err);
        return reply(err);
    })


}