exports.index = {
    auth: {
        strategy: 'jwt',
        mode: 'try',
        scope: ['admin']
    },
    handler: function(request, reply) {
        if (!request.auth.credentials || !request.auth.credentials.scope.includes('admin')) {
            console.log("Đăng nhập");
            return reply.redirect(request.server.configManager.get("web.context.settings.services.webUrl") + '/dang-nhap');
        }
        return reply.view('admin-dashboard/views/default', {}, { layout: 'admin/layout-admin' });
    },
}