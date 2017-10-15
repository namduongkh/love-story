'use strict';

//Posts service used to communicate Posts REST endpoints
angular.module('posts').factory('Posts', ['$resource',
    function($resource) {
        return $resource('post/:postId', {
            postId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false
            }
        });
    }
]);
angular.module('posts')
    .service("PostSvc", function($window, $http) {
        return {
            uploadPostContentImage: function(data) {
                return $http.post($window.settings.services.apiUrl + '/api/upload/uploadPostContentImage', data);
            },
            getImageFromContent: function(data) {
                return $http.post($window.settings.services.apiUrl + '/api/post/getImageFromContent', data);
            }
        }
    });