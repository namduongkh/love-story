'use strict';

//Categories service used to communicate Categories REST endpoints
angular.module('categories').factory('Categories', ['$resource',
    function ($resource) {
        return $resource('category/:categoryId', {
            categoryId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false,
            },
            getByIdentity: {
                method: 'GET',
                url: '/category/:identity/identity',
                params: {
                    identity: '@identity'
                }
            },
        });
    }
]);