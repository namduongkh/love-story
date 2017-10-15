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
            // function render() {
            //     return '\

            // }

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
                    // ngModel: "=",
                    fetchDataFunc: "=",
                    selectData: "=",
                    hideInputWhenHasData: "=",
                    panelStyle: "@",
                    multiSelect: "=?"
                },
                templateUrl: '/modules/admin-core/views/js/template/search-select.html',
                link: function(scope, elem, attr, model) {
                    var multiSelect = scope.multiSelect || true;
                    var maxResultItem = 1;
                    var selectItems = [];

                    scope.showInput = true;

                    scope.$watch('selectData', function(value) {
                        if (value && value.length) {
                            scope.resultItems = getResultItems(value);
                        } else {
                            scope.resultItems = null;
                        }
                    });

                    function getResultItems(data) {

                        var itemCount = 0;
                        var result = null;
                        for (var i in data) {
                            if (!selectItems.includes(data[i][scope.itemShowValue])) {
                                itemCount++;
                                if (!result) { result = []; }
                                result.push(data[i]);
                            }
                            if (itemCount >= maxResultItem) {
                                break;
                            }
                        }
                        return result;
                    }

                    function updateSelectItems(data) {
                        selectItems = [];
                        if (data && data.length) {
                            for (var i in data) {
                                selectItems.push(data[i][scope.itemShowValue])
                            }
                            scope.selectItem = data;
                        } else {
                            scope.selectItem = null;
                        }
                    }

                    function updateNgModel(ngModel) {
                        if (!ngModel) {
                            // console.log("Case");
                            if (multiSelect) {
                                ngModel = [];
                            } else {
                                ngModel = null;
                            }
                        }
                        // ngModel = ngModel;
                        if (multiSelect) {
                            updateSelectItems(ngModel);
                        } else {
                            if (ngModel) {
                                updateSelectItems([ngModel]);
                            } else {
                                updateSelectItems(null);
                            }
                        }
                        // returnResult();
                        // console.log("NgModel", scope.ngModel);
                    }

                    function returnResult() {
                        var ngModel;
                        if (multiSelect) {
                            ngModel = scope.selectItem;
                        } else {
                            ngModel = scope.selectItem[0] || null;
                        }
                        if (ngModel) {
                            model.$setViewValue(JSON.parse(JSON.stringify(ngModel)));
                        } else {
                            model.$setViewValue(null);
                        }
                        // $rootScope.$broadcast("SEACH_SELECT_CHANGE", ngModel);
                    }

                    // function renderHtml() {
                    //     $(elem).html($compile(render())(scope));
                    // }

                    $timeout(function() {
                        updateNgModel(null);
                    }, 150);

                    scope.showSelectData = false;

                    var timeout;

                    scope.changeInputSearch = function(keyword) {
                        if (timeout) {
                            $timeout.cancel(timeout);
                        }
                        timeout = $timeout(function() {
                            if (scope.fetchDataFunc && keyword) {
                                scope.fetchDataFunc(keyword);
                            }
                            scope.showSelectData = true;
                        }, 300);
                    };

                    scope.selectItem = function(value, index) {
                        console.log({
                            value,
                            index
                        })
                        if (multiSelect) {
                            var selectData = scope.selectItem || [];
                            if (!scope.hasExist(value)) {
                                selectData.push(value);
                                updateSelectItems(selectData);
                                // console.log("Model", scope.selectItem);
                            }
                        } else {
                            updateSelectItems([value]);
                            if (scope.hideInputWhenHasData) {
                                scope.showInput = false;
                            }
                        }
                        returnResult();
                    };

                    scope.deSelectItem = function(value, index) {
                        if (multiSelect) {
                            var selectData = scope.selectItem || [];
                            if (scope.hasExist(value)) {
                                selectData.splice(index, 1);
                                updateSelectItems(selectData);
                            }
                        } else {
                            updateSelectItems(null);
                        }
                        scope.showInput = true;
                        returnResult();
                    };

                    scope.hasExist = function(item) {
                        // var valueArr = scope.selectItem ? scope.selectItem.map(function(i) {
                        //     return i[scope.itemShowValue];
                        // }) : [];
                        // console.log("Value arr", valueArr, item);
                        if (selectItems.indexOf(item[scope.itemShowValue]) > -1) {
                            return true;
                        }
                        return false;
                    };

                    scope.searchInputBlur = function() {
                        $timeout(function() {
                            scope.showSelectData = false;
                        }, 150);
                    };

                    scope.searchInputFocus = function(keyword) {
                        scope.changeInputSearch(keyword);
                        // if (scope.selectData) {
                        scope.showSelectData = true;
                        // }
                    };

                    // renderHtml();
                    $rootScope.$on("UPDATE_NG_MODEL", function(event, data) {
                        var data = data || scope.ngModel;
                        if (data) {
                            if (scope.hideInputWhenHasData) {
                                scope.showInput = false;
                            }
                        }
                        updateNgModel(data);
                        // renderHtml();
                    });

                    $rootScope.$on("RESET_SEARCH_INPUT", function(event, data) {
                        updateSelectItems(null);
                        scope.showInput = true;
                        returnResult();
                    });
                }
            };
        });

})();