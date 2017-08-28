'use strict';

ApplicationConfiguration.registerModule('posts');
// Configuring the Articles module
angular.module('posts').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Chia sẻ & thảo luận', 'posts', 'dropdown', '/posts(/create)?');
        Menus.addSubMenuItem('topbar', 'posts', 'Danh sách bài viết', 'posts');
        // Menus.addSubMenuItem('topbar', 'posts', 'New Post', 'posts/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // posts state routing
        $stateProvider.
        state('listPosts', {
            url: '/posts',
            templateUrl: '/modules/admin-post/views/list-posts.client.view.html'
        }).
        state('createPost', {
            url: '/posts/create',
            templateUrl: '/modules/admin-post/views/create-post.client.view.html'
        }).
        state('viewPost', {
            url: '/posts/:postId',
            templateUrl: '/modules/admin-post/views/view-post.client.view.html'
        }).
        state('editPost', {
            url: '/posts/:postId/edit',
            templateUrl: '/modules/admin-post/views/edit-post.client.view.html'
        });
    }
]);