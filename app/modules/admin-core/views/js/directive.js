'use strict'

angular.module('core').directive('noticeDir', ['Notice', '$rootScope', function(Notice, $rootScope) {
    var renderNotice = function(message, type) {
        if (type == Notice.ERROR) {
            return '<div class="alert alert-danger alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h4><i class="icon fa fa-exclamation-triangle"></i> Error!</h4><div>' + message + '</div></div>';
        } else if (type == Notice.INFO) {
            return '<div class="alert alert-info alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h4><i class="icon fa fa-info"></i> Infomation!</h4><div>' + message + '</div></div>';
        }
        return '<div class="alert alert-success alert-dismissable"><button type="button" class="close" data-dismiss="alert" aria-hidden="true">×</button><h4><i class="icon fa fa-check"></i> Success!</h4><div>' + message + '</div></div>'
    };

    return {
        restrict: "E",
        template: function(elem, attr) {
            var notice = Notice.getNotice();
            // $("html body").click(function() {
            //     elem.empty();
            // });

            $rootScope.$on("CLEAR_NOTICE", function() {
                elem.empty();
            });

            $rootScope.$on("requireChange", function() {
                notice = Notice.getNotice();
                // console.log('directive', notice);
                if (notice.type == Notice.ERROR) {
                    elem.html(renderNotice(notice.message, Notice.ERROR));
                } else if (notice.type == Notice.INFO) {
                    elem.html(renderNotice(notice.message, Notice.INFO));
                } else {
                    elem.html(renderNotice(notice.message, Notice.SUCCESS));
                }
            });

            if (notice == "") return;
            // console.log("Notice:", notice);
            if (notice.type == Notice.ERROR) {
                return renderNotice(notice.message, Notice.ERROR);
            } else if (notice.type == Notice.INFO) {
                return renderNotice(notice.message, Notice.INFO);
            }
            return renderNotice(notice.message, Notice.SUCCESS);
        }
    };

}]);

angular.module('core').directive('errorMessage', function() {
    return {
        restrict: 'E',
        template: function(elem, attr) {
            var requireMsg = attr.requireMsg || "You did not enter a field";
            var minlengthMsg = attr.minlength ? `You should enter longer than ${attr.minlength - 1} characters` : "You should enter longer in this field";
            var maxlengthMsg = attr.maxlength ? `You should enter shorter than ${attr.maxlength + 1} characters` : "You should enter shorter in this field";
            return '<div ng-message="required">' + requireMsg + '</div>' +
                '<div ng-message="email">You did not enter a email format</div>' +
                '<div ng-message="pattern">You did not enter a right pattern</div>' +
                '<div ng-message="number">You did not enter a number</div>' +
                '<div ng-message="min">You should enter bigger value</div>' +
                '<div ng-message="max">You should enter smaller value</div>' +
                '<div ng-message="minlength">' + minlengthMsg + '</div>' +
                '<div ng-message="maxlength">' + maxlengthMsg + '</div>';
        }
    };
});

angular.module('core')
    .directive('ngLoading', function() {

        var loadingSpinner = '<div id="preview-area">' +
            '<div class="spinner">' +
            '<div class="double-bounce1"></div>' +
            '<div class="double-bounce2"></div>' +
            '</div>' +
            '</div>' +
            '<div class="mfp-bg bzFromTop mfp-ready"></div>';

        return {
            restrict: 'AE',
            link: function(scope, element, attrs) {
                scope.$watch(attrs.loadingDone, function(val) {
                    if (val) {
                        element.html(loadingSpinner);
                    } else {
                        element.html('');
                    }
                });
            }
        };
    });

angular.module('core')
    .directive('slugGenerator', function($timeout) {
        return {
            restrict: 'A',
            scope: {
                slugGenerator: "=",
                ngModel: "="
            },
            link: function(scope, element, attrs) {
                var timer;
                scope.$watch("slugGenerator", function(value) {
                    if (value) {
                        $timeout.cancel(timer);
                        timer = $timeout(function() {
                            scope.$applyAsync(function() {
                                scope.ngModel = slug(value, {
                                    lower: true, // result in lower case 
                                });
                            });
                        }, 150);
                    } else {
                        scope.$applyAsync(function() {
                            scope.ngModel = null;
                        });
                    }
                });
            }
        };
    });

// angular.module('core').directive('renderSelect', function($rootScope, $compile, $timeout) {
//     // var html;
//     // var renderSlider = function() {
//     //     return '<select ui-select2 class="form-control" name="roles" data-ng-model="user.roles" id="roles" ng-options="item.value as item.name for item in userRoles" required multiple="multiple" size="2"></select>';
//     // }
//     return {
//         restrict: 'A',
//         link: function(scope, elem, attr) {
//             var html = elem.html();
//             // elem.empty();
//             scope.$watch(attr.renderSelect, function(value) {
//                 if (value) {
//                     $timeout(function() {
//                         // elem.empty();
//                         var markup = $compile(html)(scope);
//                         elem.html(markup);
//                     });
//                 }
//             });
//         }
//     }
// });

angular.module('core')
    .directive('handleSelectMultiple', function() {
        return {
            restrict: 'A',
            scope: {
                // handleList: '@', // in view add attribute normal-variable="<$scope.normal['define in controller']>"
                handleList: '=', // in view add attribute object-variable="<$scope.object['define in controller']>"
                // functionVariable: '&', // in view add attribute function-variable="<$scope.function['define in controller']>"
            },
            require: 'ngModel',
            link: function(scope, element, attrs, ngModel) {
                // element.on('select2:select',function(e) {
                //     console.log('select2:select: ', e);
                //     console.log('Value: ', element.val());
                // });

                function updateView(value) {
                    // ngModel.$viewValue = value;
                    ngModel.$render();
                }

                function pushValue(value) {
                    ngModel.$modelValue.push(value);
                    // scope.ngModel = value; // overwrites ngModel value
                }

                element.on('change', function(e) {
                    // console.log('change: ', e);
                    // console.log(attrs, scope.handleList);
                    // console.log('Value: ', element.val()[0]);

                    var value = element.val();

                    for (var i = 0; i < value.length; i++) {
                        value[i].split(':').length == 2 ?
                            value[i] = value[i].split(':')[1] : value[i] = value[i].split(':')[0]

                        // console.log(value[i]);

                        if (ngModel.$modelValue.indexOf(value[i]) == -1) {
                            pushValue(value[i]);
                            updateView(value[i]);
                        }
                    }

                    // console.log('ngModel', ngModel.$modelValue);
                });
            }
        }
    });