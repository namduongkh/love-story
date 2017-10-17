'use strict';
/**
 * Created by chung on 7/23/15.
 */
angular.module('core').factory("Option", function($rootScope) {

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
});