'use strict';

// console.log("adminUrl", adminUrl);
// Init the application configuration module for AngularJS application
var ApplicationConfiguration = (function() {
    // Init module configuration options
    var applicationModuleName = 'mean';
    var applicationModuleVendorDependencies = ['ngResource', 'ui.router', 'ngSanitize', 'ngMessages', 'ngFileUpload', 'ngCookies', 'LocalStorageModule', 'ui.tinymce', 'ui.select2'];

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

angular.module(ApplicationConfiguration.applicationModuleName).config(function(localStorageServiceProvider) {
    localStorageServiceProvider.setPrefix(ApplicationConfiguration.applicationModuleName);
});

//Then define the init function for starting up the application
angular.element(document).ready(function() {
    //Fixing facebook bug with redirect
    //if (window.location.hash === '#_=_') window.location.hash = '#!';

    //Then init the app
    angular.bootstrap(document, [ApplicationConfiguration.applicationModuleName]);
});