'use strict';

const fs = require('fs');
const path = require('path');
const Joi = require('joi');
const util = require('util');

const AuthController = require('./controller/auth.controller.js');

exports.register = function(server, options, next) {

    server.route({
        method: 'GET',
        path: '/dang-nhap',
        config: AuthController.viewLogin
    });

    next();
};

exports.register.attributes = {
    name: 'admin-auth'
};