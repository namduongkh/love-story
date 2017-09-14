'use strict';


angular.module('core').controller('HomeController', ['$scope', '$location', 'Authentication',
    function($scope, $location, Authentication) {
        // This provides Authentication context.
        $scope.authentication = Authentication;

        $scope.checkAuth = function() {
            if (!Authentication.user.name) {
                $location.path('signin');
            }
        }
    }
]);
