'use strict';

const CacheController = require('./controller/cache.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: 'GET',
        path: '/cache',
        config: CacheController.getAll,
    });
    server.route({
        method: ['GET'],
        path: '/cache/{id}',
        config: CacheController.edit,

    });
    server.route({
        method: ['DELETE'],
        path: '/cache/{id}',
        config: CacheController.delete

    });
    server.route({
        method: 'POST',
        path: '/cache',
        config: CacheController.save,

    });
    server.route({
        method: ['PUT'],
        path: '/cache/{id}',
        config: CacheController.update,
    });
    server.route({
        method: ['PUT'],
        path: '/cache/removeAll',
        config: CacheController.removeAll,
    });
    next();
};

exports.register.attributes = {
    name: 'admin-cache'
};