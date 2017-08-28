'use strict';
const tagController = require('./controller/tag.controller.js');

exports.register = function(server, options, next) {

    server.route({
        method: 'POST',
        path: '/api/tag/getAll',
        config: tagController.getAll
    });
    server.route({
        method: 'GET',
        path: '/api/tag/listOnBoard',
        config: tagController.listOnBoard
    });

    server.route({
        method: 'POST',
        path: '/api/tag/listTagByCommunityId',
        config: tagController.listTagByCommunityId
    });

    server.route({
        method: 'POST',
        path: '/api/tag/createTag',
        config: tagController.createTag
    });

    server.route({
        method: 'POST',
        path: '/api/tag/get-list-tag',
        config: tagController.listAllTag
    });

    server.route({
        method: 'POST',
        path: '/api/tag/getTagById',
        config: tagController.getTagById
    });
    server.route({
        method: 'POST',
        path: '/api/tag/getTagBySlug',
        config: tagController.getTagBySlug
    });

    next();
};

exports.register.attributes = {
    name: 'api-tag'
}