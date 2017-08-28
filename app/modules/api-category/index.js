'use strict';

const CategoryController = require('./controller/category.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: ['GET', 'POST'],
        path: '/api/category',
        config: CategoryController.getAll,
    });

    next();
};

exports.register.attributes = {
    name: 'api-category'
};