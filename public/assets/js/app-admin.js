'use strict';

// console.log("adminUrl", adminUrl);
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
    // Init module configuration options
    var applicationModuleName = 'mean';
    var applicationModuleVendorDependencies = ['ngResource', 'ui.router', 'ngSanitize', 'ngMessages', 'ngFileUpload', 'ngCookies', 'LocalStorageModule', 'ui.tinymce', 'ui.select2', 'angularFileUpload'];

    // Add a new vertical module
    var registerModule = function(moduleName, dependencies) {
        // Create angular module
        angular.module(moduleName, dependencies || []);

        // Add the module to the AngularJS configuration file
        angular.module(applicationModuleName).requires.push(moduleName);
    };

    return {
        applicationModuleName: applicationModuleName,
        applicationModuleVendorDependencies: applicationModuleVendorDependencies,
        registerModule: registerModule
    };
})();


//Start by defining the main module and adding the module dependencies
angular.module(ApplicationConfiguration.applicationModuleName, ApplicationConfiguration.applicationModuleVendorDependencies);

// Setting HTML5 Location Mode
angular.module(ApplicationConfiguration.applicationModuleName).config(['$locationProvider', '$httpProvider',
    function($locationProvider, $httpProvider) {
        //$locationProvider.html5Mode(true);
        $httpProvider.defaults.withCredentials = true;
        $locationProvider
            .html5Mode({
                enabled: window.enabledHtml5Mode,
                requireBase: false
            })
            .hashPrefix('!');
    }
]);

angular.module(ApplicationConfiguration.applicationModuleName).config(["localStorageServiceProvider", function(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix(ApplicationConfiguration.applicationModuleName);
}]);

//Then define the init function for starting up the application
angular.element(document).ready(function() {
    //Fixing facebook bug with redirect
    //if (window.location.hash === '#_=_') window.location.hash = '#!';

    //Then init the app
    angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});
'use strict';
ApplicationConfiguration.registerModule('core');
// Setting up route
angular.module('core').config(['$stateProvider', '$urlRouterProvider',
    function($stateProvider, $urlRouterProvider) {
        // Redirect to home view when route not found
        $urlRouterProvider.otherwise('/');

        // Home state routing
        $stateProvider.
        state('home', {
            url: '/',
            templateUrl: '/modules/admin-core/views/home.html'
        });
    }
]);
'use strict';
angular.module('core').factory('Authentication', ['$window', function($window) {
    var auth = {
        user: $window.user
    };

    return auth;
}]);

//Menu service used for managing  menus
angular.module('core').service('Menus', [

    function() {
        // Define a set of default roles
        this.defaultRoles = ['*'];

        // Define the menus object
        this.menus = {};

        // A private function for rendering decision 
        var shouldRender = function(user) {
            if (user) {
                if (!!~this.roles.indexOf('*')) {
                    return true;
                } else {
                    for (var userRoleIndex in user.roles) {
                        for (var roleIndex in this.roles) {
                            if (this.roles[roleIndex] === user.roles[userRoleIndex]) {
                                return true;
                            }
                        }
                    }
                }
            } else {
                return this.isPublic;
            }

            return false;
        };

        // Validate menu existance
        this.validateMenuExistance = function(menuId) {
            if (menuId && menuId.length) {
                if (this.menus[menuId]) {
                    return true;
                } else {
                    throw new Error('Menu does not exists');
                }
            } else {
                throw new Error('MenuId was not provided');
            }

            return false;
        };

        // Get the menu object by menu id
        this.getMenu = function(menuId) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Return the menu object
            return this.menus[menuId];
        };

        // Add new menu object by menu id
        this.addMenu = function(menuId, isPublic, roles) {
            // Create the new menu
            this.menus[menuId] = {
                isPublic: isPublic || false,
                roles: roles || this.defaultRoles,
                items: [],
                shouldRender: shouldRender
            };

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeMenu = function(menuId) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Return the menu object
            delete this.menus[menuId];
        };

        // Add menu item object
        this.addMenuItem = function(menuId, menuItemTitle, menuItemURL, menuItemType, menuItemUIRoute, isPublic, roles, position) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Push new menu item
            this.menus[menuId].items.push({
                title: menuItemTitle,
                link: menuItemURL,
                menuItemType: menuItemType || 'item',
                menuItemClass: menuItemType,
                uiRoute: menuItemUIRoute || ('/' + menuItemURL),
                isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].isPublic : isPublic),
                roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].roles : roles),
                position: position || 0,
                items: [],
                shouldRender: shouldRender
            });

            // Return the menu object
            return this.menus[menuId];
        };

        // Add submenu item object
        this.addSubMenuItem = function(menuId, rootMenuItemURL, menuItemTitle, menuItemURL, menuItemUIRoute, isPublic, roles, position) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item
            for (var itemIndex in this.menus[menuId].items) {
                if (this.menus[menuId].items[itemIndex].link === rootMenuItemURL) {
                    // Push new submenu item
                    this.menus[menuId].items[itemIndex].items.push({
                        title: menuItemTitle,
                        link: menuItemURL,
                        uiRoute: menuItemUIRoute || ('/' + menuItemURL),
                        isPublic: ((isPublic === null || typeof isPublic === 'undefined') ? this.menus[menuId].items[itemIndex].isPublic : isPublic),
                        roles: ((roles === null || typeof roles === 'undefined') ? this.menus[menuId].items[itemIndex].roles : roles),
                        position: position || 0,
                        shouldRender: shouldRender
                    });
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeMenuItem = function(menuId, menuItemURL) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item to remove
            for (var itemIndex in this.menus[menuId].items) {
                if (this.menus[menuId].items[itemIndex].link === menuItemURL) {
                    this.menus[menuId].items.splice(itemIndex, 1);
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        // Remove existing menu object by menu id
        this.removeSubMenuItem = function(menuId, submenuItemURL) {
            // Validate that the menu exists
            this.validateMenuExistance(menuId);

            // Search for menu item to remove
            for (var itemIndex in this.menus[menuId].items) {
                for (var subitemIndex in this.menus[menuId].items[itemIndex].items) {
                    if (this.menus[menuId].items[itemIndex].items[subitemIndex].link === submenuItemURL) {
                        this.menus[menuId].items[itemIndex].items.splice(subitemIndex, 1);
                    }
                }
            }

            // Return the menu object
            return this.menus[menuId];
        };

        //Adding the topbar menu
        this.addMenu('topbar');
    }
]);

angular.module('core').factory("Notice", ["$rootScope", "$transitions", function($rootScope, $transitions) {
    var queue = [];
    var oldMessage = "";
    var currentMessage = "";

    $transitions.onStart({}, function(trans) {
        oldMessage = currentMessage;
        currentMessage = queue.shift() || "";
        // console.log("onStart")
    });

    $transitions.onError({}, function(trans) {
        queue.push(oldMessage);
        currentMessage = "";
        // console.log("onError")
    });

    // $rootScope.$on("$stateChangeStart", function() {
    //     console.log("$stateChangeStart");
    //     oldMessage = currentMessage;
    //     currentMessage = queue.shift() || "";
    //     // console.log(currentMessage);
    // });

    $rootScope.$on("requireChange", function() {
        oldMessage = currentMessage;
        currentMessage = queue.shift() || "";
        // console.log(currentMessage);
    });

    // $rootScope.$on("$stateChangeError", function() {
    //     queue.push(oldMessage);
    //     currentMessage = "";
    // });

    function _setNotice(message, type, require) {
        var require = typeof require !== 'undefined' ? require : false;
        queue.push({
            type: type,
            message: message
        });
        if (require) {
            $rootScope.$broadcast('requireChange');
            // console.log('requireChange');
        }
        // console.log('Queue',queue);
    }

    return {
        setNotice: _setNotice,
        error: function(message, require) {
            _setNotice(message, 'ERROR', require);
        },
        success: function(message, require) {
            _setNotice(message, 'SUCCESS', require);
        },
        info: function(message, require) {
            _setNotice(message, 'INFO', require);
        },
        getNotice: function() {
            return currentMessage;
        },
        requireChange: function() {
            $rootScope.$broadcast('requireChange');
        },
        SUCCESS: 'SUCCESS',
        ERROR: 'ERROR',
        INFO: 'INFO',
        clearNotice: function() {
            queue = [];
            currentMessage = "";
            $rootScope.$broadcast('CLEAR_NOTICE');
        }
    };
}]);
'use strict';

ApplicationConfiguration.registerModule('auth');

angular.module('auth').config(['$stateProvider',
	function($stateProvider) {
	}
]); 
'use strict';

angular.module('auth').controller('AuthenticationController', ['$scope', '$http', '$location', '$window', 'Authentication', '$cookies',
    function($scope, $http, $location, $window, Authentication, $cookies) {
        $scope.authentication = Authentication;
        $scope.webUrl = $window.settings.services.webUrl;

        $scope.signin = function() {
            $scope.isSubmit = true;
            var data = $scope.credentials;
            data.scope = 'admin';
            $http.post($window.settings.services.apiUrl + '/api/user/login', data)
                .then(function(response) {
                    if (response.status == 200) {
                        response = response.data;
                        if (response.token) {
                            $window.location.href = '/';
                        }
                        $scope.error = response.message;
                    }
                })
                .catch(function(response) {
                    $scope.error = response.data.message;
                });
        };

        $scope.signout = function() {
            $http.get($window.settings.services.apiUrl + '/api/user/logout')
                .then(function(response) {
                    if (response.status == 200) {
                        response = response.data;
                        $scope.authentication.user = '';
                        $cookies.remove('token');
                        $window.location.href = '/';
                    }
                })
                .catch(function(response) {
                    $scope.error = response.data.message;
                });
        };
    }
]);
'use strict';

angular.module('auth').factory('Authentication', ['$window', function($window) {
	var auth = {
		user: $window.user
	};
	return auth;
}]);

'use strict';

ApplicationConfiguration.registerModule('caches');
// Configuring the Articles module
angular.module('caches').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Cache', 'caches', 'dropdown', '/caches(/create)?');
        Menus.addSubMenuItem('topbar', 'caches', 'Danh sách', 'caches');
        // Menus.addSubMenuItem('topbar', 'caches', 'New cache', 'caches/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // caches state routing
        $stateProvider.
        state('listCaches', {
            url: '/caches',
            templateUrl: '/modules/admin-cache/views/list-caches.client.view.html'
        });
    }
]);
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
'use strict';

//Caches service used to communicate Caches REST endpoints
angular.module('caches').factory('Caches', ['$resource',
    function($resource) {
        return $resource('cache/:cacheId', {
            cacheId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false,
            },
            removeAll: {
                url: '/cache/removeAll',
                method: 'PUT'
            }
        });
    }
]);
'use strict';

ApplicationConfiguration.registerModule('categories');
// Configuring the Articles module
angular.module('categories').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Thể loại', 'categories', 'dropdown', '/categories(/create)?');
        Menus.addSubMenuItem('topbar', 'categories', 'Danh sách', 'categories');
        Menus.addSubMenuItem('topbar', 'categories', 'Thể loại mới', 'categories/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // Categories state routing
        $stateProvider.
        state('listCategories', {
            url: '/categories',
            templateUrl: '/modules/admin-category/views/list-categories.client.view.html'
        }).
        state('createCategory', {
            url: '/categories/create',
            templateUrl: '/modules/admin-category/views/create-category.client.view.html'
        }).
        state('viewCategory', {
            url: '/categories/:categoryId',
            templateUrl: '/modules/admin-category/views/view-category.client.view.html'
        }).
        state('editCategory', {
            url: '/categories/:categoryId/edit',
            templateUrl: '/modules/admin-category/views/edit-category.client.view.html'
        });
    }
]);
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
        // $scope.types = Option.getTypes();
        $scope.statuses = Option.getStatus();
        $scope.gotoList = function() {
            $location.path('categories');
        }

        // Create new Category
        $scope.create = function(isValid, goToList) {
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            // Create new Category object
            var category = new Categories({
                name: this.name,
                slug: this.slug,
                status: this.status,
                description: this.description
            });
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
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var category = $scope.category;
            delete category.__v;
            delete category.created;

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
                // console.log('data category', data.items);
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
            $scope.search = {};
            $scope.currentPage = 1;
            getListData();
        };

        // $scope.validateIdentity = function(identity) {
        //     $scope.identity_error = '';
        //     if (identity) {
        //         Categories.getByIdentity({
        //             identity: identity
        //         }, function(result) {
        //             if (result._id) {
        //                 if ($scope.category) {
        //                     if ($scope.category._id.toString() !== result._id.toString()) {
        //                         $scope.identity_error = "This identity has exist!";
        //                     }
        //                 } else {
        //                     $scope.identity_error = "This identity has exist!";
        //                 }
        //             }
        //         });
        //     }
        // };
    }
]);
'use strict';

//Categories service used to communicate Categories REST endpoints
angular.module('categories').factory('Categories', ['$resource',
    function ($resource) {
        return $resource('category/:categoryId', {
            categoryId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false,
            },
            getByIdentity: {
                method: 'GET',
                url: '/category/:identity/identity',
                params: {
                    identity: '@identity'
                }
            },
        });
    }
]);
'use strict';

ApplicationConfiguration.registerModule('chapters');
// Configuring the Articles module
angular.module('chapters').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        // Menus.addMenuItem('topbar', 'Tập truyện', 'chapters', 'dropdown', '/chapters(/create)?');
        // Menus.addSubMenuItem('topbar', 'chapters', 'Danh sách', 'chapters');
        // Menus.addSubMenuItem('topbar', 'chapters', 'Tập truyện mới', 'chapters/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // chapters state routing
        $stateProvider
            .state('listChapters', {
                url: '/chapters?:postId',
                templateUrl: '/modules/admin-chapter/views/list-chapters.client.view.html'
            })
            .state('createChapter', {
                url: '/chapters/create?:postId',
                templateUrl: '/modules/admin-chapter/views/create-chapter.client.view.html'
            })
            // .state('viewChapter', {
            //     url: '/chapters/:chapterId',
            //     templateUrl: '/modules/admin-chapter/views/view-chapter.client.view.html'
            // })
            .state('editChapter', {
                url: '/chapters/:chapterId/edit?:postId',
                templateUrl: '/modules/admin-chapter/views/edit-chapter.client.view.html'
            });
    }
]);
'use strict';

// Chapters controller
angular.module('chapters').controller('ChaptersController', ['$scope', '$stateParams', '$location', '$window', 'Option', 'Authentication', 'Chapters', 'Categories', 'Notice', 'localStorageService', 'ChapterSvc', 'Tags', 'Users', 'SearchSelectSvc', 'FileUploader', 'Posts', '$state',
    function($scope, $stateParams, $location, $window, Option, Authentication, Chapters, Categories, Notice, localStorageService, ChapterSvc, Tags, Users, SearchSelectSvc, FileUploader, Posts, $state) {

        if ($location.search().postId) {
            $scope.postIds = Posts.query({});
            $scope.queryPostId = $location.search().postId;
            $scope.postId = $scope.queryPostId;
            if ($scope.post) {
                $scope.post.postId = $scope.queryPostId;
            }
        } else {
            $state.go("listPosts");
        }

        if (!Authentication.user.name) {
            $location.path('signin');
        }

        $scope.chaptersPath = '/files/chapters/';

        $scope.apiUrl = $window.settings.services.apiUrl;

        $scope.webUrl = $window.settings.services.webUrl;

        $scope.statuses = Option.getStatus();

        $scope.authentication = Authentication;

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
                            console.log({ path })
                            success(path);
                        }
                    })
            }
        };

        $scope.gotoList = function() {
            // $location.path('chapters');
            $state.go("listChapters", { postId: $scope.queryPostId });
        }

        // Create new Chapter
        $scope.create = function(isValid, gotoList) {
            $scope.submitted = true;
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            // Create new Chapter object
            var chapter = new Chapters({
                title: this.title,
                slug: this.slug,
                content: this.content,
                status: this.status,
                meta: this.meta,
                postId: this.postId,
            });

            // Redirect after save
            chapter.$save(function(response) {
                // var data = { id: response._id };
                // ChapterSvc.getImageFromContent(data).then(resp => {
                if (response.error) {
                    Notice.setNotice(response.message, 'ERROR', true);
                } else {
                    Notice.setNotice("Save chapter success!", 'SUCCESS');
                    if (gotoList) {
                        $scope.gotoList();
                    } else {
                        // $location.path('chapters/' + response._id + '/edit');
                        // $scope.success = "Insert chapter success!";
                        $state.go("editChapters", { postId: $scope.queryPostId });
                        $scope.submitted = false;
                        Notice.requireChange();
                    }
                }
                // });
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
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var chapter = $scope.chapter;
            delete chapter.created;
            delete chapter.__v;
            chapter.$update(function(resp) {
                //$location.path('chapters/' + chapter._id);
                // var data = { id: resp._id }
                // ChapterSvc.getImageFromContent(data).then(result => {
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
                // });
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
    }
]);
'use strict';

//Chapters service used to communicate Chapters REST endpoints
angular.module('chapters').factory('Chapters', ['$resource',
    function($resource) {
        return $resource('chapter/:chapterId', {
            chapterId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false
            }
        });
    }
]);
angular.module('chapters')
    .service("ChapterSvc", ["$window", "$http", function($window, $http) {
        return {
            uploadChapterContentImage: function(data) {
                return $http.post($window.settings.services.apiUrl + '/api/upload/uploadChapterContentImage', data);
            },
            getImageFromContent: function(data) {
                return $http.post($window.settings.services.apiUrl + '/api/chapter/getImageFromContent', data);
            }
        }
    }]);
/**
 * Enhanced Select2 Dropmenus
 *
 * @AJAX Mode - When in this mode, your value will be an object (or array of objects) of the data used by Select2
 *     This change is so that you do not have to do an additional query yourself on top of Select2's own query
 * @params [options] {object} The configuration options passed to $.fn.select2(). Refer to the documentation
 */
angular.module('ui.select2', []).value('uiSelect2Config', {}).directive('uiSelect2', ['uiSelect2Config', '$timeout', function(uiSelect2Config, $timeout) {
    var options = {};
    if (uiSelect2Config) {
        angular.extend(options, uiSelect2Config);
    }
    return {
        require: 'ngModel',
        priority: 1,
        compile: function(tElm, tAttrs) {
            var watch,
                repeatOption,
                repeatAttr,
                isSelect = tElm.is('select'),
                isMultiple = angular.isDefined(tAttrs.multiple);

            // Enable watching of the options dataset if in use
            if (tElm.is('select')) {
                repeatOption = tElm.find('option[ng-repeat], option[data-ng-repeat]');

                if (repeatOption.length) {
                    repeatAttr = repeatOption.attr('ng-repeat') || repeatOption.attr('data-ng-repeat');
                    watch = jQuery.trim(repeatAttr.split('|')[0]).split(' ').pop();
                }
            }

            return function(scope, elm, attrs, controller) {
                // instance-specific options
                var opts = angular.extend({}, options, scope.$eval(attrs.uiSelect2));

                /*
                Convert from Select2 view-model to Angular view-model.
                */
                var convertToAngularModel = function(select2_data) {
                    var model;
                    if (opts.simple_tags) {
                        model = [];
                        angular.forEach(select2_data, function(value, index) {
                            model.push(value.id);
                        });
                    } else {
                        model = select2_data;
                    }
                    return model;
                };

                /*
                Convert from Angular view-model to Select2 view-model.
                */
                var convertToSelect2Model = function(angular_data) {
                    var model = [];
                    if (!angular_data) {
                        return model;
                    }

                    if (opts.simple_tags) {
                        model = [];
                        angular.forEach(
                            angular_data,
                            function(value, index) {
                                model.push({ 'id': value, 'text': value });
                            });
                    } else {
                        model = angular_data;
                    }
                    return model;
                };

                if (isSelect) {
                    // Use <select multiple> instead
                    delete opts.multiple;
                    delete opts.initSelection;
                } else if (isMultiple) {
                    opts.multiple = true;
                }

                if (controller) {
                    // Watch the model for programmatic changes
                    scope.$watch(tAttrs.ngModel, function(current, old) {
                        if (!current) {
                            return;
                        }
                        if (current === old) {
                            return;
                        }
                        controller.$render();
                    }, true);
                    controller.$render = function() {
                        if (isSelect) {
                            elm.select2('val', controller.$viewValue);
                        } else {
                            if (opts.multiple) {
                                var viewValue = controller.$viewValue;
                                if (angular.isString(viewValue)) {
                                    viewValue = viewValue.split(',');
                                }
                                elm.select2('data', convertToSelect2Model(viewValue));
                            } else {
                                if (angular.isObject(controller.$viewValue)) {
                                    elm.select2('data', controller.$viewValue);
                                } else if (!controller.$viewValue) {
                                    elm.select2('data', null);
                                } else {
                                    elm.select2('val', controller.$viewValue);
                                }
                            }
                        }
                    };

                    // Watch the options dataset for changes
                    if (watch) {
                        scope.$watch(watch, function(newVal, oldVal, scope) {
                            if (angular.equals(newVal, oldVal)) {
                                return;
                            }
                            // Delayed so that the options have time to be rendered
                            $timeout(function() {
                                elm.select2('val', controller.$viewValue);
                                // Refresh angular to remove the superfluous option
                                elm.trigger('change');
                                if (newVal && !oldVal && controller.$setPristine) {
                                    controller.$setPristine(true);
                                }
                            });
                        });
                    }

                    // Update valid and dirty statuses
                    controller.$parsers.push(function(value) {
                        var div = elm.prev();
                        div
                            .toggleClass('ng-invalid', !controller.$valid)
                            .toggleClass('ng-valid', controller.$valid)
                            .toggleClass('ng-invalid-required', !controller.$valid)
                            .toggleClass('ng-valid-required', controller.$valid)
                            .toggleClass('ng-dirty', controller.$dirty)
                            .toggleClass('ng-pristine', controller.$pristine);
                        return value;
                    });

                    if (!isSelect) {
                        // Set the view and model value and update the angular template manually for the ajax/multiple select2.
                        elm.bind("change", function(e) {
                            e.stopImmediatePropagation();

                            if (scope.$$phase || scope.$root.$$phase) {
                                return;
                            }
                            scope.$apply(function() {
                                controller.$setViewValue(
                                    convertToAngularModel(elm.select2('data')));
                            });
                        });

                        if (opts.initSelection) {
                            var initSelection = opts.initSelection;
                            opts.initSelection = function(element, callback) {
                                initSelection(element, function(value) {
                                    controller.$setViewValue(convertToAngularModel(value));
                                    callback(value);
                                });
                            };
                        }
                    }
                }

                elm.ready(function() {
                    elm.bind("$destroy", function() {
                        try {
                            elm.select2("destroy");
                        } catch (e) {}
                    });
                });

                attrs.$observe('disabled', function(value) {
                    elm.select2('enable', !value);
                });

                attrs.$observe('readonly', function(value) {
                    elm.select2('readonly', !!value);
                });

                if (attrs.ngMultiple) {
                    scope.$watch(attrs.ngMultiple, function(newVal) {
                        attrs.$set('multiple', !!newVal);
                        elm.select2(opts);
                    });
                }

                // Initialize the plugin late so that the injected DOM does not disrupt the template compiler
                $timeout(function() {
                    elm.select2(opts);

                    // Set initial value - I'm not sure about this but it seems to need to be there
                    elm.val(controller.$viewValue);
                    // important!
                    controller.$render();

                    // Not sure if I should just check for !isSelect OR if I should check for 'tags' key
                    if (!opts.initSelection && !isSelect) {
                        controller.$setViewValue(
                            convertToAngularModel(elm.select2('data'))
                        );
                    }
                });
            };
        }
    };
}]);
angular.module('core').directive('ckEditor', [function () {
	return {
		require: '?ngModel',
		restrict: 'AEC',
		link: function (scope, elm, attr, model) {
			var isReady = false;
			var data = [];
			var ck = CKEDITOR.replace(elm[0]);

			function setData() {
				if (!data.length) { return; }

				var d = data.splice(0, 1);
				ck.setData(d[0] || '<span></span>', function () {
					setData();
					isReady = true;
				});
			}

			ck.on('instanceReady', function (e) {
				if (model) { setData(); }
			});

			elm.bind('$destroy', function () {
				ck.destroy(false);
			});

			if (model) {
				ck.on('change', function () {
					scope.$apply(function () {
						var data = ck.getData();
						if (data == '<span></span>') {
							data = null;
						}
						model.$setViewValue(data);
					});
				});

				model.$render = function (value) {
					if (model.$viewValue === undefined) {
						model.$setViewValue("");
						model.$viewValue = "";
					}

					data.push(model.$viewValue);

					if (isReady) {
						isReady = false;
						setData();
					}
				};
			}

		}
	};
}]);

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
    .directive('slugGenerator', ["$timeout", function($timeout) {
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
    }]);

angular.module('core').directive('renderSelect', ["$rootScope", "$compile", "$timeout", function($rootScope, $compile, $timeout) {
    // var html;
    // var renderSlider = function() {
    //     return '<select ui-select2 class="form-control" name="roles" data-ng-model="user.roles" id="roles" ng-options="item.value as item.name for item in userRoles" required multiple="multiple" size="2"></select>';
    // }
    return {
        restrict: 'A',
        link: function(scope, elem, attr) {
            var html = elem.html();
            // elem.empty();
            scope.$watch(attr.renderSelect, function(value) {
                if (value) {
                    $timeout(function() {
                        // elem.empty();
                        var markup = $compile(html)(scope);
                        elem.html(markup);
                    });
                }
            });
        }
    }
}]);

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
'use strict';

angular.module('core').controller('HeaderController', ['$scope', 'Authentication', 'Menus',
    function($scope, Authentication, Menus) {
        $scope.authentication = Authentication;
        $scope.isCollapsed = false;
        $scope.menu = Menus.getMenu('topbar');
    }
]);
'use strict';


angular.module('core').controller('HomeController', ['$scope', '$location', 'Authentication',
    function($scope, $location, Authentication) {
        // This provides Authentication context.
        $scope.authentication = Authentication;

        $scope.checkAuth = function() {
            if (!Authentication.user.name) {
                $location.path('signin');
            }
        }
    }
]);

'use strict';
/**
 * Created by chung on 7/23/15.
 */
angular.module('core').factory("Option", ["$rootScope", function($rootScope) {

    var statuses = [{ name: "Công khai", value: 1 }, { 'name': "Không công khai", value: 0 }];

    var tag_statuses = [{ name: "Công khai", value: 1 }, { name: "Không công khai", value: 0 }];

    var features = [{ name: "Có", value: 1 }, { 'name': "Không", value: 0 }];

    var yesno = [{ name: "Có", value: 1 }, { 'name': "Không", value: 0 }];

    var roles = [{ name: "Admin", value: 'admin' }, { 'name': "User", value: 'user' }];

    var genders = [{ name: 'Nam', value: 'male' }, { name: 'Nữ', value: 'female' }];

    var types = [{ name: 'Product', value: 'product' }, { name: 'Post', value: 'post' }, { name: 'Banner', value: 'banner' }];

    var bannerPositions = [{ name: 'home', value: 'home' }, { name: 'right', value: 'right' }];

    var adsPositions = [{ name: 'top', value: 'top' }, { name: 'right', value: 'right' }, { name: 'home', value: 'home' }];

    var tag_type = [{ name: "Product", value: 'product' }, { name: "Post", value: 'post' }];

    return {
        getStatus: function() {
            return statuses;
        },
        getTagStatus: function() {
            return tag_statuses;
        },
        getRoles: function() {
            return roles;
        },
        getGenders: function() {
            return genders;
        },
        getFeatures: function() {
            return features;
        },
        getTypes: function() {
            return types;
        },
        getYesNo: function() {
            return yesno;
        },
        getPositions: function() {
            return bannerPositions;
        },
        getAdsPositions: function() {
            return adsPositions;
        },
        getTagType: function() {
            return tag_type;
        },

    };
}]);
(function() {
    'use strict';



    angular
        .module('core')
        .service('SearchSelectSvc', ["$rootScope", function($rootScope) {
            return {
                updateNgModel: function(data) {
                    $rootScope.$broadcast("UPDATE_NG_MODEL", data);
                }
            }
        }]);


    angular
        .module('core')
        .directive('searchSelect', ["$compile", "$timeout", "$rootScope", function($compile, $timeout, $rootScope) {
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
        }]);

})();
angular.module('core')
	.directive('status', function () {
		return {
			restrict: 'EA', //E = element, A = attribute, C = class, M = comment
			link: function ($scope, element, attrs) {
				var tag =  '<span class="label label-warning">unpublish</span>';
				
				if(attrs.status==1){
					tag =  '<span class="label label-success">publish</span>';
				}
				element.append(tag);
			}
		}
	});
'use strict';

ApplicationConfiguration.registerModule('pages');
// Configuring the Articles module
angular.module('pages').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Trang', 'pages', 'dropdown', '/pages(/create)?');
        Menus.addSubMenuItem('topbar', 'pages', 'Danh sách', 'pages');
        Menus.addSubMenuItem('topbar', 'pages', 'Trang mới', 'pages/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {

        // Pages state routing
        $stateProvider.
        state('listPages', {
            url: '/pages',
            templateUrl: '/modules/admin-page/views/list-pages.client.view.html'
        }).
        state('createPage', {
            url: '/pages/create',
            templateUrl: '/modules/admin-page/views/create-page.client.view.html'
        }).
        state('viewPage', {
            url: '/pages/:pageId',
            templateUrl: '/modules/admin-page/views/view-page.client.view.html'
        }).
        state('editPage', {
            url: '/pages/:pageId/edit',
            templateUrl: '/modules/admin-page/views/edit-page.client.view.html'
        });
    }
]);
'use strict';

// Pages controller
angular.module('pages').controller('PagesController', ['$scope', '$rootScope', '$stateParams', '$location', 'Authentication', 'Pages', 'Notice', 'localStorageService',
    function($scope, $rootScope, $stateParams, $location, Authentication, Pages, Notice, localStorageService) {

        $scope.authentication = Authentication;

        if (!Authentication.user.name) {
            $location.path('signin');
        }
        $scope.gotoList = function() {
            $location.path('pages');
        }

        $scope.tinyMceOptions = {
            // menubar: false,
            plugins: "advlist code",
            // toolbar: 'formatselect | fontselect | fontsizeselect | bold italic underline | alignleft aligncenter alignright alignjustify | bullist numlist | code',
            // font_formats: 'Arial=arial,helvetica,sans-serif;Courier New=courier new,courier,monospace;AkrutiKndPadmini=Akpdmi-n',
            // fontsize_formats: '8pt 10pt 12pt 14pt 18pt 24pt 36pt',
            // block_formats: 'Paragraph=p;Header 1=h1;Header 2=h2;Header 3=h3',
        };

        // Create new Page
        $scope.create = function(isValid, gotoList) {
            var gotoList = typeof gotoList !== 'undefined' ? gotoList : null;
            $scope.submitted = true;
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            // Create new Page object
            var page = new Pages({
                title: this.title,
                //slug: this.slug,
                intro: this.intro,
                content: this.content,
                identity: this.identity
            });
            // Redirect after save
            page.$save(function(response) {
                if (response.error) {
                    Notice.setNotice(response.message, 'ERROR', true);
                } else {
                    Notice.setNotice("Save page success!", 'SUCCESS');
                    if (gotoList) {
                        $scope.gotoList();
                    } else {
                        $location.path('pages/' + response._id + '/edit');
                        $scope.submitted = false;
                        $scope.title = '';
                    }
                }
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Remove existing Page
        $scope.remove = function(pageId) {
            if (confirm("Do you want to remove?")) {

                var page = Pages.get({
                    pageId: pageId
                });

                page.$remove({
                    pageId: pageId
                }, function() {});

                for (var i in $scope.pages) {
                    if ($scope.pages[i]._id === pageId) {
                        $scope.pages.splice(i, 1);
                    }
                }

                Notice.setNotice("Delete page success!", 'SUCCESS');

                if ($stateParams.pageId) {
                    $scope.gotoList();
                } else {
                    Notice.requireChange();
                }
            }
        };

        // Update existing Page
        $scope.update = function(isValid, gotoList) {
            $scope.submitted = true;
            if (!isValid) {
                Notice.setNotice("Please check your fields and try again!", 'ERROR', true);
                return;
            }
            var page = $scope.page;
            delete page.__v;
            delete page.created;
            page.$update(function(resp) {
                if (resp.error) {
                    Notice.setNotice(resp.message, 'ERROR', true);
                } else {
                    Notice.setNotice("Update page success!", 'SUCCESS');
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

        // Find existing Page
        $scope.findOne = function() {
            $scope.page = Pages.get({
                pageId: $stateParams.pageId
            }, function() {});
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
                target_id: $scope.currentPage,
                keyword: $scope.search.keyword,
            };
            localStorageService.set('page.filterData', {
                currenttarget_id: $scope.currentPage,
                search: $scope.search
            });
            Pages.query(options, function(data) {
                $scope.pages = data.items;
                $scope.totalItems = data.totalItems;
                $scope.itemsPerPage = data.itemsPerPage;
                $scope.numberVisiblePages = data.numberVisiblePages;
                $scope.totalPage = data.totalPage || 1;
            });

        }

        // Find a list of Posts
        $scope.find = function() {
            // console.log(myListener);
            if (!$.isEmptyObject($location.search())) {
                var filterData = $location.search();
                $scope.currentPage = Number(filterData.currentPage) || 1;
                $scope.search.keyword = filterData.keyword;
            } else {
                var filterData = localStorageService.get('page.filterData');
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
    }
]);
'use strict';

//Pages service used to communicate Pages REST endpoints
angular.module('pages').factory('Pages', ['$resource',
    function($resource) {
        return $resource('page/:pageId', {
            pageId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false,
            }
        });
    }
]);
'use strict';

ApplicationConfiguration.registerModule('posts');
// Configuring the Articles module
angular.module('posts').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Bộ truyện', 'posts', 'dropdown', '/posts(/create)?');
        Menus.addSubMenuItem('topbar', 'posts', 'Danh sách', 'posts');
        Menus.addSubMenuItem('topbar', 'posts', 'Bộ truyện mới', 'posts/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // posts state routing
        $stateProvider
            .state('listPosts', {
                url: '/posts',
                templateUrl: '/modules/admin-post/views/list-posts.client.view.html'
            })
            .state('createPost', {
                url: '/posts/create',
                templateUrl: '/modules/admin-post/views/create-post.client.view.html'
            })
            // .state('viewPost', {
            //     url: '/posts/:postId',
            //     templateUrl: '/modules/admin-post/views/view-post.client.view.html'
            // })
            .state('editPost', {
                url: '/posts/:postId/edit',
                templateUrl: '/modules/admin-post/views/edit-post.client.view.html'
            });
    }
]);
'use strict';

// Posts controller
angular.module('posts').controller('PostsController', ['$scope', '$stateParams', '$location', '$window', 'Option', 'Authentication', 'Posts', 'Categories', 'Notice', 'localStorageService', 'Tags', 'Users', 'SearchSelectSvc', 'FileUploader',
    function($scope, $stateParams, $location, $window, Option, Authentication, Posts, Categories, Notice, localStorageService, Tags, Users, SearchSelectSvc, FileUploader) {

        if (!Authentication.user.name) {
            $location.path('signin');
        }

        $scope.apiUrl = $window.settings.services.apiUrl;

        $scope.webUrl = $window.settings.services.webUrl;

        $scope.statuses = Option.getStatus();

        // $scope.features = Option.getFeaturePost();

        $scope.authentication = Authentication;

        $scope.communities = {};

        $scope.tags = {};

        $scope.isUploadImage = false;

        $scope.isInvalidFile = false;

        var uploader = $scope.uploader = new FileUploader({
            url: $scope.apiUrl + '/api/upload/image',
            formData: [{
                type: 'posts'
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
            $scope.review_image = $scope.webUrl + $scope.postsPath + response.file.filename;
            if ($scope.post) {
                $scope.post.image = response.file.filename;
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
            // plugins: "image",
            // file_picker_types: 'image',
            // file_picker_callback: function(cb, value, meta) {
            //     var input = document.createElement('input');
            //     input.setAttribute('type', 'file');
            //     input.setAttribute('accept', 'image/*');

            //     // Note: In modern browsers input[type="file"] is functional without 
            //     // even adding it to the DOM, but that might not be the case in some older
            //     // or quirky browsers like IE, so you might want to add it to the DOM
            //     // just in case, and visually hide it. And do not forget do remove it
            //     // once you do not need it anymore.

            //     input.onchange = function() {
            //         var file = this.files[0];

            //         var reader = new FileReader();
            //         reader.readAsDataURL(file);
            //         reader.onload = function() {
            //             // Note: Now we need to register the blob in TinyMCEs image blob
            //             // registry. In the next release this part hopefully won't be
            //             // necessary, as we are looking to handle it internally.
            //             var id = file.name.substring(0, file.name.lastIndexOf('.')) + '_' + (new Date()).getTime();
            //             var blobCache = tinymce.activeEditor.editorUpload.blobCache;
            //             var base64 = reader.result.split(',')[1];
            //             var blobInfo = blobCache.create(id, file, base64);
            //             blobCache.add(blobInfo);

            //             // call the callback and populate the Title field with the file name
            //             cb(blobInfo.blobUri(), { title: file.name });
            //         };
            //     };

            //     input.click();
            // },
            // images_upload_handler: function(blobInfo, success, failure) {
            //     var data = {
            //         file: blobInfo.base64(),
            //         name: blobInfo.filename()
            //     }
            //     PostSvc.uploadPostContentImage(data)
            //         .then(resp => {
            //             if (resp.status == 200) {
            //                 var path = $scope.webUrl + $scope.postsPath + resp.data.location;
            //                 console.log({ path });
            //                 success(path);
            //             }
            //         })
            // }
        };

        // Init post
        $scope.tags = Tags.getList({}, function(result) {});
        $scope.users = Users.query({
            role: 'user',
            page: 'all',
            status: 1
        }, function(resp) {});

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
                description: this.description,
                status: this.status,
                category: this.category,
                meta: this.meta,
                communityId: this.community,
                tags: this.tag,
                user: this.user
            });

            // Redirect after save
            post.$save(function(response) {

                var data = {
                        id: response._id
                    }
                    // PostSvc.getImageFromContent(data).then(resp => {
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
                // });
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
                var data = { id: resp._id }
                    // PostSvc.getImageFromContent(data).then(result => {
                if (resp.error) {
                    Notice.setNotice(resp.message, 'ERROR', true);
                } else {
                    Notice.setNotice("Update post success!", 'SUCCESS');
                    if (gotoList) {
                        $scope.gotoList();
                    } else {
                        // $location.path('transactions/' + transaction._id);
                        Notice.requireChange();
                        $scope.submitted = false;
                    }
                }
                // });
            }, function(errorResponse) {
                Notice.setNotice(errorResponse.data.message, 'ERROR', true);
            });
        };

        // Find existing Post
        $scope.findOne = function() {
            $scope.post = Posts.get({
                postId: $stateParams.postId
            }, function(resp) {
                // Tags.query({ communityId: resp.communityId, status: 1, getList: 'true', type: 'post' }, function(result) {
                //     $scope.taglist = result;
                // })
                if ($scope.post.thumb) {
                    $scope.review_thumb = $scope.webUrl + $scope.postsPath + resp._id + '/' + $scope.post.thumb;
                }
                if ($scope.post.image) {
                    $scope.review_image = $scope.webUrl + $scope.postsPath + resp._id + '/' + $scope.post.image;
                }
                // if ($scope.post.user) {
                //     SearchSelectSvc.updateNgModel($scope.post.user);
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
'use strict';

//Posts service used to communicate Posts REST endpoints
angular.module('posts').factory('Posts', ['$resource',
    function($resource) {
        return $resource('post/:postId', {
            postId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false
            }
        });
    }
]);
// angular.module('posts')
//     .service("PostSvc", function($window, $http) {
//         return {
//             uploadPostContentImage: function(data) {
//                 return $http.post($window.settings.services.apiUrl + '/api/upload/uploadPostContentImage', data);
//             },
//             getImageFromContent: function(data) {
//                 return $http.post($window.settings.services.apiUrl + '/api/post/getImageFromContent', data);
//             }
//         }
//     });
'use strict';

ApplicationConfiguration.registerModule('tag');

angular.module('tag').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Nhãn', 'tag', 'dropdown', '/tags(/create)?');
        Menus.addSubMenuItem('topbar', 'tag', 'Danh sách', 'tags');
        Menus.addSubMenuItem('topbar', 'tag', 'Nhãn mới', 'tags/create');
        // Menus.addSubMenuItem('topbar', 'tag', 'Update Count', 'tags/update-count');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // Tags state routing
        $stateProvider
            .state('listTag', {
                url: '/tags',
                templateUrl: '/modules/admin-tag/views/list-tags.client.view.html'
            })
            .state('createTag', {
                url: '/tags/create',
                templateUrl: '/modules/admin-tag/views/create-tag.client.view.html'
            })
            .state('updateCountTag', {
                url: '/tags/update-count',
                templateUrl: '/modules/admin-tag/views/update-count-tag.client.view.html'
            })
            .state('viewTag', {
                url: '/tags/:tagId',
                templateUrl: '/modules/admin-tag/views/view-tag.client.view.html'
            })
            .state('editTag', {
                url: '/tags/:tagId/edit',
                templateUrl: '/modules/admin-tag/views/edit-tag.client.view.html'
            });

    }
]);
'use strict';

TagController.$inject = ["$scope", "$window", "Tags", "Option", "$stateParams", "Notice", "$location", "localStorageService", "Upload", "Authentication", "$timeout", "Categories"];
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
'use strict';

//Tags service used to communicate Categories REST endpoints
angular.module('tag').factory('Tags', ['$resource', '$window',
    function($resource, $window) {
        return $resource('tag/:tagId', {
            tagId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false,
            },
            getByIdentity: {
                method: 'GET',
                url: '/category/:identity/identity',
                params: {
                    identity: '@identity'
                }
            },
            convertCountTag: {
                method: "POST",
                url: $window.settings.services.apiUrl + "/api/action/convertCountTag",
            },
            getList: {
                method: "GET",
                url: "/tag/getList",
            }
        })
    }
])
'use strict';

ApplicationConfiguration.registerModule('users');

angular.module('users').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Người dùng', 'users', 'dropdown', '/users(/create)?');
        Menus.addSubMenuItem('topbar', 'users', 'Danh sách', 'users');
        Menus.addSubMenuItem('topbar', 'users', 'Người dùng mới', 'users/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // Users state routing
        $stateProvider
            .state('listUsers', {
                url: '/users',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('listPendingSeller', {
                url: '/users/list-pending?pending_seller',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('customListUsers', {
                url: '/users/list-:listName?socialSource?role',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('listFilterUsers', {
                url: '/users?socialSource?role',
                templateUrl: '/modules/admin-user/views/list-users.client.view.html'
            })
            .state('createUser', {
                url: '/users/create',
                templateUrl: '/modules/admin-user/views/create-user.client.view.html'
            })
            .state('reportUser', {
                url: '/users/reportUser',
                templateUrl: '/modules/admin-user/views/report-user.view.html'
            })
            // state('statisticCollect', {
            //     url: '/users/statisticCollect',
            //     templateUrl: '/modules/admin-user/views/statistic-collect-users.client.view.html'
            // })
            .state('viewProfile', {
                url: '/users/:userId/profile',
                templateUrl: '/modules/admin-user/views/profile.client.view.html'
            })
            .state('viewUser', {
                url: '/users/:userId',
                templateUrl: '/modules/admin-user/views/view-user.client.view.html'
            })
            .state('collectHistory', {
                url: '/users/:userId/collectHistory',
                templateUrl: '/modules/admin-user/views/list-collect-history.client.view.html'
            })
            .state('productBidHistory', {
                url: '/users/:userId/productBidHistory',
                templateUrl: '/modules/admin-user/views/list-product-bid-history.client.view.html'
            })
            .state('editUser', {
                url: '/users/:userId/edit',
                templateUrl: '/modules/admin-user/views/edit-user.client.view.html'
            });
    }
]);
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
                        var consol = bzResourceSvc.api($window.settings.services.apiUrl + '/api/upload/image-avatar').upload({}, fd, function(respon) {
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
            $scope.user.$promise.then(function(result) {
                console.log({ result });
            });
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
'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users').factory('Users', ['$resource', '$window',
    function($resource, $window) {
        return $resource('user/:userId', {
            userId: '@_id'
        }, {
            update: {
                method: 'PUT'
            },
            query: {
                isArray: false
            },
            getUserBid: {
                url: '/user/productBid/:product_id',
                method: 'GET',
                params: {
                    product_id: '@product_id',
                }
            },
            userByComment: {
                url: '/user/userByComment/:product_id',
                method: 'GET',
                params: {
                    product_id: '@product_id',
                }
            },
            userByFavorite: {
                url: '/user/userByFavorite/:product_id',
                method: 'GET',
                params: {
                    product_id: '@product_id',
                }
            },
            moveToTrash: {
                url: '/user/moveToTrash',
                method: 'PUT',
                params: {
                    id: '@id',
                }
            },
            removeVerifyPhone: {
                url: '/user/removeVerifyPhone',
                method: 'PUT',
                params: {
                    id: '@id',
                }
            },
            resetFCC: {
                url: '/user/resetFCC',
                method: 'POST',
                payload: {
                    id: '@id'
                }
            },
            statisticCollect: {
                url: '/user/statisticCollect',
                method: 'GET',
                isArray: false
            },
            collectHistory: {
                url: '/user/collectHistory',
                method: 'POST',
                payload: {
                    user_id: '@user_id',
                    page: '@page',
                }
            },
            productBidHistory: {
                url: '/user/productBidHistory',
                method: 'POST',
                payload: {
                    user_id: '@user_id',
                    page: '@page',
                }
            },
            statistic: {
                url: '/user/Statistic',
                method: 'GET'
            },
            userSeed: {
                url: '/user/getSeed',
                method: 'GET'
            },
            updateFavoritesCache: {
                method: "POST",
                url: $window.settings.services.apiUrl + "/api/favorite/update-favorite-cache",
                payload: {
                    data: '@data'
                }
            },
            confirmSeller: {
                method: "PUT",
                url: "/user/:user_id",
                params: {
                    user_id: '@user_id',
                    name: '@name',
                    checkBtnConfirm: '@checkBtnConfirm'
                }
            }
        });
    }
]);

angular.module('users').factory('SendNotify', ['$resource', '$window',
    function($resource, $window) {
        return $resource($window.settings.services.uploadApi + '/api/user/sendnotifytoseller', null, {
            sendnotifytoseller: {
                method: 'POST',
                params: {
                    name: '@name',
                    email: '@email'
                }
            },
            changesendnotifystatus: {
                url: '/user/change-send-notify-status',
                method: 'PUT',
                params: {
                    id: '@id',
                    is_send_notify: '@is_send_notify'
                }
            }
        });
    }
]);
angular.module('users')
    .service('bzResourceSvc', ["$resource", function($resource) {
        return {
            api: api
        };

        function api(apiName, params, methods) {

            methods = methods || {};
            methods.get = angular.extend({}, methods.get);

            methods.query = angular.extend({
                isArray: true
            }, methods.query);
            methods.save = angular.extend({
                method: 'POST'
            }, methods.save);
            methods.update = angular.extend({
                method: 'PUT'
            }, methods.update);
            methods.upload = angular.extend({
                method: 'POST',
                headers: {
                    'Content-Type': undefined
                },
                transformRequest: angular.identity
            }, methods.upload);


            var apiString = '';

            if (apiName.indexOf('.json') > -1 || apiName.indexOf('http://') > -1 || apiName.indexOf('https://') > -1) {
                apiString = apiName;
            } else {
                apiString = apiName;
            }

            return $resource(apiString, params, methods);
        }
    }])
    .service("PendingSellerSvc", ["$rootScope", function($rootScope) {
        return {
            openApproveModal: function(user) {
                $rootScope.$broadcast("OPEN_APPROVE_MODAL", {
                    user
                });
            }
        }
    }]);;