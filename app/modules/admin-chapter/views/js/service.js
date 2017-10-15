'use strict';

//Chapters service used to communicate Chapters REST endpoints
angular.module('chapters').factory('Chapters', ['$resource',
    function($resource) {
        return $resource('chapter/:chapterId', {
            chapterId: '@_id'
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
angular.module('chapters')
    .service("ChapterSvc", function($window, $http) {
        return {
            uploadChapterContentImage: function(data) {
                return $http.chapter($window.settings.services.apiUrl + '/api/upload/uploadChapterContentImage', data);
            },
            getImageFromContent: function(data) {
                return $http.chapter($window.settings.services.apiUrl + '/api/chapter/getImageFromContent', data);
            }
        }
    });