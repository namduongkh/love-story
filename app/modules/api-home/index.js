'use strict';

const HomeController = require("./controller/home.controller.js")

exports.register = function(server, options, next) {

    server.route({
        method: 'GET',
        path: '/api',
        config: HomeController.home
    });

    return next();
};

exports.register.attributes = {
    name: 'api-home',
};