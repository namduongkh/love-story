'use strict';

angular.module('auth').controller('AuthenticationController', ['$scope', '$http', '$location', '$window', 'Authentication', '$cookies',
    function($scope, $http, $location, $window, Authentication, $cookies) {
        $scope.authentication = Authentication;
        $scope.webUrl = $window.settings.services.webUrl;

        $scope.signin = function() {
            $scope.isSubmit = true;
            var data = $scope.credentials;
            data.scope = 'admin';
            $http.post($window.settings.services.apiUrl + '/api/user/login', data).then(function(response) {
                if (response.status == 200) {
                    response = response.data;
                    if (response.token) {
                        $window.location.href = '/';
                    }
                    $scope.error = response.message;
                }

            }).catch(function(response) {
                $scope.error = response.message;
            });
        };

        $scope.signout = function() {
            $http.get($window.settings.services.apiUrl + '/api/user/logout').then(function(response) {
                if (response.status == 200) {
                    response = response.data;
                    $scope.authentication.user = '';
                    $cookies.remove('token');
                    $window.location.href = '/';
                }
            }).catch(function(response) {
                $scope.error = response.message;
            });
        };
    }
]);