'use strict';

// Chapters controller
angular.module('chapters').controller('ChaptersController', ['$scope', '$stateParams', '$location', '$window', 'Option', 'Authentication', 'Chapters', 'Categories', 'Notice', 'localStorageService', 'ChapterSvc', 'Tags', 'Users', 'SearchSelectSvc', 'FileUploader',
    function($scope, $stateParams, $location, $window, Option, Authentication, Chapters, Categories, Notice, localStorageService, ChapterSvc, Tags, Users, SearchSelectSvc, FileUploader) {

        if (!Authentication.user.name) {
            $location.path('signin');
        }

        $scope.apiUrl = $window.settings.services.apiUrl;

        $scope.webUrl = $window.settings.services.webUrl;

        $scope.statuses = Option.getStatus();

        // $scope.features = Option.getFeatureChapter();

        $scope.authentication = Authentication;

        $scope.communities = {};

        $scope.tags = {};

        $scope.chaptersPath = '/files/chapters/';

        $scope.isUploadImage = false;

        $scope.isInvalidFile = false;

        var uploader = $scope.uploader = new FileUploader({
            url: $scope.apiUrl + '/api/upload/image',
            formData: [{
                type: 'chapters'
            }],
            autoUpload: true
        });

        // FILTERS
        uploader.filters.push({
            name: 'imageFilter',
            fn: function(item /*{File|FileLikeObject}*/ , options) {
                var type = '|' + item.type.slice(item.type.lastIndexOf('/') + 1) + '|';
                return '|jpg|png|jpeg|bmp|gif|'.indexOf(type) !== -1;
            }
        });
        // CALLBACKS
        uploader.onWhenAddingFileFailed = function(item /*{File|FileLikeObject}*/ , filter, options) {
            //console.info('onWhenAddingFileFailed', item, filter, options);
        };
        uploader.onBeforeUploadItem = function(item) {
            $scope.$apply(function() {
                $scope.isUploadImage = true;
            });
        };
        uploader.onSuccessItem = function(fileItem, response, status, headers) {
            $scope.review_image = $scope.webUrl + $scope.chaptersPath + response.file.filename;
            if ($scope.chapter) {
                $scope.chapter.image = response.file.filename;
            } else {
                $scope.image = response.file.filename;
            }
        };

        uploader.onCompleteItem = function(fileItem, response, status, headers) {
            $scope.$apply(function() {
                $scope.isUploadImage = false;
            });
        };

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
                ChapterSvc.uploadChapterContentImage(data)
                    .then(resp => {
                        if (resp.status == 200) {
                            var path = $scope.webUrl + $scope.chaptersPath + resp.data.location;
                            console.log({ path });
                            success(path);
                        }
                    })
            }
        };

        // Init chapter
        $scope.tags = Tags.getList({}, function(result) {});
        $scope.users = Users.query({
            role: 'user',
            page: 'all',
            status: 1
        }, function(resp) {});

        $scope.gotoList = function() {
            $location.path('chapters');
        }

        $scope.categories = Categories.query({});

        // Create new Chapter
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
            // Create new Chapter object
            var chapter = new Chapters({
                title: this.title,
                slug: this.slug,
                feature: this.feature,
                // teaser: this.teaser,
                image: this.image,
                thumb: this.thumb,
                content: this.content,
                status: this.status,
                category: this.category,
                meta: this.meta,
                communityId: this.community,
                tags: this.tag,
                user: this.user
            });

            // Redirect after save
            chapter.$save(function(response) {

                var data = {
                    id: response._id
                }
                ChapterSvc.getImageFromContent(data).then(resp => {
                    if (response.error) {
                        Notice.setNotice(response.message, 'ERROR', true);
                    } else {
                        Notice.setNotice("Save chapter success!", 'SUCCESS');
                        if (gotoList) {
                            $scope.gotoList();
                        } else {
                            $location.path('chapters/' + response._id + '/edit');
                            // $scope.success = "Insert chapter success!";
                            $scope.submitted = false;
                            $scope.title = '';
                        }
                    }
                });
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Remove existing Chapter
        $scope.remove = function(chapterId) {
            if (confirm("Do you want to remove?")) {

                var chapter = Chapters.get({
                    chapterId: chapterId
                });

                chapter.$remove({
                    chapterId: chapterId
                });

                for (var i in $scope.items) {
                    if ($scope.items[i]._id == chapterId) {
                        $scope.items.splice(i, 1);
                    }
                }

                Notice.setNotice("Delete chapter success!", 'SUCCESS');

                if ($stateParams.chapterId) {
                    $scope.gotoList();
                } else {
                    Notice.requireChange();
                }
            }
        };

        // Update existing Chapter
        $scope.update = function(isValid, gotoList) {
            var gotoList = typeof gotoList !== 'undefined' ? gotoList : null;
            $scope.submitted = true;
            $scope.userError = null;
            if ($scope.chapter.user == null) {
                $scope.userError = "You did not select a field";
                isValid = false;
            }
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var chapter = $scope.chapter;
            delete chapter.created;
            delete chapter.__v;
            chapter.$update(function(resp) {
                //$location.path('chapters/' + chapter._id);
                var data = { id: resp._id }
                ChapterSvc.getImageFromContent(data).then(result => {
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

        // Find existing Chapter
        $scope.findOne = function() {
            $scope.chapter = Chapters.get({
                chapterId: $stateParams.chapterId
            }, function(resp) {
                // Tags.query({ communityId: resp.communityId, status: 1, getList: 'true', type: 'chapter' }, function(result) {
                //     $scope.taglist = result;
                // })
                if ($scope.chapter.thumb) {
                    $scope.review_thumb = $scope.webUrl + $scope.chaptersPath + resp._id + '/' + $scope.chapter.thumb;
                }
                if ($scope.chapter.image) {
                    $scope.review_image = $scope.webUrl + $scope.chaptersPath + resp._id + '/' + $scope.chapter.image;
                }
                // if ($scope.chapter.user) {
                //     SearchSelectSvc.updateNgModel($scope.chapter.user);
                // }
                $scope.render_select = true;
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
            localStorageService.set('chapter.filterData', {
                currentPage: $scope.currentPage,
                search: $scope.search
            });
            Chapters.query(options, function(data) {
                $scope.items = data.items;
                $scope.totalItems = data.totalItems;
                $scope.itemsPerPage = data.itemsPerPage;
                $scope.numberVisiblePages = data.numberVisiblePages;
                $scope.totalPage = data.totalPage || 1;

            });
        }

        // Find a list of Chapters
        $scope.find = function() {
            if (!$.isEmptyObject($location.search())) {
                var filterData = $location.search();
                $scope.currentPage = Number(filterData.currentPage) || 1;
                $scope.search.keyword = filterData.keyword;
                $scope.search.category = filterData.category;
                $scope.search.status = !isNaN(filterData.status) ? Number(filterData.status) : null;
                $scope.search.feature = !isNaN(filterData.feature) ? Number(filterData.feature) : null;
            } else {
                var filterData = localStorageService.get('chapter.filterData');
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
            $scope.search = {};
            $scope.currentPage = 1;
            getListData();
        };

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
                $scope.chapter.slug = new_slug;
            } else {
                $scope.slug = new_slug;
            }
        };
        //Sreach Chapterer
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