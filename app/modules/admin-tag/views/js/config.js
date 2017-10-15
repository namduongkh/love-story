'use strict';

ApplicationConfiguration.registerModule('tag');

angular.module('tag').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Nhãn', 'tag', 'dropdown', '/tags(/create)?');
        Menus.addSubMenuItem('topbar', 'tag', 'Danh sách', 'tags');
        Menus.addSubMenuItem('topbar', 'tag', 'Nhãn mới', 'tags/create');
        // Menus.addSubMenuItem('topbar', 'tag', 'Update Count', 'tags/update-count');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // Tags state routing
        $stateProvider
            .state('listTag', {
                url: '/tags',
                templateUrl: '/modules/admin-tag/views/list-tags.client.view.html'
            })
            .state('createTag', {
                url: '/tags/create',
                templateUrl: '/modules/admin-tag/views/create-tag.client.view.html'
            })
            .state('updateCountTag', {
                url: '/tags/update-count',
                templateUrl: '/modules/admin-tag/views/update-count-tag.client.view.html'
            })
            .state('viewTag', {
                url: '/tags/:tagId',
                templateUrl: '/modules/admin-tag/views/view-tag.client.view.html'
            })
            .state('editTag', {
                url: '/tags/:tagId/edit',
                templateUrl: '/modules/admin-tag/views/edit-tag.client.view.html'
            });

    }
]);