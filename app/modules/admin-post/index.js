'use strict';

const PostController = require('./controller/post.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: 'GET',
        path: '/post',
        config: PostController.getAll,
    });
    server.route({
        method: ['GET'],
        path: '/post/{id}',
        config: PostController.edit,

    });
    server.route({
        method: ['DELETE'],
        path: '/post/{id}',
        config: PostController.delete

    });
    server.route({
        method: 'POST',
        path: '/post',
        config: PostController.save,

    });
    server.route({
        method: ['PUT', 'POST'],
        path: '/post/{id}',
        config: PostController.update,

    });

    next();
};

exports.register.attributes = {
    name: 'admin-post'
};
