'use strict';

angular.module('auth').factory('Authentication', ['$window', function($window) {
	var auth = {
		user: $window.user
	};
	return auth;
}]);
