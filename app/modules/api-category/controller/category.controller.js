'use strict';

const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const mongoose = require('mongoose');
const Category = mongoose.model('Category');
const ErrorHandler = require(BASE_PATH + '/app/utils/error.js');
const _ = require('lodash');


exports.getAll = {
    handler: function(request, reply) {
        let options = request.payload || request.query;
        Category
            .find(options)
            .lean()
            .then(function(result) {
                return reply(result);
            });
    }
};