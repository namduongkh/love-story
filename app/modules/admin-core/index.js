'use strict';
const CoreController = require('./controller/core.controller.js');

exports.register = function(server, options, next) {

    // server.route({
    //     method: 'GET',
    //     path: '/error404',
    //     config: {
    //         handler: function(request, reply) {
    //             reply.view('admin-core/view/404', { meta: { title: 'Page Not Found' } }, { layout: 'admin/layout-admin-login' });
    //         }
    //     }
    // });

    // server.ext('onPostHandler', CoreController.createGuestToken);
    server.ext('onPostHandler', CoreController.getCredentials);
    server.ext('onPreResponse', CoreController.handleError);


    next();
};
exports.register.attributes = {
    name: 'admin-core'
};