'use strict';

const UserController = require('./controller/user.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    server.route({
        method: ['GET'],
        path: '/user',
        config: UserController.getAll,
    });

    server.route({
        method: ['GET'],
        path: '/user/statisticCollect',
        config: UserController.statisticCollect,
    });

    server.route({
        method: ['POST'],
        path: '/user/collectHistory',
        config: UserController.collectHistory,
    });

    server.route({
        method: ['POST'],
        path: '/user/productBidHistory',
        config: UserController.productBidHistory,
    });

    server.route({
        method: ['GET'],
        path: '/user/{id}',
        config: UserController.edit,

    });
    server.route({
        method: ['GET'],
        path: '/user/getSeed',
        config: UserController.getSeed,

    });
    server.route({
        method: ['GET'],
        path: '/user/change-status/{id}/{status}',
        config: UserController.changeStatus

    });
    server.route({
        method: ['DELETE'],
        path: '/user/{id}',
        config: UserController.delete
    });
    server.route({
        method: 'POST',
        path: '/user',
        config: UserController.save,

    });
    server.route({
        method: 'POST',
        path: '/user/report',
        config: UserController.report,
    });
    server.route({
        method: 'POST',
        path: '/user/beautiReport',
        config: UserController.beautiReport,
    });

    server.route({
        method: 'POST',
        path: '/user/verify2fa',
        config: UserController.verify2fa,
    });

    server.route({
        method: 'PUT',
        path: '/user/{id}',
        config: UserController.update,

    });

    server.route({
        method: 'PUT',
        path: '/user/moveToTrash',
        config: UserController.moveToTrash,
    });

    server.route({
        method: 'PUT',
        path: '/user/removeVerifyPhone',
        config: UserController.removeVerifyPhone,
    });

    server.route({
        method: 'PUT',
        path: '/user/change-send-notify-status',
        config: UserController.changeSendNotifyStatus,
    });

    server.route({
        method: 'GET',
        path: '/user/productBid/{product_id}',
        config: UserController.productBid,
    });

    server.route({
        method: 'GET',
        path: '/user/userByComment/{product_id}',
        config: UserController.userByComment,
    });

    server.route({
        method: 'GET',
        path: '/user/userByFavorite/{product_id}',
        config: UserController.userByFavorite,
    });

    server.route({
        method: 'POST',
        path: '/user/resetFCC',
        config: UserController.resetFCC,
    });
    server.route({
        method: 'GET',
        path: '/user/Statistic',
        config: UserController.getAllStatistic,
    });

    next();
};

exports.register.attributes = {
    name: 'admin-user'
};