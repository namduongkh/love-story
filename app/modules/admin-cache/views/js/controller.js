'use strict';

// Caches controller
angular.module('caches').controller('CachesController', ['$scope', '$window', '$stateParams', '$location', 'Option', 'Authentication', 'Caches', 'Notice', 'localStorageService', 'Upload',
    function($scope, $window, $stateParams, $location, Option, Authentication, Caches, Notice, localStorageService, Upload) {
        $scope.authentication = Authentication;
        $scope.filePath = '/files/cache/';
        $scope.webUrl = $window.settings.services.webUrl;
        if (!Authentication.user.name) {
            $location.path('signin');
        }
        $scope.types = Option.getTypes();
        $scope.statuses = Option.getStatus();
        $scope.gotoList = function() {
            $location.path('caches');
        }

        // Remove existing Category
        $scope.remove = function(cacheId) {
            if (confirm("Do you want to remove?")) {

                var cache = Caches.get({
                    cacheId: cacheId
                });

                cache.$remove({
                    cacheId: cacheId
                });

                for (var i in $scope.caches) {
                    if ($scope.caches[i]._id === cacheId) {
                        $scope.caches.splice(i, 1);
                    }
                }

                Notice.setNotice("Delete cache success!", 'SUCCESS');

                if ($stateParams.cacheId) {
                    $scope.gotoList();
                } else {
                    Notice.requireChange();
                }
            }
        };

        // Find existing Category
        $scope.findOne = function() {
            $scope.cache = Caches.get({
                cacheId: $stateParams.cacheId
            }, function(result) {
                if (result.image) {
                    $scope.review_file_name = $scope.webUrl + '/files/cache/' + result.image;
                }
            });
        };

        $scope.currentPage = 1;
        $scope.search = {};

        $scope.setPage = function(pageNo) {
            $scope.currentPage = pageNo;
        };

        $scope.pageChanged = function(page) {
            $scope.currentPage = page;
            getListData();
        };

        function getListData() {
            var options = {
                page: $scope.currentPage,
                keyword: $scope.search.keyword,
            };
            localStorageService.set('cache.filterData', {
                currentPage: $scope.currentPage,
                search: $scope.search
            });
            Caches.query(options, function(data) {
                console.log("Data", data);
                $scope.caches = data.items;
                $scope.totalItems = data.totalItems;
                $scope.itemsPerPage = data.itemsPerPage;
                $scope.numberVisiblePages = data.numberVisiblePages;
                $scope.totalPage = data.totalPage || 1;
            });
        }

        // Find a list of Posts
        $scope.find = function() {
            if (!$.isEmptyObject($location.search())) {
                var filterData = $location.search();
                $scope.currentPage = Number(filterData.currentPage) || 1;
                $scope.search.keyword = filterData.keyword;
            } else {
                var filterData = localStorageService.get('cache.filterData');
                if (filterData) {
                    // console.log("filter by local store", filterData);
                    $scope.currentPage = filterData.currentPage;
                    $scope.search = filterData.search;
                }
            }
            getListData();
        };
        //search
        $scope.filter = function() {
            $scope.currentPage = 1;
            getListData();
        };
        //reset
        $scope.reset = function() {
            $scope.search.keyword = "";
            $scope.currentPage = 1;
            getListData();
        };

        $scope.removeAll = function() {
            if (confirm("Do you want to remove all?")) {
                Caches.removeAll(function(res) {
                    if (res.status) {
                        $scope.caches = [];
                        Notice.setNotice("Delete all cache success!", 'SUCCESS', true);
                    } else {
                        Notice.setNotice("Delete all cache error!", 'ERROR', true);
                    }
                });
            }
        };
    }
]);