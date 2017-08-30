'use strict';

const UserController = require('./controller/user.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: ['GET'],
        path: '/user',
        config: UserController.getAll,
    });
    server.route({
        method: ['GET'],
        path: '/user/{id}',
        config: UserController.edit,

    });
    server.route({
        method: ['DELETE'],
        path: '/user/{id}',
        config: UserController.delete
    });
    server.route({
        method: 'POST',
        path: '/user',
        config: UserController.save,

    });
    server.route({
        method: 'PUT',
        path: '/user/{id}',
        config: UserController.update,

    });
    server.route({
        method: 'PUT',
        path: '/user/moveToTrash',
        config: UserController.moveToTrash,
    });

    next();
};

exports.register.attributes = {
    name: 'admin-user'
};