'use strict';

ApplicationConfiguration.registerModule('users');

angular.module('users').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Người dùng', 'users', 'dropdown', '/users(/create)?');
        Menus.addSubMenuItem('topbar', 'users', 'Danh sách', 'users');
        Menus.addSubMenuItem('topbar', 'users', 'Người dùng mới', 'users/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // Users state routing
        $stateProvider
            .state('listUsers', {
                url: '/users',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('listPendingSeller', {
                url: '/users/list-pending?pending_seller',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('customListUsers', {
                url: '/users/list-:listName?socialSource?role',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('listFilterUsers', {
                url: '/users?socialSource?role',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('createUser', {
                url: '/users/create',
                templateUrl: '/modules/admin-user/views/create-user.client.view.html'
            })
            .state('reportUser', {
                url: '/users/reportUser',
                templateUrl: '/modules/admin-user/views/report-user.view.html'
            })
            // state('statisticCollect', {
            //     url: '/users/statisticCollect',
            //     templateUrl: '/modules/admin-user/views/statistic-collect-users.client.view.html'
            // })
            .state('viewProfile', {
                url: '/users/:userId/profile',
                templateUrl: '/modules/admin-user/views/profile.client.view.html'
            })
            .state('viewUser', {
                url: '/users/:userId',
                templateUrl: '/modules/admin-user/views/view-user.client.view.html'
            })
            .state('collectHistory', {
                url: '/users/:userId/collectHistory',
                templateUrl: '/modules/admin-user/views/list-collect-history.client.view.html'
            })
            .state('productBidHistory', {
                url: '/users/:userId/productBidHistory',
                templateUrl: '/modules/admin-user/views/list-product-bid-history.client.view.html'
            })
            .state('editUser', {
                url: '/users/:userId/edit',
                templateUrl: '/modules/admin-user/views/edit-user.client.view.html'
            });
    }
]);