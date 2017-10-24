'use strict';

const ChapterController = require('./controller/chapter.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: 'GET',
        path: '/chapter',
        config: ChapterController.getAll,
    });
    server.route({
        method: ['GET'],
        path: '/chapter/{id}',
        config: ChapterController.edit,

    });
    server.route({
        method: ['DELETE'],
        path: '/chapter/{id}',
        config: ChapterController.delete

    });
    server.route({
        method: 'POST',
        path: '/chapter',
        config: ChapterController.save,
    });
    server.route({
        method: 'POST',
        path: '/chapter/changeOrder',
        config: ChapterController.changeOrder,
    });
    server.route({
        method: ['PUT', 'POST'],
        path: '/chapter/{id}',
        config: ChapterController.update,
    });

    next();
};

exports.register.attributes = {
    name: 'admin-chapter'
};