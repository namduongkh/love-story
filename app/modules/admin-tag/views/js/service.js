'use strict';

//Tags service used to communicate Categories REST endpoints
angular.module('tag').factory('Tags', ['$resource', '$window',
    function($resource, $window) {
        return $resource('tag/:tagId', {
            tagId: '@_id'
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
            convertCountTag: {
                method: "POST",
                url: $window.settings.services.userApi + "/api/action/convertCountTag",
            },
            getList: {
                method: "GET",
                url: "/tag/getList",
            }
        })
    }
])