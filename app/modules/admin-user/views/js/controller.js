'use strict';

// Users controller
angular.module('users').controller('UsersController', ['SendNotify', '$rootScope', '$scope', '$log', '$stateParams', '$location', '$window', 'Authentication', 'Users', 'Option', 'Notice', '$timeout', 'Upload', 'bzResourceSvc', 'localStorageService', 'Categories', '$sce', 'PendingSellerSvc',
    function(SendNotify, $rootScope, $scope, $log, $stateParams, $location, $window, Authentication, Users, Option, Notice, $timeout, Upload, bzResourceSvc, localStorageService, Categories, $sce, PendingSellerSvc) {

        $scope.authentication = Authentication;
        if (!Authentication.user.name) {
            $location.path('signin');
        }
        $scope.uploadApi = $window.settings.services.uploadApi;
        $scope.webUrl = $window.settings.services.webUrl;

        $scope.gotoList = function() {
            var filterData = localStorageService.get('user.filterData');
            var path = "/users";
            var query = [];
            if (filterData.currentPage) {
                query.push("currentPage=" + filterData.currentPage);
            }
            for (var i in filterData.search) {
                if (filterData.search[i]) {
                    query.push(i + "=" + filterData.search[i]);
                }
            }
            if (query.length) {
                path += "?" + query.join("&");
            }
            window.location.href = "/#!" + path;
        }

        $scope.isUploadImage = false;

        $scope.isInvalidFile = false;
        $scope.user_roles = [];

        $scope.avatarPath = '/files/avatar/';

        $scope.hasChangeSeller = false;
        $scope.submitted = false;
        $scope.changeImage = false;
        $scope.changeCover = false;
        $scope.search = {};

        $scope.showDateLabel = function() {
            // console.log("Vào hàm");
            if ($scope.search.hasBidding) {
                return {
                    start_date: "Has bidding from",
                    end_date: "Has bidding to"
                };
            } else {
                return {
                    start_date: "Created from",
                    end_date: "Created to"
                };
            }
        }

        $scope.resetFCC = function(userID) {
            Users.resetFCC({
                id: userID
            }, function(res) {
                if (res.status) {
                    Notice.setNotice("Reset Success", 'SUCCESS', true);
                } else {
                    Notice.setNotice(res.message, 'ERROR', true);
                }
            })
        }

        function showLoading() {
            $scope.isLoading = true;
        }

        function hideLoading(timer) {
            var timer = typeof timer !== 'undefined' ? timer : 500;

            $timeout(function() {
                $scope.isLoading = false;
            }, timer);
        }

        // //TEST IMAGE
        $scope.handleFileSelect = function(event, type) {
            $scope.isLoading = true;
            $scope.changeImage = true;
            var files = event.target.files; // FileList object
            // Loop through the FileList and render image files as thumbnails.
            for (var i = 0, f; f = files[i]; i++) {
                // Only process image files.
                if (!f.type.match('image.*')) {
                    continue;
                }
                if (type == 'avartar') {
                    var optionsThumb = {
                        width: 59,
                        height: 59,
                        centerCrop: true,
                        restoreExif: false
                    };
                    Upload.resize(files[i], optionsThumb).then(function(resizedFile) {
                        Upload.dataUrl(resizedFile, true).then(function(url) {
                            $scope.urlThumb = url;
                        })

                    });
                    var options = {
                        width: 300,
                        height: 300,
                        centerCrop: true,
                        restoreExif: false
                    };
                    Upload.resize(files[i], options).then(function(resizedFile) {
                        Upload.dataUrl(resizedFile, true).then(function(url) {
                            $scope.isLoading = false;
                            $scope.review_avatar = url;
                        })

                    });
                }
                if (type == 'cover') {
                    $scope.changeCover = true;
                    var optionsThumb = {
                        width: 1133,
                        height: 278,
                        centerCrop: true,
                        restoreExif: false
                    };
                    Upload.resize(files[i], optionsThumb).then(function(resizedFile) {
                        Upload.dataUrl(resizedFile, true).then(function(url) {
                            $scope.isLoading = false;
                            $scope.review_cover = url;
                        })
                    });
                }
            }
        }

        $scope.statuses = Option.getStatus();
        $scope.userRoles = Option.getRoles();

        // Create new user
        $scope.create = function(isValid, type) {
            $scope.submitted = true;
            $scope.isLoading = true;
            if (this.password != this.cfpassword) isValid = false;
            if (!isValid) {
                $scope.isLoading = false;
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var user = new Users({
                name: this.name,
                email: this.email,
                password: this.password,
                cfpassword: this.cfpassword,
                status: this.status,
                roles: this.roles,
                slug: this.slug,
            });
            // Redirect after save
            user.$save(function(response) {
                if (response._id) {
                    $scope.isLoading = false;
                    Notice.setNotice("Save user success!", 'SUCCESS');
                    if (type == 'save&list') {
                        $scope.gotoList();
                    } else {

                        $location.path('users/' + response._id + '/edit');
                        $scope.name = '';
                        $scope.submitted = false;
                        // $scope.succes = 'Save user success!';
                    }
                } else {
                    Notice.setNotice(response.message, 'ERROR', true);
                    $scope.isLoading = false;
                }
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
                $scope.isLoading = false;
            });
        };

        // Remove existing User
        $scope.remove = function(userId, hardDelete) {
            if (confirm("Do you want to remove?")) {

                if (hardDelete) {
                    var user = Users.get({
                        userId: userId
                    });

                    user.$remove({
                        userId: userId
                    });

                    Notice.setNotice("Delete user success!", 'SUCCESS');
                } else {
                    Users.moveToTrash({
                        id: userId,
                    }, function(response) {
                        console.log(response);
                        if (response.status) {
                            Notice.setNotice(response.msg, 'SUCCESS', true);
                        }
                    });
                }

                for (var i in $scope.users) {
                    if ($scope.users[i]._id === userId) {
                        $scope.users.splice(i, 1);
                    }
                }

                if ($stateParams.userId) {
                    $scope.gotoList();
                } else {
                    Notice.requireChange();
                }
            }
        };

        // Remove existing User
        $scope.removeVerifyPhone = function(userId) {
            if (confirm("Do you want to remove verify phone?")) {
                Users.removeVerifyPhone({
                    id: userId,
                }, function(response) {
                    // console.log(response);
                    if (response.status) {
                        Notice.setNotice(response.msg, 'SUCCESS', true);
                        if ($scope.user.verify_phone) {
                            $scope.user.verify_phone.isVerify = false;
                        }
                    } else {
                        // Notice.setNotice(response., 'ERROR', true);                        
                    }
                });
            }
        };
        $scope.makeCollector = function() {
            var user = $scope.user;
            if (user.roles.indexOf('collector') < 0) {
                user.is_show_msg_invited_collector = 1;
                user.roles.push('collector');
            }
            delete user.password;

            user.$update(function(response) {
                if (response.error) {

                    Notice.setNotice(response.message, 'ERROR', true);
                } else {
                    Notice.setNotice("Update success", 'SUCCESS', true);
                }
            }, function(errorResponse) {

                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };
        $scope.update = function(isValid, type, error) {
            $scope.isLoading = true;
            $scope.submitted = true;
            if ($scope.user.province && !$scope.user.district) {
                isValid = false;
            }
            if (!$scope.password) $scope.password = null;
            if (!$scope.cfpassword) $scope.cfpassword = null;
            if ($scope.cfpassword != $scope.password) isValid = false
            if (!isValid) {
                $scope.isLoading = false;
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var user = $scope.user;
            var province = $scope.user.province;
            delete user.__v;
            delete user.password_token;
            delete user.created;
            delete user.province;
            delete user.provider;
            delete user.activeToken;
            $scope.$log = $log;
            user.password = $scope.password;
            user.cfpassword = $scope.cfpassword;
            user.is_send_notify = user.is_send_notify || 0;
            user.$update(function(response) {
                if (response.error) {
                    $scope.isLoading = false;
                    Notice.setNotice(response.message, 'ERROR', true);
                } else {
                    if ($scope.changeImage && (($scope.review_avatar && $scope.urlThumb) || $scope.review_cover)) {
                        $scope.changeImage = false;
                        var userUpdate = response;
                        $scope.nameUpdate = new Date().getTime() + '.png';
                        var fd = new FormData();
                        if ($scope.review_avatar && $scope.urlThumb) {
                            fd.append('file', $scope.review_avatar);
                            fd.append('name', $scope.nameUpdate);
                            fd.append('thumb', $scope.urlThumb);
                            userUpdate.avatar = $scope.nameUpdate;
                        }
                        if ($scope.review_cover && $scope.changeCover) {
                            var nameCover = new Date().getTime() + '_' + Math.floor((1 + Math.random()) * 0x10000) + '.png';
                            fd.append('cover', $scope.review_cover);
                            fd.append('nameCover', nameCover);
                            userUpdate.cover = nameCover;
                            $scope.changeCover = false;
                        }
                        fd.append('user_id', response._id);
                        userUpdate.password = null;
                        userUpdate.$update(function(response) {
                            var user_data = {
                                _id: response._id,
                                name: response.name,
                                avatar: response.avatar
                            }
                            Users.updateFavoritesCache({ user_data });
                        });
                        var consol = bzResourceSvc.api($window.settings.services.userApi + '/api/upload/image-avatar').upload({}, fd, function(respon) {
                            $scope.isLoading = false;
                            Notice.setNotice("Update user success!", 'SUCCESS');
                            if (type == 'save&list') {
                                $scope.gotoList();
                            } else {
                                $scope.submitted = false;
                                Notice.requireChange();
                                $scope.isSeller = false;
                                $scope.user.province = province;
                                if (response.roles.indexOf('seller') != -1) {
                                    $scope.isSeller = true;
                                }
                                // $scope.gotoList();
                            }
                        }).$promise;
                    } else {
                        $scope.isLoading = false;
                        var user_data = {
                            _id: response._id,
                            name: response.name,
                            avatar: response.avatar
                        }
                        Users.updateFavoritesCache({ user_data });
                        Notice.setNotice("Update user success!", 'SUCCESS');
                        if (type == 'save&list') {
                            $scope.gotoList();
                        } else {
                            $scope.submitted = false;
                            Notice.requireChange();
                            $scope.isSeller = false;
                            $scope.user.province = province;
                            angular.forEach(response.roles, function(value) {
                                if (value == 'seller') {
                                    $scope.isSeller = true;
                                    return;
                                }
                            });
                            // $scope.gotoList();
                        }
                    }
                    renderBannedTo();
                }
            }, function(errorResponse) {
                $scope.isLoading = false;
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        $scope.render_select = false;

        $scope.findOne = function() {
            $scope.user = Users.get({
                userId: $stateParams.userId
            });
            $scope.user.$promise.then(function(result) {});
        };

        $scope.findOneAndHistory = function() {
            $scope.user = Users.get({
                userId: $stateParams.userId
            });
            $scope.user.$promise.then(function(result) {
                $scope.getCollectHistory();
            });
        };

        $scope.findOneAndBidHistory = function() {
            $scope.user = Users.get({
                userId: $stateParams.userId
            });
            $scope.user.$promise.then(function(result) {
                $scope.getBidHistory();
            });
        };

        $scope.getCollectHistory = function() {
            Users.collectHistory({
                user_id: $scope.user._id,
                page: $scope.currentPage,
            }, function(data) {
                $scope.histories = data.items;
                $scope.totalItems = data.totalItems;
                $scope.itemsPerPage = data.itemsPerPage;
                $scope.numberVisiblePages = data.numberVisiblePages;
                $scope.totalPage = data.totalPage || 1;
            });
        };

        $scope.getBidHistory = function() {
            Users.productBidHistory({
                user_id: $scope.user._id,
                page: $scope.currentPage,
            }, function(data) {
                $scope.histories = data.items;
                $scope.totalItems = data.totalItems;
                $scope.itemsPerPage = data.itemsPerPage;
                $scope.numberVisiblePages = data.numberVisiblePages;
                $scope.totalPage = data.totalPage || 1;
            });
        };

        function renderBannedTo() {
            if ($scope.user.ban && $scope.user.ban.ban_to) {
                $scope.user.ban.ban_to = new Date($scope.user.ban.ban_to);
            }
        }

        $scope.currentPage = 1;

        $scope.setPage = function(pageNo) {
            $scope.currentPage = pageNo;
        };

        $scope.pageChanged = function(page) {
            $scope.currentPage = page;
            getListData();
        };

        $scope.pageStatisticChanged = function(page) {
            $scope.currentPage = page;
            getListDataStatistic();
        };

        $scope.pageHistoryChanged = function(page) {
            $scope.currentPage = page;
            $scope.getCollectHistory();
        };

        $scope.pageBidHistoryChanged = function(page) {
            $scope.currentPage = page;
            $scope.getBidHistory();
        };

        function getListData(is_statistic) {
            if ($stateParams.filterCondition) {
                $scope.currentPage = 1;
                switch ($stateParams.filterCondition) {
                    case "facebook":
                        $scope.search.socialSource = "facebook";
                        break;
                    case "google":
                        $scope.search.socialSource = "google";
                        break;
                }
            }
            var options = {
                page: $scope.currentPage,
                keyword: $scope.search.keyword,
                role: $scope.search.role,
                status: $scope.search.status,
                is_seed: $scope.search.is_seed,
                registerSource: $scope.search.registerSource,
                socialSource: $scope.search.socialSource,
                hasBidding: $scope.search.hasBidding,
                phoneVerify: $scope.search.phoneVerify,
                activity_scope: $scope.search.activity_scope,
                communityJoined: $scope.search.communityJoined,
                registerCommunity: $scope.search.registerCommunity,
                ban_status: $scope.search.ban_status,
                pending_seller: $scope.search.pending_seller
                    // is_seed: $scope.search.is_seed
            };
            if ($scope.search.start_date) {
                options.start_date = $scope.search.start_date;
            }
            if ($scope.search.end_date) {
                options.end_date = $scope.search.end_date;
            }
            if ($scope.search.from_date) {
                options.from_date = $scope.search.from_date;
            }
            if ($scope.search.to_date) {
                options.to_date = $scope.search.to_date;
            }
            if ($scope.search.pending_seller) {
                options.pending_seller = $scope.search.pending_seller;
            }
            if (!is_statistic) {
                var localStorageName = "user.filterData";
            } else {
                var localStorageName = "user.statisticCollectData";
            }
            localStorageService.set(localStorageName, {
                currentPage: $scope.currentPage,
                search: $scope.search
            });
            // console.log("getListData");
            if (!is_statistic) {
                Users.query(options, function(data) {
                    console.log('Data:', data);
                    $scope.users = data.items;
                    $scope.totalItems = data.totalItems;
                    $scope.itemsPerPage = data.itemsPerPage;
                    $scope.numberVisiblePages = data.numberVisiblePages;
                    $scope.totalPage = data.totalPage || 1;

                    hideLoading();
                });
            } else {
                Users.statisticCollect(options, function(data) {
                    // console.log('Data:', data);
                    $scope.users = data.items;
                    $scope.totalItems = data.totalItems;
                    $scope.itemsPerPage = data.itemsPerPage;
                    $scope.numberVisiblePages = data.numberVisiblePages;
                    $scope.totalPage = data.totalPage || 1;

                    hideLoading();
                });
            }
        }

        function getListDataStatistic() {
            showLoading();

            if ($stateParams.filterCondition) {
                $scope.currentPage = 1;
                switch ($stateParams.filterCondition) {
                    case "facebook":
                        $scope.search.socialSource = "facebook";
                        break;
                    case "google":
                        $scope.search.socialSource = "google";
                        break;
                }
            }
            var options = {
                page: $scope.currentPage,
                keyword: $scope.search.keyword,
                role: $scope.search.role,
                status: $scope.search.status,
                is_seed: $scope.search.is_seed,
                registerSource: $scope.search.registerSource,
                socialSource: $scope.search.socialSource,
                hasBidding: $scope.search.hasBidding,
                phoneVerify: $scope.search.phoneVerify,
                activity_scope: $scope.search.activity_scope,
                ban_status: $scope.search.ban_status,
                // is_seed: $scope.search.is_seed
            };
            if ($scope.search.start_date) {
                options.start_date = $scope.search.start_date;
            }
            if ($scope.search.end_date) {
                options.end_date = $scope.search.end_date;
            }
            if ($scope.search.from_date) {
                options.from_date = $scope.search.from_date;
            }
            if ($scope.search.to_date) {
                options.to_date = $scope.search.to_date;
            }

            // console.log("getListData");
            Users.statistic(options, function(data) {
                console.log('Data:', data);
                $scope.users = data.items;
                $scope.totalItems = data.totalItems;
                $scope.itemsPerPage = data.itemsPerPage;
                $scope.numberVisiblePages = data.numberVisiblePages;
                $scope.totalPage = data.totalPage || 1;
                $scope.statistic = data.statistic;

                $scope.statistic.userBidPercen = Math.round10((data.statistic.userBid / data.statistic.total) * 100, -2);
                $scope.statistic.userCollectPercen = Math.round10((data.statistic.userCollect / data.statistic.total) * 100, -2);
                $scope.statistic.userBidCollectPercen = Math.round10((data.statistic.userBidOrCollect / data.statistic.total) * 100, -2);
                hideLoading();
            });
        }

        // Find a list of Posts
        $scope.find = function(is_statistic) {
            showLoading();
            if (!$.isEmptyObject($location.search())) {
                var filterData = $location.search();
                $scope.currentPage = Number(filterData.currentPage) || 1;
                $scope.search.keyword = filterData.keyword;
                $scope.search.socialSource = filterData.socialSource;
                $scope.search.registerSource = filterData.registerSource;
                $scope.search.role = filterData.role;
                $scope.search.status = !isNaN(filterData.status) ? Number(filterData.status) : null;
                $scope.search.is_seed = !isNaN(filterData.is_seed) ? Number(filterData.is_seed) : null;
                $scope.search.hasBidding = !isNaN(filterData.hasBidding) ? Number(filterData.hasBidding) : null;
                $scope.search.phoneVerify = filterData.phoneVerify;
                $scope.search.activity_scope = filterData.activity_scope;
                $scope.search.pending_seller = filterData.pending_seller == 1 ? true : false;
            } else {
                if (!is_statistic) {
                    var filterData = localStorageService.get('user.filterData');
                } else {
                    var filterData = localStorageService.get('user.statisticCollectData');
                }
                if (filterData) {
                    // console.log("filter by local store", filterData);
                    $scope.currentPage = filterData.currentPage;
                    $scope.search = filterData.search;
                }
            }
            getListData(is_statistic);
        };
        $scope.findStatistic = function() {
                showLoading();
                if (!$.isEmptyObject($location.search())) {
                    var filterData = $location.search();
                    $scope.currentPage = Number(filterData.currentPage) || 1;
                    $scope.search.keyword = filterData.keyword;
                    $scope.search.socialSource = filterData.socialSource;
                    $scope.search.registerSource = filterData.registerSource;
                    $scope.search.role = filterData.role;
                    $scope.search.status = !isNaN(filterData.status) ? Number(filterData.status) : null;
                    $scope.search.is_seed = !isNaN(filterData.is_seed) ? Number(filterData.is_seed) : null;
                    $scope.search.hasBidding = !isNaN(filterData.hasBidding) ? Number(filterData.hasBidding) : null;
                    $scope.search.phoneVerify = filterData.phoneVerify;
                    $scope.search.activity_scope = filterData.activity_scope;
                }
                getListDataStatistic();
            }
            //search
        $scope.filter = function(is_statistic, is_statistic_report) {
            $scope.currentPage = 1;
            if (!is_statistic_report) {
                getListData(is_statistic);
            } else {
                getListDataStatistic()
            }
        };
        //reset
        $scope.reset = function(is_statistic_report) {
            $scope.search = {};
            if (!is_statistic_report) {
                getListData();
            } else {
                getListDataStatistic()
            }
        };

        //Send email

        $scope.sendMail = function() {
            var user = $scope.user
            SendNotify.sendnotifytoseller({
                name: user.name,
                email: user.email
            }, function(response) {
                if (response.status) {
                    Notice.setNotice(response.msg, 'SUCCESS', true);
                    SendNotify.changesendnotifystatus({
                        id: user._id,
                        is_send_notify: 1
                    }, function(response) {
                        console.log(response);
                    });
                } else {
                    Notice.setNotice(response.msg, 'ERROR', true);
                }
            });
        };

        $scope.isOpen = {
            start_date: false,
            end_date: false,
            ban_to: false
        };

        // Open Calendar
        $scope.openCalendar = function(type) {
            if (type == 'start_date') {
                $scope.isOpen.start_date = true;
            } else if (type == "end_date") {
                $scope.isOpen.end_date = true;
            } else {
                $scope.isOpen.ban_to = true;
            }
        };

        $scope.isOpenEndDate = false;
        $scope.openEndDate = function() {
            $scope.isOpenEndDate = true;
        };

        $scope.closeEndDate = function() {
            $scope.isOpenEndDate = false;
        };

        $scope.changeSearchDate = function(start_date, end_date, is_change_start, flagUserReport) {
            // end_date -= 86400000; // end date must be 00:00:00 of next day
            if (start_date && end_date) {
                if (start_date > end_date) {
                    if (!is_change_start) {
                        start_date = new Date(end_date.getTime() - 86400000);
                    } else {
                        end_date = start_date;
                    }
                }
            }
            if (start_date &&
                start_date >= Date.now() &&
                $scope.search.bid_status != -1) {
                $scope.search.bid_status = "";
            }
            if (end_date &&
                end_date >= Date.now() &&
                $scope.search.bid_status != -1) {
                $scope.search.bid_status = "";
            }
            if (start_date &&
                start_date <= Date.now() &&
                $scope.search.bid_status != 1) {
                $scope.search.bid_status = "";
            }
            if (end_date &&
                end_date <= Date.now() &&
                $scope.search.bid_status != 1) {
                $scope.search.bid_status = "";
            }
            $scope.search.start_date = start_date;
            $scope.search.end_date = end_date;

            if (flagUserReport) {
                $scope.filter(false, true);
            } else {
                $scope.filter();
            }
        };

        $scope.changeStatisticDate = function(start_date, end_date, is_change_start) {
            // end_date -= 86400000; // end date must be 00:00:00 of next day
            if (start_date && end_date) {
                if (start_date > end_date) {
                    if (!is_change_start) {
                        start_date = new Date(end_date.getTime() - 86400000);
                    } else {
                        end_date = start_date;
                    }
                }
            }
            $scope.search.start_date = start_date;
            $scope.search.end_date = end_date;
            $scope.filter(true);
        };

        $scope.changeHasBidding = function() {
            // $scope.search.keyword = "";
            // $scope.search.role = "";
            // $scope.search.status = "";
            // $scope.search.is_seed = "";
            // $scope.search.socialSource = "";
            $scope.currentPage = 1;
            $scope.search.start_date = new Date();
            $scope.search.end_date = new Date();
            $scope.filter();
        };

        $scope.putback = function(userId) {
            Users.get({
                userId: userId
            }, function(result) {
                result.status = 0;
                result.phone = result.phone.replace("trash", "");
                result.email = result.email.replace(/_remove_\d+/g, "");
                result.password = null;
                result.cfpassword = null;
                result.$update({}, function(resp) {
                    if (resp._id) {
                        for (var i in $scope.users) {
                            if ($scope.users[i]._id === userId) {
                                $scope.users.splice(i, 1);
                            }
                        }
                        Notice.setNotice("Put user back success!", 'SUCCESS');
                        Notice.requireChange();
                        $scope.submitted = false;
                    } else {
                        Notice.setNotice(resp.message, 'ERROR', true);
                    }
                }, function(errorResponse) {
                    Notice.setNotice(errorResponse.data.message, 'ERROR', true);
                });
            });
        };

        $scope.verifyPhone = function() {
            if (confirm("Are you sure?")) {
                if ($scope.user) {
                    if ($scope.user.phone) {
                        $scope.user.verify_phone = {
                            isVerify: true,
                            phone: $scope.user.phone,
                            verify_date: new Date(),
                            generate_date: new Date(),
                            times: $scope.user.verify_phone.times
                        };
                        $scope.update(true);
                    } else {
                        Notice.setNotice("Please enter phone number before submit verify!", 'ERROR', true);
                    }
                }
            }
        };

        $scope.changeSlug = function(value, edit) {
            var new_slug = slug(value).toLowerCase();
            if (edit) {
                $scope.user.slug = new_slug;
            } else {
                $scope.slug = new_slug;
            }
        };

        $scope.checkScopeRequired = function(roles) {
            // if (roles && roles.length && roles.indexOf('collector') > -1) {
            //     return 'required';
            // }
            if (roles && roles.length && roles.indexOf('seller') > -1) {
                return 'required';
            }
            return false
        };

        // Add seller type
        $scope.changeUserRoles = function(data) {
            $scope.hasChangeSeller = data.indexOf('seller') == -1 ? false : true;
        };

        //Pending seller status
        $scope.pendingSellerStatus = function(pendingStatus) {
            if (pendingStatus == true) {
                return {
                    label: 'Yes (Confirm Now)',
                    class: 'btn-danger'
                };
            }
        };

        $scope.openApproveModal = function(user) {
            if (user.pendingSeller == true) {
                PendingSellerSvc.openApproveModal(user);
            }
        };

        $scope.publishPending = function(confirm_data, cb) {

            confirmPedingSeller(confirm_data, function(status) {
                if (status) {
                    $("#pending-modal").on('hidden.bs.modal', function(e) {
                        $timeout(function() {
                            getListData();
                        });
                    });
                }
                cb(status);
            });

        };

        function confirmPedingSeller(confirm_data, cb) {
            Users.confirmSeller(confirm_data, function(response) {
                if (response.status) {
                    cb(true);
                } else {
                    cb(false);
                }
            });
        }
        //End Pending seller status

    }
]);