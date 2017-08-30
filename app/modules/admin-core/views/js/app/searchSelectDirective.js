(function() {
    'use strict';



    angular
        .module('core')
        .service('SearchSelectSvc', function($rootScope) {
            return {
                updateNgModel: function(data) {
                    $rootScope.$broadcast("UPDATE_NG_MODEL", data);
                }
            }
        });


    angular
        .module('core')
        .directive('searchSelect', function($compile, $timeout, $rootScope) {
            function render() {
                return '\
                <div class="search-select" ng-class="class" style="{{style}}">\
                    <div style="{{panelStyle}}" class="selected-panel" ng-if="selectItem && selectItem.length">\
                        <div class="selected-item" ng-repeat="item in selectItem track by $index" ng-click="$deSelectItem(item, $index)">\
                            <i class="glyphicon glyphicon-trash"></i>\
                            <span ng-bind="item[itemShowLabel]"></span>\
                        </div>\
                    </div>\
                    <input ng-if="showInput" placeholder="{{placeholder}}" ng-class="inputClass" ng-model="$search_input" ng-change="$changeInputSearch($search_input)" ng-focus="$searchInputFocus($search_input)" ng-blur="$searchInputBlur()"/>\
                    <div class="select-data" ng-if="$showSelectData">\
                        <div class="select-data-panel">\
                            <div ng-if="selectData && selectData.length && !$hasExist(item)" class="select-data-item" ng-repeat="item in selectData track by $index" ng-bind="item[itemShowLabel]" ng-click="$selectItem(item, $index)"></div>\
                            <div ng-if="!selectData || !selectData.length" class="select-data-item">No sult. Enter keyword!</div>\
                        </div>\
                    </div>\
                </div>';
            }

            return {
                restrict: "AE",
                require: "ngModel",
                replace: true,
                transclude: true,
                scope: {
                    itemShowLabel: "@",
                    itemShowValue: "@",
                    placeholder: "@",
                    class: "@",
                    style: "@",
                    inputClass: "@",
                    ngModel: "=",
                    fetchDataFunc: "=",
                    selectData: "=",
                    hideInputWhenHasData: "=",
                    panelStyle: "@"
                },
                link: function(scope, elem, attr, model) {
                    scope.multiSelect = true;
                    scope.showInput = true;
                    scope.$watch(attr.multiSelect, function(value) {
                        if (value || value == false) {
                            scope.multiSelect = value;
                        }
                    });

                    function updateNgModel(ngModel) {
                        if (!ngModel) {
                            // console.log("Case");
                            if (scope.multiSelect) {
                                ngModel = [];
                            } else {
                                ngModel = null;
                            }
                        }
                        scope.ngModel = ngModel;
                        if (scope.multiSelect) {
                            scope.selectItem = scope.ngModel;
                        } else {
                            if (scope.ngModel) {
                                scope.selectItem = [scope.ngModel];
                            } else {
                                scope.selectItem = [];
                            }
                        }
                        // returnResult();
                        // console.log("NgModel", scope.ngModel);
                    }

                    function returnResult() {
                        if (scope.multiSelect) {
                            scope.ngModel = scope.selectItem;
                        } else {
                            scope.ngModel = scope.selectItem[0] || null;
                        }
                        console.log("model", scope.ngModel);
                        if (scope.ngModel) {
                            model.$setViewValue(scope.ngModel);
                        }
                        $rootScope.$broadcast("SEACH_SELECT_CHANGE", scope.ngModel);
                    }

                    function renderHtml() {
                        elem.html($compile(render())(scope));
                        console.log($compile(render())(scope), elem.html());
                    }

                    $timeout(function() {
                        updateNgModel(scope.ngModel);
                    }, 150);

                    scope.$showSelectData = false;

                    var timeout;

                    scope.$changeInputSearch = function(keyword) {
                        if (timeout) {
                            $timeout.cancel(timeout);
                        }
                        timeout = $timeout(function() {
                            // console.log("keyword", keyword);
                            if (scope.fetchDataFunc && keyword) {
                                scope.fetchDataFunc(keyword);
                                scope.$showSelectData = true;
                            } else {
                                scope.$showSelectData = false;
                            }
                        }, 300);
                    };
                    scope.$selectItem = function(value, index) {
                        if (scope.multiSelect) {
                            if (!scope.$hasExist(value)) {
                                scope.selectItem.push(value);
                                // console.log("Model", scope.selectItem);
                            }
                        } else {
                            scope.selectItem = [value];
                            if (scope.hideInputWhenHasData) {
                                scope.showInput = false;
                            }
                        }
                        returnResult();
                    };
                    scope.$deSelectItem = function(value, index) {
                        if (scope.multiSelect) {
                            if (scope.$hasExist(value)) {
                                scope.selectItem.splice(index, 1);
                            }
                        } else {
                            scope.selectItem = [];
                        }
                        scope.showInput = true;
                        returnResult();
                    };
                    scope.$hasExist = function(item) {
                        var valueArr = scope.selectItem.map(function(i) {
                            return i[scope.itemShowValue];
                        });
                        // console.log("Value arr", valueArr, item);
                        if (valueArr.indexOf(item[scope.itemShowValue]) > -1) {
                            return true;
                        }
                        return false;
                    };
                    scope.$searchInputBlur = function() {
                        $timeout(function() {
                            scope.$showSelectData = false;
                        }, 150);
                    };
                    scope.$searchInputFocus = function(keyword) {
                        scope.$changeInputSearch(keyword);
                        // if (scope.selectData) {
                        scope.$showSelectData = true;
                        // }
                    };
                    renderHtml();
                    $rootScope.$on("UPDATE_NG_MODEL", function(event, data) {
                        var data = data || scope.ngModel;
                        if (data) {
                            if (scope.hideInputWhenHasData) {
                                scope.showInput = false;
                            }
                        }
                        updateNgModel(data);
                        renderHtml();
                    });
                    $rootScope.$on("RESET_SEARCH_INPUT", function(event, data) {
                        scope.selectItem = [];
                        scope.showInput = true;
                        returnResult();
                    });
                }
            };
        });

})();