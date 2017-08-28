'use strict';

//Caches service used to communicate Caches REST endpoints
angular.module('caches').factory('Caches', ['$resource',
    function($resource) {
        return $resource('cache/:cacheId', {
            cacheId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false,
            },
            removeAll: {
                url: '/cache/removeAll',
                method: 'PUT'
            }
        });
    }
]);