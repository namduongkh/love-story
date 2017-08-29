(function() {
    'use strict';

    angular.module('users').directive('renderSelect', function($rootScope, $compile, $timeout) {
        // var html;
        // var renderSlider = function() {
        //     return '<select ui-select2 class="form-control" name="roles" data-ng-model="user.roles" id="roles" ng-options="item.value as item.name for item in userRoles" required multiple="multiple" size="2"></select>';
        // }
        return {
            restrict: 'A',
            link: function(scope, elem, attr) {
                var html = elem.html();
                // elem.empty();
                scope.$watch(attr.renderSelect, function(value) {
                    if (value) {
                        $timeout(function() {
                            // elem.empty();
                            var markup = $compile(html)(scope);
                            elem.html(markup);
                        });
                    }
                });
            }
        }
    });
})();