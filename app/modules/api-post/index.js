'use strict';

const PostController = require('./controller/post.controller.js');

exports.register = function(server, options, next) {
    server.route({
        method: 'POST',
        path: '/api/post/getList',
        config: PostController.getList
    });

    server.route({
        method: 'POST',
        path: '/api/post/getDetail',
        config: PostController.getDetail
    });

    server.route({
        method: 'POST',
        path: '/api/post/getImageFromContent',
        config: PostController.getImageFromContent
    });

    server.route({
        method: 'POST',
        path: '/api/post/recommenedPost',
        config: PostController.recommenedPost
    });

    server.route({
        method: 'POST',
        path: '/api/post/create',
        config: PostController.create
    });

    server.route({
        method: 'POST',
        path: '/api/post/update',
        config: PostController.update
    })

    next();
}

exports.register.attributes = {
    name: 'api-post'
}