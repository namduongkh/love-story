'use strict';

const DashboardController = require('./controller/dashboard.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];

    server.route({
        method: 'GET',
        path: '/',
        config: DashboardController.index,
    });

    next();
};

exports.register.attributes = {
    name: 'admin-dashboard'
};