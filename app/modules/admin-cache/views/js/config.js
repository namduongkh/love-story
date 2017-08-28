'use strict';

ApplicationConfiguration.registerModule('caches');
// Configuring the Articles module
angular.module('caches').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Cache', 'caches', 'dropdown', '/caches(/create)?');
        Menus.addSubMenuItem('topbar', 'caches', 'Danh sách', 'caches');
        // Menus.addSubMenuItem('topbar', 'caches', 'New cache', 'caches/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // caches state routing
        $stateProvider.
        state('listCaches', {
            url: '/caches',
            templateUrl: '/modules/admin-cache/views/list-caches.client.view.html'
        });
    }
]);