'use strict';

// Categories controller
angular.module('categories').controller('CategoriesController', ['$scope', '$window', '$stateParams', '$location', 'Option', 'Authentication', 'Categories', 'Notice', 'localStorageService', 'Upload',
    function($scope, $window, $stateParams, $location, Option, Authentication, Categories, Notice, localStorageService, Upload) {
        $scope.authentication = Authentication;
        $scope.filePath = '/files/category/';
        $scope.webUrl = $window.settings.services.webUrl;
        if (!Authentication.user.name) {
            $location.path('signin');
        }
        $scope.types = Option.getTypes();
        $scope.statuses = Option.getStatus();
        $scope.gotoList = function() {
            $location.path('categories');
        }

        // Create new Category
        $scope.create = function(isValid, goToList) {
            $scope.submitted = true;
            if (this.type == 'sticker' && !$scope.review_file_name) {
                isValid = false;
                $scope.image_error = true;
            } else {
                $scope.image_error = false;
            }
            if ($scope.identity_error) {
                isValid = false;
            }
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            // Create new Category object
            var category = new Categories({
                name: this.name,
                identity: this.identity || null,
                communityId: this.communityId,
                slug: this.slug,
                type: this.type,
                status: this.status,
                description: this.description
            });
            if ($scope.changeImage && $scope.review_file_name) {
                category.image = new Date().getTime() + '.' + $scope.extension;
            }
            // Redirect after save
            category.$save(function(response) {
                if (response._id) {
                    $scope.isLoading = true;
                    Notice.setNotice("Save category success!", 'SUCCESS');
                    if (goToList) {
                        $scope.gotoList();
                    } else {
                        $location.path('categories/' + response._id + '/edit');
                        // Clear form fields
                        // $scope.name = '';
                        $scope.submitted = false;
                        $scope.name = null;
                    }
                } else {
                    Notice.setNotice(response.message, 'ERROR', true);
                }
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Remove existing Category
        $scope.remove = function(categoryId) {
            if (confirm("Do you want to remove?")) {

                var category = Categories.get({
                    categoryId: categoryId
                });

                category.$remove({
                    categoryId: categoryId
                }, function() {});

                for (var i in $scope.categories) {
                    if ($scope.categories[i]._id === categoryId) {
                        $scope.categories.splice(i, 1);
                    }
                }

                Notice.setNotice("Delete category success!", 'SUCCESS');

                if ($stateParams.categoryId) {
                    $scope.gotoList();
                } else {
                    Notice.requireChange();
                }
            }
        };

        // Update existing Category
        $scope.update = function(isValid, gotoList) {
            $scope.submitted = true;
            if ($scope.category.type == 'sticker' && !$scope.review_file_name) {
                isValid = false;
                $scope.image_error = true;
            } else {
                $scope.image_error = false;
            }
            if ($scope.identity_error) {
                isValid = false;
            }
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var category = $scope.category;
            delete category.__v;
            delete category.created;
            if ($scope.changeImage) {
                $scope.category.image = new Date().getTime() + '.' + $scope.extension;
            }
            category.$update(function(resp) {
                if (resp.error) {
                    Notice.setNotice(response.message, 'ERROR', true);
                } else {
                    $scope.isLoading = true;
                    Notice.setNotice("Update category success!", 'SUCCESS');
                    if (gotoList) {
                        $scope.gotoList();
                    } else {
                        // $location.path('transactions/' + transaction._id);
                        // $scope.success = "Update page success!";
                        $scope.submitted = false;
                        Notice.requireChange();
                    }
                }

            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Find existing Category
        $scope.findOne = function() {
            $scope.category = Categories.get({
                categoryId: $stateParams.categoryId
            }, function(result) {
                if (result.image) {
                    $scope.review_file_name = $scope.webUrl + '/files/category/' + result.image;
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
            localStorageService.set('category.filterData', {
                currentPage: $scope.currentPage,
                search: $scope.search
            });
            Categories.query(options, function(data) {
                console.log('data category', data.items);
                $scope.categories = data.items;
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
                var filterData = localStorageService.get('category.filterData');
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

        $scope.validateIdentity = function(identity) {
            $scope.identity_error = '';
            if (identity) {
                Categories.getByIdentity({
                    identity: identity
                }, function(result) {
                    if (result._id) {
                        if ($scope.category) {
                            if ($scope.category._id.toString() !== result._id.toString()) {
                                $scope.identity_error = "This identity has exist!";
                            }
                        } else {
                            $scope.identity_error = "This identity has exist!";
                        }
                    }
                });
            }
        };
    }
]);