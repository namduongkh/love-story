'use strict';

const ChapterController = require('./controller/chapter.controller.js');

exports.register = function(server, options, next) {
    // server.route({
    //     method: 'POST',
    //     path: '/api/post/getList',
    //     config: ChapterController.getList
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/post/getDetail',
    //     config: ChapterController.getDetail
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/post/getImageFromContent',
    //     config: ChapterController.getImageFromContent
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/post/recommenedPost',
    //     config: ChapterController.recommenedPost
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/post/create',
    //     config: ChapterController.create
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/post/update',
    //     config: ChapterController.update
    // })

    next();
}

exports.register.attributes = {
    name: 'api-chapter'
}