'use strict';

angular.module('tag')
    .controller('TagController', TagController);

function TagController($scope, $window, Tags, Option, $stateParams, Notice, $location, localStorageService, Upload, Authentication, $timeout, Categories) {
    $scope.authentication = Authentication;
    $scope.filePath = '/files/tag/';
    $scope.webUrl = $window.settings.services.webUrl;
    if (!Authentication.user.name) {
        $location.path('signin');
    }

    $scope.isLoading = false;

    $scope.statuses = Option.getTagStatus();

    // $scope.tagTypes = Option.getTagType();

    $scope.find = function() {
        $scope.isLoading = true;
        if (!$.isEmptyObject($location.search())) {
            var filterData = $location.search();
            $scope.currentPage = Number(filterData.currentPage) || 1;
            $scope.search.keyword = filterData.keyword;
        } else {
            var filterData = localStorageService.get('tag.filterData');
            if (filterData) {
                // console.log("filter by local store", filterData);
                $scope.currentPage = filterData.currentPage;
                $scope.search = filterData.search;
            } else {
                $scope.search = {};
                $scope.currentPage = 1;
            }
        }
        getListData();
    };


    $scope.setPage = function(pageNo) {
        $scope.currentPage = pageNo;
    };

    $scope.pageChanged = function(page) {
        $scope.currentPage = page;
        $scope.isLoading = true;
        // console.log("Page change", $scope.currentPage);
        getListData();
    };

    function getListData() {
        // console.log('$scope.search', $scope.search);
        if ($stateParams.filterCondition) {
            $scope.currentPage = 1;
        }
        var options = {
            page: $scope.currentPage,
            keyword: $scope.search.keyword,
            status: $scope.search.status,
            communityId: $scope.search.communityId,
            type: $scope.search.type,
            order: $scope.search.order
        };
        localStorageService.set('tag.filterData', {
            currentPage: $scope.currentPage,
            search: $scope.search
        });
        Tags.query(options, function(data) {
            // console.log(data, options);

            $timeout(function() {
                $scope.isLoading = false;
            }, 500);

            $scope.tags = data.items;
            // for (var i in $scope.tags) {
            //     if ($scope.tags[i].image.length > 0) {
            //         $scope.tags[i].image = $scope.webUrl + $scope.filePath + $scope.tags[i].image;
            //     } else {
            //         $scope.tags[i].image = null;
            //     }

            // }
            $scope.totalItems = data.totalItems;
            $scope.itemsPerPage = data.itemsPerPage;
            $scope.numberVisiblePages = data.numberVisiblePages;
            $scope.totalPage = data.totalPage || 1;
        });
    }

    $scope.create = function(isValid, goToList) {
        $scope.submitted = true;

        if (!isValid) {
            Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
            return;
        }

        // if (!$scope.review_file_name) {
        //     isValid = false;
        //     $scope.image_error = true;
        // } else {
        //     $scope.image_error = false;
        // }

        var tag = new Tags({
            name: this.name,
            slug: this.slug,
            status: this.status,
            count: this.count || 0,
        });

        // if ($scope.changeImage && $scope.review_file_name) {
        //     tag.image = new Date().getTime() + '.' + $scope.extension;
        // }

        tag.$save(function(response) {
            if (response._id) {
                finishCreate();

                function finishCreate() {
                    $scope.isLoading = true;
                    Notice.setNotice("Save tag success!", 'SUCCESS');
                    if (goToList) {
                        $scope.gotoList();
                    } else {
                        $location.path('tags/' + response._id + '/edit');

                        $scope.submitted = false;
                        $scope.name = null;
                        Notice.requireChange();
                    }
                }
            } else {
                Notice.setNotice(response.message, 'ERROR', true);
            }
        }, function(errorResponse) {
            Notice.setNotice(errorResponse.data.message, 'ERROR', true);
        })
    };

    $scope.changeSlug = function(value, edit) {
        var new_slug = '';
        if (value && value.length > 0) {
            var new_slug = slug(value).toLowerCase();
        }
        if (edit) {
            $scope.tag.slug = new_slug;
        } else {
            $scope.slug = new_slug;
        }
    };

    // Update existing Tag
    $scope.update = function(isValid, gotoList) {
        $scope.submitted = true;

        if (!isValid) {
            Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
            return;
        }

        // if (!$scope.review_file_name) {
        //     isValid = false;
        //     $scope.image_error = true;
        // } else {
        //     $scope.image_error = false;
        // }

        var tag = $scope.tag;
        delete tag.__v;
        delete tag.created;

        if ($scope.changeImage) {
            $scope.tag.image = new Date().getTime() + '.' + $scope.extension;
        }

        tag.$update(function(resp) {
            if (resp.error) {
                Notice.setNotice(response.message, 'ERROR', true);
            } else {
                finishUpload();

                function finishUpload() {
                    $scope.isLoading = true;
                    Notice.setNotice("Update tag success!", 'SUCCESS');
                    if (gotoList) {
                        $scope.gotoList();
                    } else {
                        $scope.submitted = false;
                        Notice.requireChange();
                    }
                }
            }
        }, function(errorResponse) {
            Notice.setNotice(errorResponse.data.message, 'ERROR', true);
        });
    };

    // Remove existing tag
    $scope.remove = function(tagId) {
        if (confirm("Do you want to remove?")) {

            var tag = Tags.get({
                tagId: tagId
            });

            tag.$remove({
                tagId: tagId
            }, function() {});

            for (var i in $scope.tags) {
                if ($scope.tags[i]._id === tagId) {
                    $scope.tags.splice(i, 1);
                }
            }

            Notice.setNotice("Delete tag success!", 'SUCCESS');

            if ($stateParams.tagId) {
                $scope.gotoList();
            } else {
                Notice.requireChange();
            }
        }
    };

    $scope.gotoList = function() {
        $location.path('tags');
    };

    $scope.filter = function() {
        $scope.currentPage = 1;
        getListData();
    };
    //reset
    $scope.reset = function() {
        // $scope.search = {};
        // getListData();
        if ($stateParams.filterCondition) {
            $scope.gotoList();
        } else {
            $scope.search = {};
            $scope.currentPage = 1;
            getListData();
        }
    };

    $scope.findOne = function() {
        $scope.tag = Tags.get({
            tagId: $stateParams.tagId
        }, function(result) {
            if (result.image) {
                $scope.review_file_name = $scope.webUrl + '/files/tag/' + result.image;
            }
        });
    };

    $scope.updateFinish = false;
    $scope.convertCountTag = function() {
        // console.log('=========')
        Tags.convertCountTag(function(resp) {
            $scope.updateFinish = true;
            // console.log(convertCountTag, resp);
        });
    };

    $scope.order = function(field) {
        if (field) {
            if (typeof $scope.search.order == 'undefined') $scope.search.order = {};

            if ($scope.search.order.field == field) {
                $scope.search.order.type == '1' ? $scope.search.order.type = '-1' : $scope.search.order.type = '1';
            } else {
                $scope.search.order.field = field;
                $scope.search.order.type = '1';
            }

            getListData();
        } else {
            if (typeof $scope.search == 'undefined') $scope.search = {};
            $scope.search.order = {
                field: null,
                type: null
            }
        }
    };
    $scope.order();
}