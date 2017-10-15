'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource', '$window',
    function($resource, $window) {
        return $resource('user/:userId', {
            userId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false
            },
            getUserBid: {
                url: '/user/productBid/:product_id',
                method: 'GET',
                params: {
                    product_id: '@product_id',
                }
            },
            userByComment: {
                url: '/user/userByComment/:product_id',
                method: 'GET',
                params: {
                    product_id: '@product_id',
                }
            },
            userByFavorite: {
                url: '/user/userByFavorite/:product_id',
                method: 'GET',
                params: {
                    product_id: '@product_id',
                }
            },
            moveToTrash: {
                url: '/user/moveToTrash',
                method: 'PUT',
                params: {
                    id: '@id',
                }
            },
            removeVerifyPhone: {
                url: '/user/removeVerifyPhone',
                method: 'PUT',
                params: {
                    id: '@id',
                }
            },
            resetFCC: {
                url: '/user/resetFCC',
                method: 'POST',
                payload: {
                    id: '@id'
                }
            },
            statisticCollect: {
                url: '/user/statisticCollect',
                method: 'GET',
                isArray: false
            },
            collectHistory: {
                url: '/user/collectHistory',
                method: 'POST',
                payload: {
                    user_id: '@user_id',
                    page: '@page',
                }
            },
            productBidHistory: {
                url: '/user/productBidHistory',
                method: 'POST',
                payload: {
                    user_id: '@user_id',
                    page: '@page',
                }
            },
            statistic: {
                url: '/user/Statistic',
                method: 'GET'
            },
            userSeed: {
                url: '/user/getSeed',
                method: 'GET'
            },
            updateFavoritesCache: {
                method: "POST",
                url: $window.settings.services.apiUrl + "/api/favorite/update-favorite-cache",
                payload: {
                    data: '@data'
                }
            },
            confirmSeller: {
                method: "PUT",
                url: "/user/:user_id",
                params: {
                    user_id: '@user_id',
                    name: '@name',
                    checkBtnConfirm: '@checkBtnConfirm'
                }
            }
        });
    }
]);

angular.module('users').factory('SendNotify', ['$resource', '$window',
    function($resource, $window) {
        return $resource($window.settings.services.uploadApi + '/api/user/sendnotifytoseller', null, {
            sendnotifytoseller: {
                method: 'POST',
                params: {
                    name: '@name',
                    email: '@email'
                }
            },
            changesendnotifystatus: {
                url: '/user/change-send-notify-status',
                method: 'PUT',
                params: {
                    id: '@id',
                    is_send_notify: '@is_send_notify'
                }
            }
        });
    }
]);
angular.module('users')
    .service('bzResourceSvc', function($resource) {
        return {
            api: api
        };

        function api(apiName, params, methods) {

            methods = methods || {};
            methods.get = angular.extend({}, methods.get);

            methods.query = angular.extend({
                isArray: true
            }, methods.query);
            methods.save = angular.extend({
                method: 'POST'
            }, methods.save);
            methods.update = angular.extend({
                method: 'PUT'
            }, methods.update);
            methods.upload = angular.extend({
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }, methods.upload);


            var apiString = '';

            if (apiName.indexOf('.json') > -1 || apiName.indexOf('http://') > -1 || apiName.indexOf('https://') > -1) {
                apiString = apiName;
            } else {
                apiString = apiName;
            }

            return $resource(apiString, params, methods);
        }
    })
    .service("PendingSellerSvc", function($rootScope) {
        return {
            openApproveModal: function(user) {
                $rootScope.$broadcast("OPEN_APPROVE_MODAL", {
                    user
                });
            }
        }
    });;