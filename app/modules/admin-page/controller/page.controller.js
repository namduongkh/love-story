'use strict';

const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const mongoose = require('mongoose');
const Page = mongoose.model('Page');
const _ = require('lodash');


exports.getAll = {
    handler: function(request, reply) {
        let page = request.query.page || 1;
        let config = request.server.configManager;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');

        let options = {};
        if (request.query.keyword && request.query.keyword.length > 0) {
            let re = new RegExp(request.query.keyword, 'i');
            options.title = re;
        }
        Page.find(options).sort('id').paginate(page, itemsPerPage, function(err, items, total) {
            if (err) {
                request.log(['error', 'list', 'page'], err);
                reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            }
            let totalPage = Math.ceil(total / itemsPerPage);
            let dataRes = {
                status: '1',
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
};

exports.edit = {
    pre: [{
        method: getById,
        assign: 'page'
    }],
    handler: function(request, reply) {
        const page = request.pre.page;
        if (page) {
            return reply(page);
        } else {
            reply(Boom.notFound('Page is not found'));
        }
    }
};

exports.save = {
    handler: function(request, reply) {
        let page = new Page({
            title: request.payload.title,
            intro: request.payload.intro,
            identity: request.payload.identity,
            content: request.payload.content
        });
        console.log(page);
        page.save().then(page => {

            reply(page);

        }).catch(err => {
            request.log(['error', 'page'], err);
            reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        })

    },
    description: 'Created page',
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
            title: Joi.string().required().description('Title'),
            //slug: Joi.string().description('Slug'),
            intro: Joi.string().description('Intro'),
            identity: Joi.string().required().description('Identity'),
            content: Joi.string().required().description('Content')
        }
    }
};

exports.update = {
    pre: [{
        method: getById,
        assign: 'page'
    }],
    handler: function(request, reply) {
        // var {
        //     mongoCache
        // } = request.server.plugins['web-core'];
        let page = request.pre.page;
        delete request.payload.id;
        delete request.payload._id;
        delete request.payload.__v;
        delete request.payload.created;

        var identity = page.identity;
        page = _.extend(page, request.payload);
        let promise = page.save();
        promise.then(function(page) {
            // mongoCache.directDelete(`Page:${identity}`);
            reply(page);
        }).catch(function(err) {
            reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        });
    },
    description: 'Update page',
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
            title: Joi.string().required().description('Title'),
            content: Joi.string().required().description('Content'),
            //slug: Joi.string().required().description('Slug'),
            intro: Joi.string().required().description('Intro'),
            modified: Joi.date().required().description('Modified'),
            identity: Joi.string().required().description('identity'),
            _id: Joi.string().required().description('MongoID')

        }
    }
};

exports.delete = {
    pre: [{
        method: getById,
        assign: 'page'
    }],
    auth: false,
    handler: function(request, reply) {
        const page = request.pre.page;
        page.remove((err) => {
            if (err) {
                reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            }
            return reply(page);
        });
    }
};

/**
 * Middleware
 */
function getById(request, reply) {
    const id = request.params.id || request.payload.id;
    let promise = Page.findOne({
        '_id': id
    });
    promise.then(function(page) {
        reply(page);
    }).catch(function(err) {
        request.log(['error'], err);
        return reply.continue();
    })


}