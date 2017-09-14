'use strict';

const _ = require('lodash');
const JWT = require('jsonwebtoken');
// const aguid = require('aguid');


exports.getCredentials = function(request, reply) {
    // Get the response object
    let response = request.response;
    // Check to see if the response is a view
    if (response.variety === 'view') {
        if (_.isEmpty(response.source.context)) {
            response.source.context = {};
        }
        if (_.isEmpty(response.source.context.credentials)) {
            response.source.context.credentials = {};
        }
        response.source.context.credentials = request.auth.credentials;
    }
    reply.continue();

}

// exports.createGuestToken = function(request, reply) {
//     let response = request.response;
//     // Check to see if the response is a view
//     if (response.variety === 'view') {
//         var configManager = request.server.configManager;
//         let cookieOptions = configManager.get('web.cookieOptions');
//         let credentials = request.auth.credentials;
//         let authToken = request.auth.token;
//         if (!authToken) {
//             var session = {
//                 valid: true,
//                 id: aguid(), //a random session id,
//                 uid: '', //user id
//                 name: 'guest',
//                 scope: ['guest'],
//                 exp: new Date().getTime() + 30 * 60 * 1000
//             };
//             const redisClient = request.server.redis;
//             const secret = configManager.get('web.jwt.secret');
//             redisClient.set(session.id, JSON.stringify(session));
//             var token = JWT.sign(session, secret);
//             reply().state("token", token, cookieOptions);
//         }
//     }

//     reply.continue();

// }

exports.getMeta = function(request, reply) {
    let response = request.response;
    if (response.variety === 'view') {
        let config = request.server.configManager;
        let app = config.get('web.context.app');
        if (response.source.context.meta && response.source.context.meta.title) {

            if (response.source.context.meta.title) {
                response.source.context.meta.title = response.source.context.meta.title + ' - ' + app.title
            }
        } else {
            response.source.context.meta = app
        }
    }
    reply.continue();
}

exports.handleError = function(request, reply) {
    const response = request.response;
    if (!response.isBoom) {
        return reply.continue();
    }
    let config = request.server.configManager;
    // let loginUrl = config.get('web.error.web.login');

    let loginUrl = config.get("web.context.settings.services.webUrl") + config.get('web.error.web.login');

    const error = response;
    const statusCode = error.output.statusCode;

    // console.log("Status code", statusCode);

    if (statusCode === 404) {
        request.log(['error', 'notfound'], 'Resources is not be found');
        // return reply.redirect(notFoundUrl);
        return reply("Không tìm thấy nội dung.");
    } else if (statusCode === 403 || statusCode === 401) {
        request.log(['error', 'permission'], 'You have not permission to access this page');
        // if (statusCode === 403) {
        //     return reply.redirect(config.get("web.context.settings.services.webUrl"));
        // }
        // console.log("admin");
        return reply.redirect(loginUrl);
    } else {
        return reply.continue();
    }


};