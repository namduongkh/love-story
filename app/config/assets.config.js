module.exports = {
    admin: {
        js: {
            build: [
                '/libs/jquery/dist/jquery.min.js',
                '/libs/bootstrap/dist/js/bootstrap.min.js',
                '/libs/AdminLTE/dist/js/app.min.js',
                '/libs/angular-resource/angular-resource.js',
                '/libs/angular-cookies/angular-cookies.min.js',
                '/libs/angular-local-storage/dist/angular-local-storage.min.js',
                '/libs/angular-sanitize/angular-sanitize.min.js',
                '/libs/angular-messages/angular-messages.min.js',
                '/libs/ng-file-upload/ng-file-upload.min.js',
                // '/libs/select2/select2.min.js',
                // '/libs/AdminLTE/plugins/select2/select2.min.js',
                // '/libs/angular-ui-select2/src/select2.js',
                '/assets/js/app-admin.js',
            ],
            noaction: [
                '/libs/tinymce/tinymce.min.js',
                '/libs/angular-ui-tinymce/dist/tinymce.min.js',
                '/libs/slug/slug.js'
            ],
            concat: [
                '/libs/angular/angular.min.js',
                '/libs/angular-ui-router/release/angular-ui-router.js',
            ]
        },
        css: [
            '/libs/bootstrap/dist/css/bootstrap.min.css',
            '/libs/font-awesome/css/font-awesome.min.css',
            '/libs/Ionicons/css/ionicons.min.css',
            '/libs/AdminLTE/dist/css/AdminLTE.min.css',
            '/libs/AdminLTE/plugins/datatables/dataTables.bootstrap.css',
            '/libs/AdminLTE/dist/css/skins/skin-blue.min.css',
            // '/libs/select2/select2-bootstrap.css',
            // '/libs/AdminLTE/plugins/select2/select2.min.css',
            '/assets/css/styles-admin.css',
        ]
    }
};