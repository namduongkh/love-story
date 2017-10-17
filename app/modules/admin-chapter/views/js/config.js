'use strict';

ApplicationConfiguration.registerModule('chapters');
// Configuring the Articles module
angular.module('chapters').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        // Menus.addMenuItem('topbar', 'Tập truyện', 'chapters', 'dropdown', '/chapters(/create)?');
        // Menus.addSubMenuItem('topbar', 'chapters', 'Danh sách', 'chapters');
        // Menus.addSubMenuItem('topbar', 'chapters', 'Tập truyện mới', 'chapters/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // chapters state routing
        $stateProvider
            .state('listChapters', {
                url: '/chapters?:postId',
                templateUrl: '/modules/admin-chapter/views/list-chapters.client.view.html'
            })
            .state('createChapter', {
                url: '/chapters/create?:postId',
                templateUrl: '/modules/admin-chapter/views/create-chapter.client.view.html'
            })
            // .state('viewChapter', {
            //     url: '/chapters/:chapterId',
            //     templateUrl: '/modules/admin-chapter/views/view-chapter.client.view.html'
            // })
            .state('editChapter', {
                url: '/chapters/:chapterId/edit?:postId',
                templateUrl: '/modules/admin-chapter/views/edit-chapter.client.view.html'
            });
    }
]);