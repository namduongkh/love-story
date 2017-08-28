var apiPath = window.location.origin;
if (window.location.port) {
    apiPath = window.settings.services.apiUrl;
}

(function() {
    'use strict';

    const dependencyModules = ["User", "Core", "Feed", "Graph", "Album", "Campaign", "Schedule",
        "ngCookies", "ngAnimate", "toastr", "angular-loading-bar", "ngMessages", "ngFacebook", "ngFileUpload", "ae-datetimepicker", "ui.select", "ui.tinymce"
    ];

    angular
        .module("HapiApp", dependencyModules)
        .config(function($httpProvider, $facebookProvider) {
            $httpProvider.defaults.withCredentials = true;

            if (window.appId) {
                $facebookProvider.setAppId(window.appId);
                $facebookProvider.setPermissions("email,publish_actions,user_managed_groups,user_photos");
            }
        })
        .run(function($window) {
            if (window.appId) {
                (function() {
                    // If we've already installed the SDK, we're done
                    if (document.getElementById('facebook-jssdk')) { return; }

                    // Get the first script element, which we'll use to find the parent node
                    var firstScriptElement = document.getElementsByTagName('script')[0];

                    // Create a new script element and set its id
                    var facebookJS = document.createElement('script');
                    facebookJS.id = 'facebook-jssdk';

                    // Set the new script's source to the source of the Facebook JS SDK
                    facebookJS.src = '//connect.facebook.net/en_US/all.js';

                    // Insert the Facebook JS SDK into the DOM
                    firstScriptElement.parentNode.insertBefore(facebookJS, firstScriptElement);
                }());
            }
        })
        .config(function($locationProvider) {
            $locationProvider.html5Mode({
                enabled: true,
                requireBase: false,
                rewriteLinks: false
            });
        });
})();