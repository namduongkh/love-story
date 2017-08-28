'use strict';

ApplicationConfiguration.registerModule('pages');
// Configuring the Articles module
angular.module('pages').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Trang', 'pages', 'dropdown', '/pages(/create)?');
        Menus.addSubMenuItem('topbar', 'pages', 'Danh sách', 'pages');
        Menus.addSubMenuItem('topbar', 'pages', 'Tạo mới', 'pages/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {

        // Pages state routing
        $stateProvider.
        state('listPages', {
            url: '/pages',
            templateUrl: '/modules/admin-page/views/list-pages.client.view.html'
        }).
        state('createPage', {
            url: '/pages/create',
            templateUrl: '/modules/admin-page/views/create-page.client.view.html'
        }).
        state('viewPage', {
            url: '/pages/:pageId',
            templateUrl: '/modules/admin-page/views/view-page.client.view.html'
        }).
        state('editPage', {
            url: '/pages/:pageId/edit',
            templateUrl: '/modules/admin-page/views/edit-page.client.view.html'
        });
    }
]);