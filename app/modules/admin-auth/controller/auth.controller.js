'use strict';


exports.viewLogin = {
    handler: function(request, reply) {
        // console.log("request auth /dang-nhap", request.auth.credentials);
        if (request.auth.isAuthenticated && request.auth.credentials.scope && request.auth.credentials.scope.includes('admin')) {
            return reply.redirect('/');
        }
        return reply.view('admin-auth/views/signin', null, { layout: 'admin/layout-admin-login' });
        // return reply.redirect(request.server.configManager.get("web.context.settings.services.webUrl") + '/dang-nhap');
    },
}