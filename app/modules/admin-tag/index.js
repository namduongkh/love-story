'use strict';

const TagController = require('./controller/tag.controller.js');

exports.register = function(server, options, next) {

    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: 'GET',
        path: '/tag',
        config: TagController.getAll,
    });
    server.route({
        method: ['GET'],
        path: '/tag/{id}',
        config: TagController.edit,
    });

    server.route({
        method: ['GET'],
        path: '/tag/{identity}/identity',
        config: TagController.getByIdentity,
    });
    server.route({
        method: 'GET',
        path: '/tag/getList',
        config: TagController.getList,
    });
    server.route({
        method: ['DELETE'],
        path: '/tag/{id}',
        config: TagController.delete

    });
    server.route({
        method: 'POST',
        path: '/tag',
        config: TagController.save,

    });
    server.route({
        method: ['PUT'],
        path: '/tag/{id}',
        config: TagController.update,

    });
    next();
};

exports.register.attributes = {
    name: 'admin-tag'
}