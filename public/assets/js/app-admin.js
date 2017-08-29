'use strict';

// console.log("adminUrl", adminUrl);
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
    // Init module configuration options
    var applicationModuleName = 'mean';
    var applicationModuleVendorDependencies = ['ngResource', 'ui.router', 'ngSanitize',
        'ngMessages', 'ngFileUpload', 'ngCookies', 'LocalStorageModule', 'ui.tinymce'
    ];

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
                    }
                });
            }
        };
    }]);
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

angular.module('core').factory("Notice", ["$rootScope", function($rootScope) {
    var queue = [];
    var oldMessage = "";
    var currentMessage = "";

    $rootScope.$on("$stateChangeStart", function() {
        oldMessage = currentMessage;
        currentMessage = queue.shift() || "";
        // console.log("stateChangeStart", currentMessage, queue);
    });

    $rootScope.$on("requireChange", function() {
        oldMessage = currentMessage;
        currentMessage = queue.shift() || "";
        // console.log("requireChange", currentMessage, queue);
    });

    $rootScope.$on("$stateChangeError", function() {
        queue.push(oldMessage);
        currentMessage = "";
    });

    return {
        setNotice: function(message, type, require) {
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
            $http.post($window.settings.services.apiUrl + '/api/user/login', data).then(function(response) {
                if (response.status == 200) {
                    response = response.data;
                    if (response.token) {
                        $window.location.href = '/';
                    }
                    $scope.error = response.message;
                }

            }).catch(function(response) {
                $scope.error = response.message;
            });
        };

        $scope.signout = function() {
            $http.get($window.settings.services.apiUrl + '/api/user/logout').then(function(response) {
                if (response.status == 200) {
                    response = response.data;
                    $scope.authentication.user = '';
                    $cookies.remove('token');
                    $window.location.href = '/';
                }
            }).catch(function(response) {
                $scope.error = response.message;
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
        Menus.addMenuItem('topbar', 'Categories', 'categories', 'dropdown', '/categories(/create)?');
        Menus.addSubMenuItem('topbar', 'categories', 'List Categories', 'categories');
        Menus.addSubMenuItem('topbar', 'categories', 'New Category', 'categories/create');
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

'use strict';
/**
 * Created by chung on 7/23/15.
 */
angular.module('core').factory("Option", ["$rootScope", function($rootScope) {

    var statuses = [{ name: "Publish", value: 1 }, { 'name': "Unpublish", value: 0 }];

    var tag_statuses = [{ name: "Publish", value: 1 }, { name: "Unpublish", value: 0 }];

    var features = [{ name: "Yes", value: 1 }, { 'name': "No", value: 0 }];

    var yesno = [{ name: "Yes", value: 1 }, { 'name': "No", value: 0 }];

    var roles = [{ name: 'Admin', value: 'admin' }, { name: 'User', value: 'user' }];

    var genders = [{ name: 'male', value: 'male' }, { name: 'female', value: 'female' }];

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
        Menus.addSubMenuItem('topbar', 'pages', 'Tạo mới', 'pages/create');
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
        Menus.addMenuItem('topbar', 'Chia sẻ & thảo luận', 'posts', 'dropdown', '/posts(/create)?');
        Menus.addSubMenuItem('topbar', 'posts', 'Danh sách bài viết', 'posts');
        // Menus.addSubMenuItem('topbar', 'posts', 'New Post', 'posts/create');
    }
]).config(['$stateProvider',
    function($stateProvider) {
        // posts state routing
        $stateProvider.
        state('listPosts', {
            url: '/posts',
            templateUrl: '/modules/admin-post/views/list-posts.client.view.html'
        }).
        state('createPost', {
            url: '/posts/create',
            templateUrl: '/modules/admin-post/views/create-post.client.view.html'
        }).
        state('viewPost', {
            url: '/posts/:postId',
            templateUrl: '/modules/admin-post/views/view-post.client.view.html'
        }).
        state('editPost', {
            url: '/posts/:postId/edit',
            templateUrl: '/modules/admin-post/views/edit-post.client.view.html'
        });
    }
]);
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

        $scope.features = Option.getFeaturePost();

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

        $scope.categories = Categories.query({
            type: 'post'
        });

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
angular.module('posts')
.service("PostSvc", ["$window", "$http", function($window, $http) {
    return {
        uploadPostContentImage: function(data) {
            return $http.post($window.settings.services.userApi + '/api/upload/uploadPostContentImage', data);
        },
        getImageFromContent: function(data) {
            return $http.post($window.settings.services.userApi + '/api/post/getImageFromContent', data);
        }
    }
}])
'use strict';

ApplicationConfiguration.registerModule('tag');

angular.module('tag').run(['Menus',
    function(Menus) {
        // Set top bar menu items
        Menus.addMenuItem('topbar', 'Tags', 'tag', 'dropdown', '/tags(/create)?');
        Menus.addSubMenuItem('topbar', 'tag', 'List Tags', 'tags');
        Menus.addSubMenuItem('topbar', 'tag', 'New Tag', 'tags/create');
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
                url: $window.settings.services.userApi + "/api/action/convertCountTag",
            },
            getList: {
                method: "GET",
                url: "/tag/getList",
            }
        })
    }
])