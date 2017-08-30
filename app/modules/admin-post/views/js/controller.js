'use strict';

// Posts controller
angular.module('posts').controller('PostsController', ['$scope', '$stateParams', '$location', '$window', 'Option', 'Authentication', 'Posts', 'Categories', 'Notice', 'localStorageService', 'PostSvc', 'Tags', 'Users', 'SearchSelectSvc',
    function($scope, $stateParams, $location, $window, Option, Authentication, Posts, Categories, Notice, localStorageService, PostSvc, Tags, Users, SearchSelectSvc) {

        if (!Authentication.user.name) {
            $location.path('signin');
        }
        $scope.uploadApi = $window.settings.services.uploadApi;
        $scope.webUrl = $window.settings.services.webUrl;

        $scope.statuses = Option.getStatus();

        $scope.features = Option.getFeatures();

        $scope.authentication = Authentication;

        $scope.tags = {};

        ///thumb upload

        $scope.isUploadImage0 = false;

        $scope.isInvalidFile0 = false;

        $scope.postsPath = '/files/posts/';

        $scope.tinymceOptions = {
            plugins: "image",
            file_picker_types: 'image',
            file_picker_callback: function(cb, value, meta) {
                var input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');

                // Note: In modern browsers input[type="file"] is functional without 
                // even adding it to the DOM, but that might not be the case in some older
                // or quirky browsers like IE, so you might want to add it to the DOM
                // just in case, and visually hide it. And do not forget do remove it
                // once you do not need it anymore.

                input.onchange = function() {
                    var file = this.files[0];

                    var reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = function() {
                        // Note: Now we need to register the blob in TinyMCEs image blob
                        // registry. In the next release this part hopefully won't be
                        // necessary, as we are looking to handle it internally.
                        var id = file.name.substring(0, file.name.lastIndexOf('.')) + '_' + (new Date()).getTime();
                        var blobCache = tinymce.activeEditor.editorUpload.blobCache;
                        var base64 = reader.result.split(',')[1];
                        var blobInfo = blobCache.create(id, file, base64);
                        blobCache.add(blobInfo);

                        // call the callback and populate the Title field with the file name
                        cb(blobInfo.blobUri(), { title: file.name });
                    };
                };

                input.click();
            },
            images_upload_handler: function(blobInfo, success, failure) {
                var data = {
                    file: blobInfo.base64(),
                    name: blobInfo.filename()
                }
                PostSvc.uploadPostContentImage(data)
                    .then(resp => {
                        if (resp.status == 200) {
                            var path = $scope.webUrl + $scope.postsPath + resp.data.location;
                            success(path);
                        }
                    })
            }
        };

        // Init post
        $scope.tags = Tags.getList({}, function(result) {});
        $scope.users = Users.query({
            role: 'user',
            page: 'all',
            status: 1
        }, function(resp) {});

        $scope.isUploadImage = false;

        $scope.isInvalidFile = false;

        $scope.gotoList = function() {
            $location.path('posts');
        }

        $scope.categories = Categories.query({});

        // Create new Post
        $scope.create = function(isValid, gotoList) {
            $scope.submitted = true;
            $scope.userError = false;
            if (this.user == null) {
                $scope.userError = "You did not select a field";
                isValid = false;
            }
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            // Create new Post object
            var post = new Posts({
                title: this.title,
                slug: this.slug,
                feature: this.feature,
                // teaser: this.teaser,
                image: this.image,
                thumb: this.thumb,
                content: this.content,
                status: this.status,
                category: this.category,
                attrs: this.attrs,
                communityId: this.community,
                tags: this.tag,
                user: this.user
            });

            // Redirect after save
            post.$save(function(response) {

                var data = {
                    id: response._id
                }
                PostSvc.getImageFromContent(data).then(resp => {
                    if (response.error) {
                        Notice.setNotice(response.message, 'ERROR', true);
                    } else {
                        Notice.setNotice("Save post success!", 'SUCCESS');
                        if (gotoList) {
                            $scope.gotoList();
                        } else {
                            $location.path('posts/' + response._id + '/edit');
                            // $scope.success = "Insert post success!";
                            $scope.submitted = false;
                            $scope.title = '';
                        }
                    }
                });
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Remove existing Post
        $scope.remove = function(postId) {
            if (confirm("Do you want to remove?")) {

                var post = Posts.get({
                    postId: postId
                });

                post.$remove({
                    postId: postId
                });

                for (var i in $scope.items) {
                    if ($scope.items[i]._id == postId) {
                        $scope.items.splice(i, 1);
                    }
                }

                Notice.setNotice("Delete post success!", 'SUCCESS');

                if ($stateParams.postId) {
                    $scope.gotoList();
                } else {
                    Notice.requireChange();
                }
            }
        };

        // Update existing Post
        $scope.update = function(isValid, gotoList) {
            var gotoList = typeof gotoList !== 'undefined' ? gotoList : null;
            $scope.submitted = true;
            $scope.userError = null;
            if ($scope.post.user == null) {
                $scope.userError = "You did not select a field";
                isValid = false;
            }
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var post = $scope.post;
            delete post.created;
            delete post.__v;
            post.$update(function(resp) {
                //$location.path('posts/' + post._id);
                var data = {
                    id: resp._id
                }
                PostSvc.getImageFromContent(data).then(result => {
                    if (resp.error) {
                        Notice.setNotice(resp.message, 'ERROR', true);
                    } else {
                        Notice.setNotice("Update page success!", 'SUCCESS');
                        if (gotoList) {
                            $scope.gotoList();
                        } else {
                            // $location.path('transactions/' + transaction._id);
                            Notice.requireChange();
                            $scope.submitted = false;
                        }
                    }
                });
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Find existing Post
        $scope.findOne = function() {
            $scope.post = Posts.get({
                postId: $stateParams.postId
            }, function(resp) {
                Tags.query({ communityId: resp.communityId, status: 1, getList: 'true', type: 'post' }, function(result) {
                    $scope.taglist = result;
                })
                if ($scope.post.thumb) {
                    $scope.review_thumb = $scope.webUrl + $scope.postsPath + resp._id + '/' + $scope.post.thumb;
                }
                if ($scope.post.image) {
                    $scope.review_image = $scope.webUrl + $scope.postsPath + resp._id + '/' + $scope.post.image;
                }
                if ($scope.post.user) {
                    SearchSelectSvc.updateNgModel($scope.post.user);

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
                communityId: $scope.search.communityId,
                category: $scope.search.category,
                tags: $scope.search.tags,
                status: $scope.search.status,
                feature: $scope.search.feature
            };
            localStorageService.set('post.filterData', {
                currentPage: $scope.currentPage,
                search: $scope.search
            });
            Posts.query(options, function(data) {
                $scope.items = data.items;
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
                $scope.search.category = filterData.category;
                $scope.search.status = !isNaN(filterData.status) ? Number(filterData.status) : null;
                $scope.search.feature = !isNaN(filterData.feature) ? Number(filterData.feature) : null;
            } else {
                var filterData = localStorageService.get('post.filterData');
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
            $scope.search.category = "";
            $scope.search.status = "";
            $scope.search.feature = "";
            $scope.search = {};
            $scope.currentPage = 1;
            getListData();
        };

        // change communities
        $scope.changeCommunity = function(communityId) {
            Tags.query({
                communityId: communityId,
                status: 1,
                getList: 'true',
                type: 'post'
            }, function(result) {
                $scope.taglist = result;
            })
            $scope.users = Users.query({
                role: 'user',
                page: 'all',
                registerCommunity: communityId,
                status: 1
            }, function(resp) {});
        }

        // tag create
        $scope.select2Options = {
            tags: [],
            multiple: true,
            simple_tags: true,
            createSearchChoice: function(term, data) {
                if ($(data).filter(function() {
                        return this.text.localeCompare(term) === 0;
                    }).length === 0) {
                    return { id: term, text: term };
                }
            }
        };

        // create slug
        $scope.changeSlug = function(value, edit) {
            var new_slug = slug(value).toLowerCase();
            if (edit) {
                $scope.post.slug = new_slug;
            } else {
                $scope.slug = new_slug;
            }
        };
        //Sreach Poster
        $scope.fetchDataSearch = function(keyword) {
            Users.query({
                keyword: keyword,
                status: 1
            }, function(data) {
                $scope.dataSearch = data.items;
            });
        };
    }
]);