(function() {
    'use strict';

    angular.module('Album', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    AlbumController.$inject = ["UserService", "AlbumService", "$cookies", "$rootScope", "toastr", "$timeout", "$facebook", "$http", "Upload"];
    angular.module("Album")
        .controller("AlbumController", AlbumController);

    function AlbumController(UserService, AlbumService, $cookies, $rootScope, toastr, $timeout, $facebook, $http, Upload) {
        var albumCtrl = this;
        albumCtrl.accountInfo = {};

        albumCtrl.getAccount = function() {
            UserService.account().then(function(resp) {
                if (resp.status == 200) {
                    albumCtrl.accountInfo = resp.data;
                    if (new Date(albumCtrl.accountInfo.tokenExpire) < new Date()) {
                        albumCtrl.accountInfo.accessToken = "";
                    }
                }
            });
        };

        albumCtrl.init = function() {
            albumCtrl.getAccount();
            AlbumService.getAlbums()
                .then(function(resp) {
                    if (resp.status == 200) {
                        albumCtrl.listAlbums = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        albumCtrl.saveAlbum = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại dữ liệu và thử lại.", "Lỗi!");
                return;
            }
            if (!albumCtrl.album.photos) {
                albumCtrl.album.photos = [];
            }
            if (albumCtrl.tmpPhotoNames) {
                albumCtrl.album.photos = albumCtrl.album.photos.concat(albumCtrl.tmpPhotoNames);
            }
            AlbumService.saveAlbum(albumCtrl.album)
                .then(function(resp) {
                    if (resp.status == 200) {
                        var parallel = [];
                        console.log("image", albumCtrl.tmpPhotos, albumCtrl.tmpPhotoNames);
                        albumCtrl.tmpPhotos.map(function(file, key) {
                            var filename = albumCtrl.tmpPhotoNames[key];
                            parallel.push(function(cb) {
                                Upload.upload({
                                        url: apiPath + "/api/upload/image",
                                        data: {
                                            file: file,
                                            filename: filename.replace(/.[^.]+$/g, ""),
                                            type: "albums/" + resp.data._id
                                        }
                                    })
                                    .then(function(response) {
                                        console.log("success", response);
                                        cb(null);
                                    }, function(response) {
                                        console.log("err", response);
                                        cb(true)
                                    }, function(evt) {
                                        // file.progress = Math.min(100, parseInt(100.0 *
                                        //     evt.loaded / evt.total));
                                    });
                            });
                        });

                        async.parallel(parallel, function(err, results) {
                            albumCtrl.defaultPhotos();
                            if (!albumCtrl.album._id) {
                                if (!albumCtrl.listAlbums) {
                                    albumCtrl.listAlbums = [];
                                }
                                albumCtrl.listAlbums.unshift(resp.data);
                            } else {
                                for (var i in albumCtrl.listAlbums) {
                                    if (albumCtrl.listAlbums[i]._id == albumCtrl.album._id) {
                                        albumCtrl.listAlbums[i] = resp.data;
                                        break;
                                    }
                                }
                            }
                            albumCtrl.album = resp.data;
                            toastr.success("Lưu album thành công.", "Thành công!");
                        });
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function(err) {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        albumCtrl.removeAlbum = function(albumId, index) {
            if (confirm("Bạn có chắc chắn muốn xóa?")) {
                AlbumService.removeAlbum(albumId)
                    .then(function(resp) {
                        if (resp.status == 200 && resp.data) {
                            toastr.success("Xóa album thành công.", "Thành công!");
                            albumCtrl.listAlbums.splice(index, 1);
                            albumCtrl.resetAlbum();
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    });
            }
        };

        albumCtrl.selectAlbum = function(album) {
            albumCtrl.album = JSON.parse(JSON.stringify(album));
            albumCtrl.defaultPhotos();
            Common.scrollTo("#album-top", 'fast');
        };

        albumCtrl.resetAlbum = function() {
            albumCtrl.album = {};
            albumCtrl.defaultPhotos();
        };

        albumCtrl.defaultPhotos = function() {
            albumCtrl.tmpPhotos = [];
            albumCtrl.tmpPhotoNames = [];
        };

        albumCtrl.defaultPhotos();

        albumCtrl.uploadFiles = function(files, invalidFiles) {
            console.log(files, invalidFiles);
            for (var i in files) {
                var file = files[i];
                albumCtrl.tmpPhotoNames.push(new Date().getTime() + "-" + file.name);
                albumCtrl.tmpPhotos.push(file);
            }
        };

        albumCtrl.removePhoto = function(index) {
            albumCtrl.tmpPhotos.splice(index, 1);
            albumCtrl.tmpPhotoNames.splice(index, 1);
        };

        albumCtrl.removeSavedPhoto = function(index) {
            albumCtrl.album.photos.splice(index, 1);
        };
    }
})();
(function() {
    'use strict';

    AlbumService.$inject = ["$http"];
    angular.module("Album")
        .service("AlbumService", AlbumService);

    function AlbumService($http) {
        return {
            getAlbums: function() {
                return $http.get(apiPath + "/api/album/getAlbums");
            },
            saveAlbum: function(data) {
                return $http.post(apiPath + "/api/album/saveAlbum", data);
            },
            removeAlbum: function(id) {
                return $http.post(apiPath + "/api/album/removeAlbum", { albumId: id });
            }
        }
    }
})();
(function() {
    'use strict';

    angular.module('Campaign', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    CampaignController.$inject = ["UserService", "CampaignService", "FeedService", "AlbumService", "$cookies", "$scope", "$rootScope", "toastr", "$timeout", "$facebook", "$http"];
    angular.module("Campaign")
        .controller("CampaignController", CampaignController);

    function CampaignController(UserService, CampaignService, FeedService, AlbumService, $cookies, $scope, $rootScope, toastr, $timeout, $facebook, $http) {
        var campaignCtrl = this;
        campaignCtrl.accountInfo = {};
        campaignCtrl.generateTitle = {};

        campaignCtrl.getAccount = function() {
            UserService.account().then(function(resp) {
                if (resp.status == 200) {
                    campaignCtrl.accountInfo = resp.data;
                    if (new Date(campaignCtrl.accountInfo.tokenExpire) < new Date()) {
                        campaignCtrl.accountInfo.accessToken = "";
                    }
                }
            });
        };

        campaignCtrl.init = function() {
            campaignCtrl.getAccount();
            CampaignService.getCampaigns()
                .then(function(resp) {
                    if (resp.status == 200) {
                        campaignCtrl.listCampaigns = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        campaignCtrl.saveCampaign = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại dữ liệu và thử lại.", "Lỗi!");
                return;
            }
            CampaignService.saveCampaign(campaignCtrl.campaign)
                .then(function(resp) {
                    if (resp.status == 200) {
                        if (!campaignCtrl.campaign._id) {
                            if (!campaignCtrl.listCampaigns) {
                                campaignCtrl.listCampaigns = [];
                            }
                            campaignCtrl.listCampaigns.unshift(resp.data);
                        } else {
                            for (var i in campaignCtrl.listCampaigns) {
                                if (campaignCtrl.listCampaigns[i]._id == campaignCtrl.campaign._id) {
                                    campaignCtrl.listCampaigns[i] = resp.data;
                                    break;
                                }
                            }
                        }
                        $scope.CampaignForm.$setPristine();
                        campaignCtrl.campaign = resp.data;
                        toastr.success("Lưu chiến dịch thành công.", "Thành công!");
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function(err) {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        campaignCtrl.removeCampaign = function(campaignId, index) {
            if (confirm("Bạn có chắc chắn muốn xóa?")) {
                CampaignService.removeCampaign(campaignId)
                    .then(function(resp) {
                        if (resp.status == 200 && resp.data) {
                            toastr.success("Xóa chiến dịch thành công.", "Thành công!");
                            campaignCtrl.listCampaigns.splice(index, 1);
                            campaignCtrl.resetCampaign();
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    });
            }
        };

        campaignCtrl.runCampaign = function(campaignId) {
            if (!campaignCtrl.campaign.timelineId || campaignCtrl.campaign.timelineId.length !== 1) {
                toastr.error("Để chạy chiến dịch 1 lần, bạn chỉ được chọn 1 mục trong dữ liệu dòng thời gian.", "Lỗi!");
                return;
            }
            if (confirm("Bạn chắc chắn muốn chạy chiến dịch này?")) {
                CampaignService.runCampaign(campaignId)
                    .then(function(resp) {
                        if (resp.status == 200 && resp.data) {
                            toastr.success(resp.data.msg, "Thành công!");
                            // campaignCtrl.resetCampaign();
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        toastr.error(err.data.message, "Lỗi!");
                    });
            }
        };

        campaignCtrl.selectCampaign = function(campaign) {
            campaignCtrl.campaign = JSON.parse(JSON.stringify(campaign));
            Common.scrollTo("#campaign-top", 'fast');
            campaignCtrl.postTypeChange();
        };

        campaignCtrl.resetCampaign = function() {
            campaignCtrl.campaign = {};
        };

        campaignCtrl.postTypeChange = function() {
            if (campaignCtrl.campaign.postType == "feed") {
                FeedService.getFeeds()
                    .then(function(resp) {
                        if (resp.status == 200) {
                            campaignCtrl.listFeeds = resp.data;
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function() {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    });
            } else {
                AlbumService.getAlbums()
                    .then(function(resp) {
                        if (resp.status == 200) {
                            campaignCtrl.listAlbums = resp.data;
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function() {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    });
            }
        };

        campaignCtrl.groupTimeline = function(item) {
            switch (item.type) {
                case 'personal':
                    return 'Cá nhân';
                case 'group':
                    return 'Nhóm';
                case 'page':
                    return 'Trang';
            }
        };
    }
})();
(function() {
    'use strict';

    CampaignService.$inject = ["$http"];
    angular.module("Campaign")
        .service("CampaignService", CampaignService);

    function CampaignService($http) {
        return {
            getCampaigns: function() {
                return $http.get(apiPath + "/api/campaign/getCampaigns");
            },
            saveCampaign: function(data) {
                return $http.post(apiPath + "/api/campaign/saveCampaign", data);
            },
            removeCampaign: function(id) {
                return $http.post(apiPath + "/api/campaign/removeCampaign", { campaignId: id });
            },
            runCampaign: function(id) {
                return $http.post(apiPath + "/api/campaign/runCampaign", { campaignId: id });
            },
            stopCampaign: function(id) {
                return $http.post(apiPath + "/api/campaign/stopCampaign", { campaignId: id });
            },
        }
    }
})();
var Common = (function() {
    'use strict';
    return {
        scrollTo: function(element, speed) {
            element = element || 'html,body';
            speed = speed || 'slow';
            $('html,body').animate({
                    scrollTop: $(element).offset().top
                },
                speed);
        }
    };
})();
(function() {
    'use strict';

    angular.module('Core', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    angular.module('Core')
        .directive("errorMessage", errorMessage)
        .directive("showLoading", showLoading);

    function errorMessage() {
        return {
            restrict: "AE",
            templateUrl: "modules/web-core/views/js/template/error-message.html",
            replace: true,
            scope: {
                errorMessage: "=",
                matchTarget: "=",
                typeContent: "=",
                stepValue: "="
            },
            link: function(scope, elem, attr) {
                function setMatchError() {
                    if (scope.typeContent && scope.matchTarget && scope.typeContent != scope.matchTarget) {
                        scope.errorMessage.match = true;
                    } else {
                        scope.errorMessage.match = false;
                    }
                }
                scope.$watch("typeContent", function(value) {
                    setMatchError();
                });
                scope.$watch("matchTarget", function(value) {
                    setMatchError();
                });
            }
        }
    }

    function showLoading() {
        return {
            restrict: "A",
            scope: {
                showLoading: "="
            },
            link: function(scope, elem, attr) {
                scope.$watch('showLoading', function(value) {
                    if (value) {
                        $(elem).fadeIn('fast');
                    }
                });
            }
        };
    }
})();
(function() {
    'use strict';

    angular.module("Core")
        .filter('shortString', shortString);

    function shortString() {
        return function(input, length) {
            length = length || 50;
            if (input && input.length > length) {
                return input.substr(0, length) + "...";
            }
            return input;
        };
    }
})();
(function() {
    'use strict';

    PreResponse.$inject = ["$rootScope", "$timeout", "$q"];
    angular.module('Core')
        .factory('PreResponse', PreResponse)
        .config(['$httpProvider', function($httpProvider) {
            $httpProvider.interceptors.push('PreResponse');
        }]);

    function PreResponse($rootScope, $timeout, $q) {
        return {
            response: function(response) {
                // console.log("Chạy vào đây");
                if (response.status == 200) {
                    if (response.data.noAccessToken) {
                        $rootScope.$broadcast("NO_ACCESS_TOKEN_ERROR");
                    }
                    if (response.data.tokenHasExpired) {
                        $rootScope.$broadcast("TOKEN_HAS_EXPIRED_ERROR");
                    }
                    if (response.data.rejectApi) {
                        return $q.reject({
                            status: false,
                            data: {
                                message: 'You have access token!'
                            },
                            handle: 'PreResponse'
                        });
                    }
                }
                return response;
            },
        }
    };
})();
(function() {
    'use strict';

    angular.module('Feed', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    FeedController.$inject = ["UserService", "FeedService", "$cookies", "$rootScope", "toastr", "$timeout", "$facebook", "$http"];
    angular.module("Feed")
        .controller("FeedController", FeedController);

    function FeedController(UserService, FeedService, $cookies, $rootScope, toastr, $timeout, $facebook, $http) {
        var feedCtrl = this;
        feedCtrl.accountInfo = {};

        feedCtrl.getAccount = function() {
            UserService.account().then(function(resp) {
                if (resp.status == 200) {
                    feedCtrl.accountInfo = resp.data;
                    if (new Date(feedCtrl.accountInfo.tokenExpire) < new Date()) {
                        feedCtrl.accountInfo.accessToken = "";
                    }
                }
            });
        };

        feedCtrl.init = function() {
            feedCtrl.getAccount();
            FeedService.getFeeds()
                .then(function(resp) {
                    if (resp.status == 200) {
                        feedCtrl.listFeeds = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        feedCtrl.saveFeed = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại dữ liệu và thử lại.", "Lỗi!");
                return;
            }
            FeedService.saveFeed(feedCtrl.feed)
                .then(function(resp) {
                    if (resp.status == 200) {
                        if (!feedCtrl.feed._id) {
                            if (!feedCtrl.listFeeds) {
                                feedCtrl.listFeeds = [];
                            }
                            feedCtrl.listFeeds.unshift(resp.data);
                        } else {
                            for (var i in feedCtrl.listFeeds) {
                                if (feedCtrl.listFeeds[i]._id == feedCtrl.feed._id) {
                                    feedCtrl.listFeeds[i] = resp.data;
                                    break;
                                }
                            }
                        }
                        feedCtrl.feed = resp.data;
                        toastr.success("Lưu trạng thái thành công.", "Thành công!");
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function(err) {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        feedCtrl.removeFeed = function(feedId, index) {
            if (confirm("Bạn có chắc chắn muốn xóa?")) {
                FeedService.removeFeed(feedId)
                    .then(function(resp) {
                        if (resp.status == 200 && resp.data) {
                            toastr.success("Xóa trạng thái thành công.", "Thành công!");
                            feedCtrl.listFeeds.splice(index, 1);
                            feedCtrl.resetFeed();
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    });
            }
        };

        feedCtrl.selectFeed = function(feed) {
            feedCtrl.feed = JSON.parse(JSON.stringify(feed));
            Common.scrollTo("#feed-top", 'fast');
        };

        feedCtrl.resetFeed = function() {
            feedCtrl.feed = {};
        };
    }
})();
(function() {
    'use strict';

    FeedService.$inject = ["$http"];
    angular.module("Feed")
        .service("FeedService", FeedService);

    function FeedService($http) {
        return {
            getFeeds: function() {
                return $http.get(apiPath + "/api/feed/getFeeds");
            },
            saveFeed: function(data) {
                return $http.post(apiPath + "/api/feed/saveFeed", data);
            },
            removeFeed: function(id) {
                return $http.post(apiPath + "/api/feed/removeFeed", { feedId: id });
            }
        }
    }
})();
(function() {
    'use strict';

    angular.module('Graph', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    GraphController.$inject = ["UserService", "FeedService", "GraphService", "AlbumService", "$cookies", "$rootScope", "toastr", "$timeout", "$facebook", "$http", "$window"];
    angular.module("Graph")
        .controller("GraphController", GraphController);

    function GraphController(UserService, FeedService, GraphService, AlbumService, $cookies, $rootScope, toastr, $timeout, $facebook, $http, $window) {
        var graphCtrl = this;
        graphCtrl.accountInfo = {};

        graphCtrl.getAccount = function() {
            UserService.account().then(function(resp) {
                if (resp.status == 200) {
                    graphCtrl.accountInfo = resp.data;
                    if (new Date(graphCtrl.accountInfo.tokenExpire) < new Date()) {
                        graphCtrl.accountInfo.accessToken = "";
                    }
                }
            });
        };

        graphCtrl.init = function() {
            graphCtrl.getAccount();
            FeedService.getFeeds()
                .then(function(resp) {
                    if (resp.status == 200) {
                        graphCtrl.listFeeds = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
            AlbumService.getAlbums()
                .then(function(resp) {
                    if (resp.status == 200) {
                        graphCtrl.listAlbums = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        graphCtrl.postPhotoToAlbum = function() {
            var parallel = [];
            graphCtrl.albumId.photos.map(function(photo) {
                parallel.push(function(cb) {
                    console.log("ss", $window.settings.services.webUrl + "/files/albums/" + graphCtrl.albumId._id + "/" + photo);
                    GraphService.graphApi(graphCtrl.accountInfo.accessToken, "post", `/${graphCtrl.createdAlbumId}/photos`, {
                            // "url": $window.settings.services.webUrl + "/files/albums/" + graphCtrl.albumId._id + "/" + photo
                            "url": "https://www.w3schools.com/css/img_fjords.jpg"
                        })
                        .then(function(resp) {
                            if (resp.status == 200) {
                                cb(null, resp.data);
                            } else {
                                cb(true);
                            }
                        })
                        .catch(function() {
                            cb(true);
                        });
                });
            });
            async.parallel(parallel, function(err, results) {
                if (err) {
                    console.log("POST PHOTO", err);
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                } else {
                    toastr.success("Đăng hình ảnh lên album thành công.", "Thành công!");
                }
            });
        };

        graphCtrl.postGroup = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại dữ liệu và thử lại sau.", "Lỗi!");
                return;
            }
            // console.log("post", graphCtrl.feedId, graphCtrl.groupId);
            var promise;
            if (graphCtrl.postType == 0) {
                promise = GraphService.graphApi(graphCtrl.accountInfo.accessToken, "post", `/${graphCtrl.groupId}/feed`, {
                    "message": graphCtrl.feedId.message
                });
            } else if (graphCtrl.postType == 1) {
                promise = GraphService.graphApi(graphCtrl.accountInfo.accessToken, "post", `/${graphCtrl.groupId}/albums`, {
                    "name": graphCtrl.albumId.name,
                    "message": graphCtrl.albumId.message,
                });
            }
            promise.then(function(resp) {
                    if (resp.status == 200) {
                        console.log("Post group data:", resp.data);
                        toastr.success("Đã đăng lên nhóm thành công.", "Thành công!");

                        if (graphCtrl.postType == 1) {
                            graphCtrl.createdAlbumId = resp.data.id;
                            if (graphCtrl.createdAlbumId) {
                                graphCtrl.postPhotoToAlbum();
                            }
                        }
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function(err) {
                    console.log("Err", err);
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };
    }
})();
(function() {
    'use strict';

    GraphService.$inject = ["$http"];
    angular.module("Graph")
        .service("GraphService", GraphService);

    function GraphService($http) {
        return {
            graphApi: function(accessToken, method, apiUrl, payload) {
                method = method ? method.toLowerCase() : "get";
                method = method == 'get' ? method : "post";
                // if (apiUrl.indexOf("?") == -1) {
                //     apiUrl += "?access_token=" + accessToken;
                // } else {
                //     apiUrl += "&access_token=" + accessToken;
                // }
                if (!payload) {
                    payload = {};
                }
                payload.accessToken = accessToken;
                payload.apiUrl = apiUrl;
                payload.method = method;
                return $http.post(apiPath + "/api/user/graphApi", payload);
            }
        }
    }
})();
(function() {
    'use strict';

    angular.module('Schedule', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    ScheduleController.$inject = ["UserService", "CampaignService", "ScheduleService", "$cookies", "$scope", "$rootScope", "toastr", "$timeout", "$facebook", "$http"];
    angular.module("Schedule")
        .controller("ScheduleController", ScheduleController);

    function ScheduleController(UserService, CampaignService, ScheduleService, $cookies, $scope, $rootScope, toastr, $timeout, $facebook, $http) {
        var scheduleCtrl = this;
        scheduleCtrl.accountInfo = {};
        scheduleCtrl.schedule = {};
        scheduleCtrl.schedule.endTimeNumber = 3;
        scheduleCtrl.dateOptions = {
            minDate: new Date(new Date().getTime() + (60 * 60 * 1000)),
            maxDate: new Date(new Date().getTime() + (25 * 60 * 60 * 1000)),
            sideBySide: true
        };
        scheduleCtrl.minCycle = window.minCycle || 15;

        scheduleCtrl.getAccount = function() {
            UserService.account().then(function(resp) {
                if (resp.status == 200) {
                    scheduleCtrl.accountInfo = resp.data;
                    if (new Date(scheduleCtrl.accountInfo.tokenExpire) < new Date()) {
                        scheduleCtrl.accountInfo.accessToken = "";
                    }
                }
            });
        };

        scheduleCtrl.init = function() {
            scheduleCtrl.getAccount();
            ScheduleService.getSchedules()
                .then(function(resp) {
                    if (resp.status == 200) {
                        scheduleCtrl.listSchedules = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
            CampaignService.getCampaigns()
                .then(function(resp) {
                    if (resp.status == 200) {
                        scheduleCtrl.listCampaigns = resp.data;
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function() {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        scheduleCtrl.saveSchedule = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại dữ liệu và thử lại.", "Lỗi!");
                return;
            }
            ScheduleService.saveSchedule(scheduleCtrl.schedule)
                .then(function(resp) {
                    if (resp.status == 200) {
                        resp.data.campaignId = resp.data.campaignId._id || resp.data.campaignId;
                        if (!scheduleCtrl.schedule._id) {
                            if (!scheduleCtrl.listSchedules) {
                                scheduleCtrl.listSchedules = [];
                            }
                            scheduleCtrl.listSchedules.unshift(resp.data);
                            scheduleCtrl.selectScheduleIndex = 0;
                        } else {
                            for (var i in scheduleCtrl.listSchedules) {
                                if (scheduleCtrl.listSchedules[i]._id == scheduleCtrl.schedule._id) {
                                    scheduleCtrl.listSchedules[i] = resp.data;
                                    break;
                                }
                            }
                        }
                        scheduleCtrl.schedule = JSON.parse(JSON.stringify(resp.data));
                        $timeout(function() {
                            $scope.ScheduleForm.$setPristine();
                        }, 500);
                        toastr.success("Lưu lịch trình thành công.", "Thành công!");
                    } else {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    }
                })
                .catch(function(err) {
                    toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                });
        };

        scheduleCtrl.removeSchedule = function(scheduleId, index) {
            if (confirm("Bạn có chắc chắn muốn xóa?")) {
                ScheduleService.removeSchedule(scheduleId)
                    .then(function(resp) {
                        if (resp.status == 200 && resp.data) {
                            toastr.success("Xóa lịch trình thành công.", "Thành công!");
                            scheduleCtrl.listSchedules.splice(index, 1);
                            scheduleCtrl.resetSchedule();
                        } else {
                            toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        toastr.error("Có lỗi xảy ra, thử lại sau.", "Lỗi!");
                    });
            }
        };

        scheduleCtrl.selectSchedule = function(schedule, index) {
            scheduleCtrl.selectScheduleIndex = index;
            scheduleCtrl.schedule = JSON.parse(JSON.stringify(schedule));
            scheduleCtrl.changeCampaign();
            Common.scrollTo("#schedule-top", 'fast');
            $timeout(function() {
                $scope.ScheduleForm.$setPristine();
            }, 500);
        };

        scheduleCtrl.resetSchedule = function() {
            scheduleCtrl.schedule = {};
        };

        scheduleCtrl.runSchedule = function(scheduleId, index) {
            if (confirm("Bạn có chắc chắn chạy lịch trình này?")) {
                index = index ? index : scheduleCtrl.selectScheduleIndex;
                ScheduleService.runSchedule(scheduleId)
                    .then(function(resp) {
                        if (resp.status == 200) {
                            scheduleCtrl.listSchedules[index] = resp.data.data;
                            scheduleCtrl.schedule = resp.data.data;
                            toastr.success(resp.data.msg, "Thành công!");
                        } else {
                            toastr.error("Có lỗi xảy ra, vui lòng thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        console.log("err", err);
                        toastr.error(err.data.message, "Lỗi!");
                    });
            }
        };

        scheduleCtrl.stopSchedule = function(scheduleId, index) {
            if (confirm("Bạn có chắc chắn dừng lịch trình này?")) {
                index = index ? index : scheduleCtrl.selectScheduleIndex;
                ScheduleService.stopSchedule(scheduleId)
                    .then(function(resp) {
                        if (resp.status == 200) {
                            scheduleCtrl.listSchedules[index] = resp.data.data;
                            scheduleCtrl.schedule = resp.data.data;
                            toastr.success(resp.data.msg, "Thành công!");
                        } else {
                            toastr.error("Có lỗi xảy ra, vui lòng thử lại sau.", "Lỗi!");
                        }
                    })
                    .catch(function(err) {
                        toastr.error(err.message, "Lỗi!");
                    });
            }
        };

        scheduleCtrl.changeCampaign = function() {
            scheduleCtrl.campaignDescription = undefined;
            for (var i in scheduleCtrl.listCampaigns) {
                if (scheduleCtrl.listCampaigns[i]._id == scheduleCtrl.schedule.campaignId) {
                    scheduleCtrl.campaignDescription = scheduleCtrl.listCampaigns[i].description || undefined;
                    break;
                }
            }
        };
    }
})();
(function() {
    'use strict';

    ScheduleService.$inject = ["$http"];
    angular.module("Schedule")
        .service("ScheduleService", ScheduleService);

    function ScheduleService($http) {
        return {
            getSchedules: function() {
                return $http.get(apiPath + "/api/schedule/getSchedules");
            },
            saveSchedule: function(data) {
                return $http.post(apiPath + "/api/schedule/saveSchedule", data);
            },
            removeSchedule: function(id) {
                return $http.post(apiPath + "/api/schedule/removeSchedule", { scheduleId: id });
            },
            runSchedule: function(id) {
                return $http.post(apiPath + "/api/schedule/runSchedule", { scheduleId: id });
            },
            stopSchedule: function(id) {
                return $http.post(apiPath + "/api/schedule/stopSchedule", { scheduleId: id });
            }
        }
    }
})();
(function() {
    'use strict';

    angular.module('User', [])
        .config(["$interpolateProvider", function($interpolateProvider) {
            $interpolateProvider.startSymbol('{[');
            $interpolateProvider.endSymbol(']}');
        }]);
})();
(function() {
    'use strict';

    UserController.$inject = ["UserService", "$cookies", "$rootScope", "toastr", "$timeout", "$facebook", "$http"];
    angular.module("User")
        .controller("UserController", UserController);

    function UserController(UserService, $cookies, $rootScope, toastr, $timeout, $facebook, $http) {
        var userCtrl = this;
        userCtrl.accountInfo = {};
        userCtrl.showLoading = false;

        userCtrl.showApiError = function(message) {
            if (window.location.href.search("/trang-ca-nhan") == -1 &&
                window.location.href.search("/trang/") == -1 &&
                window.location.href.search("/tro-giup") == -1) {
                toastr.error(message, "Lỗi");
                $timeout(function() {
                    window.location.href = window.settings.services.webUrl + "/trang-ca-nhan";
                }, 2000);
            }
        }

        $rootScope.$on("NO_ACCESS_TOKEN_ERROR", function() {
            userCtrl.showApiError("Bạn chưa có mã truy cập, hãy đến trang cá nhân, bổ sung thông tin và nhận mã truy cập.");
        });

        $rootScope.$on("TOKEN_HAS_EXPIRED_ERROR", function() {
            userCtrl.showApiError("Mã truy cập đã hết hạn, hãy đến trang cá nhân và cập nhật mã truy cập.");
        });

        userCtrl.getAccount = function() {
            UserService.account().then(function(resp) {
                    if (resp.status == 200) {
                        userCtrl.accountInfo = resp.data;
                        if (resp.data.appId && resp.data.appSecret) {
                            userCtrl.appIdValid = true;
                        }
                        if (new Date(userCtrl.accountInfo.tokenExpire) < new Date()) {
                            userCtrl.accountInfo.accessToken = "";
                        }
                        if (userCtrl.accountInfo.includes('admin')) {
                            userCtrl.accountInfo.isAdmin = true;
                        }
                        userCtrl.showLoading = true;
                    }
                })
                .catch(function() {
                    userCtrl.showLoading = true;
                });
        };

        userCtrl.getAccount();

        userCtrl.login = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại dữ liệu và thử lại.", "Lỗi!");
                return;
            }
            UserService.login({
                    email: userCtrl.form.email,
                    password: userCtrl.form.password,
                })
                .then(function(resp) {
                    if (resp.status == 200) {
                        console.log("Resp", resp);
                        $cookies.put('token', resp.data.token, {
                            path: "/"
                        });
                        $cookies.put('appId', resp.data.appId, {
                            path: "/"
                        });
                        window.location.reload();
                    } else {
                        toastr.error("Đăng nhập không hợp lệ.", "Lỗi!");
                    }
                })
                .catch(function(err) {
                    toastr.error("Đăng nhập không hợp lệ.", "Lỗi!");
                });
        };

        userCtrl.logout = function() {
            UserService.logout()
                .then(function(res) {
                    $cookies.remove('token');
                    window.location.reload();
                }).catch(function(res) {
                    $cookies.remove('token');
                    window.location.reload();
                });
        };

        userCtrl.register = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại thông tin đã nhập.", "Lỗi!");
                return;
            }
            UserService.register({
                    email: userCtrl.form.email,
                    password: userCtrl.form.password,
                    name: userCtrl.form.name,
                })
                .then(function(resp) {
                    console.log("Resp", resp);
                    // window.location.reload();
                    toastr.success("Đăng ký tài khoản thành công!", "Thông báo!");
                    $timeout(function() {
                        userCtrl.login(true);
                    }, 2000);
                })
                .catch(function(resp) {
                    var error = resp.data;
                    toastr.error(error.message || error, "Thông báo!");
                });
        };

        function updateProfile(data, reload, message) {
            UserService.update(data)
                .then(function(resp) {
                    console.log("Resp", resp);
                    // window.location.reload();
                    message = message || "Cập nhật tài khoản thành công.";
                    if (reload) {
                        message += " Đang làm mới trang.";
                    }
                    toastr.success("Cập nhật tài khoản thành công!", "Thông báo!");
                    if (resp.data.appId) {
                        $cookies.put('appId', resp.data.appId, {
                            path: "/"
                        });
                    }
                    if (reload) {
                        $timeout(function() { window.location.reload(); }, 2000);
                    }
                })
                .catch(function(resp) {
                    var error = resp.data;
                    toastr.error(error.message || error, "Thông báo!");
                });
        }

        userCtrl.update = function(valid) {
            if (!valid) {
                toastr.error("Kiểm tra lại thông tin đã nhập.", "Lỗi!");
                return;
            }
            updateProfile({
                name: userCtrl.accountInfo.name,
                appId: userCtrl.accountInfo.appId,
                timelineId: userCtrl.accountInfo.timelineId,
                accessToken: userCtrl.accountInfo.accessToken,
                appSecret: userCtrl.accountInfo.appSecret,
                tokenExpire: userCtrl.accountInfo.tokenExpire,
                removeAccessToken: !userCtrl.appIdValid
            }, true);
        };

        userCtrl.getAccessToken = function() {
            $facebook.login().then(function(resp) {
                console.log("getAccessToken", resp);
                if (resp.authResponse && resp.authResponse.accessToken) {
                    // userCtrl.accountInfo.accessToken = resp.authResponse.accessToken;
                    userCtrl.accountInfo.timelineId.unshift({
                        type: 'personal',
                        id: resp.authResponse.userID,
                        name: 'Dòng thời gian cá nhân'
                    });
                    userCtrl.extendToken(resp.authResponse.accessToken);
                }
            });
        };

        userCtrl.extendToken = function(token) {
            // $facebook.api(`/oauth/access_token?grant_type=fb_exchange_token&client_id=${userCtrl.accountInfo.appId}&client_secret=${userCtrl.accountInfo.appSecret}&fb_exchange_token=${userCtrl.accountInfo.accessToken}`)
            //     .then(function(resp) {
            //         console.log("extendToken", resp);
            //     });
            UserService.extendAccessToken({
                    accessToken: token,
                    appId: userCtrl.accountInfo.appId,
                    appSecret: userCtrl.accountInfo.appSecret,
                })
                .then(function(resp) {
                    if (resp.status == 200) {
                        userCtrl.accountInfo.accessToken = resp.data.access_token;
                        userCtrl.accountInfo.tokenExpire = new Date(new Date().getTime() + resp.data.expires_in * 1000);
                        userCtrl.update(true);
                    }
                });
        };

        userCtrl.getTimelineInfo = function(keyword, type) {
            if (!keyword || !type) {
                toastr.error("Nhập từ khóa tìm kiếm và chọn 1 loại dòng thời gian", "Lỗi");
                return;
            } else {
                userCtrl.isLoading = true;
                $facebook.api(`/search?q=${keyword}&type=${type}&access_token=${userCtrl.accountInfo.accessToken}`)
                    .then(function(resp) {
                        console.log("get group info", resp);
                        if (resp.data && resp.data.length) {
                            userCtrl.listTimelines = resp.data;
                            // for (var i in resp.data) {
                            //     var fetchData = resp.data[i];
                            //     var exist = false;
                            //     for (var j in userCtrl.accountInfo.groups) {
                            //         var groupData = userCtrl.accountInfo.groups[j];
                            //         if (fetchData.id == groupData.id) {
                            //             exist = true;
                            //             break;
                            //         }
                            //     }
                            //     if (!exist) {
                            //         userCtrl.accountInfo.groups.unshift(fetchData);
                            //     }
                            // }
                            // updateProfile({
                            //     groups: userCtrl.accountInfo.groups
                            // }, false, "Đã cập nhật danh sách nhóm thành công.");
                        } else {
                            toastr.error("Không lấy được thông tin.", "Lỗi!");
                        }
                        userCtrl.isLoading = false;
                    }, function(err) {
                        console.log("timeline info", err);
                        userCtrl.isLoading = false;
                    });
            }
        };

        userCtrl.removeTimeline = function(index) {
            if (confirm("Bạn có chắc chắn muốn xóa?")) {
                var timelineId = userCtrl.accountInfo.timelineId.splice(index, 1);
                updateProfile({
                    timelineId: userCtrl.accountInfo.timelineId,
                    removeTimelineId: timelineId
                }, false, "Đã cập nhật danh sách nhóm thành công.");
            }
        };

        // userCtrl.fetchGroup = function() {
        //     $facebook.api(`/me?fields=groups&access_token=${userCtrl.accountInfo.accessToken}`)
        //         .then(function(resp) {
        //             console.log("resp", resp);
        //         }, function(err) {
        //             console.log("err", err);
        //         });
        // };

        userCtrl.resetAccessToken = function() {
            userCtrl.appIdValid = false;
            userCtrl.accountInfo.accessToken = null;
            userCtrl.accountInfo.tokenExpire = null;
        };

        userCtrl.resetListTimeline = function() {
            userCtrl.listTimelines = [];
        };

        userCtrl.addTimeline = function(timeline) {
            var fetchData = timeline;
            var exist = false;
            for (var j in userCtrl.accountInfo.timelineId) {
                var timelineData = userCtrl.accountInfo.timelineId[j];
                if (fetchData.id == timelineData.id) {
                    exist = true;
                    break;
                }
            }
            if (!exist) {
                userCtrl.accountInfo.timelineId.unshift({
                    type: userCtrl.timelineType,
                    id: fetchData.id,
                    name: fetchData.name
                });
            }
            timeline.disableClass = 'disabled';
            updateProfile({
                timelineId: userCtrl.accountInfo.timelineId,
            }, false, "Đã cập nhật danh sách nhóm thành công.");
        };
    }
})();
(function() {
    'use strict';

    UserService.$inject = ["$http"];
    angular.module("User")
        .service("UserService", UserService);

    function UserService($http) {
        var account;
        return {
            login: function(data) {
                return $http({
                    method: "POST",
                    url: apiPath + "/api/user/login",
                    data: data
                });
            },
            logout: function(data) {
                return $http({
                    method: "GET",
                    url: apiPath + "/api/user/logout",
                });
            },
            account: function(data) {
                if (!account) {
                    account = $http({
                        method: "GET",
                        url: apiPath + "/api/user/account",
                    });
                }
                return account;
            },
            register: function(data) {
                return $http({
                    method: "POST",
                    url: apiPath + "/api/user/register",
                    data: data
                });
            },
            update: function(data) {
                return $http({
                    method: "POST",
                    url: apiPath + "/api/user/update",
                    data: data
                });
            },
            extendAccessToken: function(data) {
                return $http({
                    method: "POST",
                    url: apiPath + "/api/user/extendAccessToken",
                    data: data
                });
            },
        }
    }
})();