'use strict'

const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const Path = require('path');
const Pack = require(global.BASE_PATH + '/package');
const Glob = require("glob");
const HapiSwagger = require('hapi-swagger');

module.exports = function(server) {

    server.register([{
            register: require('inert')
        },
        {
            register: require('vision')
        },
        {
            register: HapiSwagger,
            options: {
                info: {
                    'title': 'Documentation',
                    'version': Pack.version,
                }
            }
        },
        {
            register: require('../lib/mongo.js')
        },
        {
            register: require('../lib/auth.js')
        },
        {
            register: require('../lib/static.js')
        },
    ], (err) => {
        const config = server.configManager;

        // Cài đặt template engine: Đang sử dụng handlebars
        server.views({
            engines: {
                html: require('handlebars'),
            },
            helpersPath: global.BASE_PATH + '/app/views/helpers',
            relativeTo: global.BASE_PATH + '/app/modules',
            partialsPath: global.BASE_PATH + '/app/views/layouts',
            layoutPath: global.BASE_PATH + '/app/views/layouts',
            layout: function() {
                return 'admin/layout';
            }(),
            context: config.get("web.context")
        });

        //autoload models
        let models = Glob.sync(BASE_PATH + "/app/modules/*/model/*.js");
        models.forEach((item) => {
            require(Path.resolve(item));
        });

        //autoload modules
        let modules = [];
        let modulesName = Glob.sync(BASE_PATH + `/app/modules/*/index.js`);
        modulesName.forEach((item) => {
            modules.push(require(Path.resolve(`${item}`)));
        });
        if (modules.length) {
            server.register(modules, {}, (err) => {
                if (err) {
                    server.log(['error', 'server'], err);
                }
            });
        }

    });
};