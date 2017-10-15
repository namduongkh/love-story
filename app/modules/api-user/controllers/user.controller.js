'use strict';
const mongoose = require('mongoose');
const User = mongoose.model('User');
const Boom = require('boom');
const JWT = require('jsonwebtoken');
const ErrorHandler = require("../../../utils/error.js");
const _ = require('lodash');

exports.login = {
    handler: function(request, reply) {
        let cookieOptions = request.server.configManager.get('web.cookieOptions');
        let {
            email,
            password,
        } = request.payload;
        User.findOne({
                email: email
            })
            .then(user => {
                // console.log("user", user);
                user.authenticate(password, function(err, result) {
                    if (err || !result) {
                        return reply(Boom.unauthorized("Đăng nhập không hợp lệ"));
                    }
                    if (result) {
                        var session = {
                            valid: true, // this will be set to false when the person logs out
                            id: user._id, // a random session id,
                            name: user.name,
                            email: user.email,
                            scope: user.roles,
                            tokenExpire: user.tokenExpire,
                            exp: new Date().getTime() + 30 * 60 * 1000 // expires in 30 minutes time
                        };
                        const secret = request.server.configManager.get('web.jwt.secret');
                        var token = JWT.sign(session, secret); // synchronous
                        reply({
                                token: token,
                                appId: user.appId,
                                id: user._id
                            })
                            .header("Authorization", token)
                            .state("appId", user.appId, cookieOptions)
                            .state("accessToken", user.accessToken, cookieOptions)
                            // .state("tokenExpire", user.tokenExpire, cookieOptions)
                            .state("token", token, cookieOptions);
                    }
                });
            })
            .catch(err => {
                return reply(Boom.unauthorized(ErrorHandler.getErrorMessage(err)));
            });
    },
};

exports.register = {
    handler: function(request, reply) {
        let { email, password, name } = request.payload;
        let user = new User(request.payload);
        user.hashPassword(request.payload.password, function(err, hash) {
            user.password = hash;
            const promise = user.save();
            promise.then(user => {
                return reply(user);
            }).catch(err => {
                // console.log("Err", err);
                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            });
        });
    }
};

exports.update = {
    pre: [{
        method: getAccountUser,
        assign: 'user'
    }],
    auth: 'jwt',
    handler: function(request, reply) {
        let { name, appId, accessToken, appSecret, tokenExpire, removeAccessToken, timelineId, removeTimelineId } = request.payload;
        let { user } = request.pre;

        user.name = name || user.name;
        user.appId = appId || user.appId;
        user.accessToken = accessToken || user.accessToken;
        user.appSecret = appSecret || user.appSecret;
        user.tokenExpire = tokenExpire || user.tokenExpire;
        user.timelineId = timelineId || user.timelineId;

        if (removeAccessToken) {
            user.accessToken = "";
            user.tokenExpire = "";
        }

        const promise = user.save();
        promise.then(user => {
                if (removeTimelineId) {
                    Campaign.find({
                            timelineId: removeTimelineId
                        })
                        .then(function(campaigns) {
                            _.map(campaigns, function(campaign) {
                                campaign.timelineId = undefined;
                                campaign.save();
                            });
                            return null;
                        });
                }
                return reply(user)
                    .state("appId", user.appId, request.server.configManager.get("web.cookieOptions"))
                    .state("accessToken", user.accessToken, request.server.configManager.get("web.cookieOptions"))
                    // .state("tokenExpire", user.tokenExpire.toLocaleString(), request.server.configManager.get("web.cookieOptions"));
            })
            .catch(err => {
                // console.log("Err", err);
                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            });
    }
};

exports.logout = {
    auth: 'jwt',
    handler: function(request, reply) {
        let cookieOptions = request.server.configManager.get('web.cookieOptions');
        reply({ status: true }).header("Authorization", '')
            .unstate('appId', cookieOptions)
            .unstate('token', cookieOptions)
            .unstate('accessToken', cookieOptions)
            // .unstate('tokenExpire', cookieOptions);
    },
};

exports.account = {
    pre: [{
        method: getAccountUser,
        assign: 'user'
    }],
    // auth: 'jwt',
    handler: function(request, reply) {
        var user = request.pre.user
        if (user) {
            user = user.toJSON();
            if (user.password) {
                user.password = "haspassword";
            }
            if (!user.accessToken) {
                user.noAccessToken = true;
            }
            if (user.tokenExpire && new Date(user.tokenExpire) < new Date()) {
                user.tokenHasExpired = true;
            }
            return reply(user);
        }
        reply(Boom.unauthorized('User is not found'));
    }
};

function getAccountUser(request, reply) {
    if (request.auth.isAuthenticated) {
        const id = request.auth.credentials.id;
        let promise = User
            .findOne({
                _id: id
            })
            // .lean();
        promise
            .then(function(user) {
                // console.log("User:", user);
                reply(user)
            })
            .catch(function(err) {
                request.log(['error'], err);
                return reply.continue();
            });
    } else {
        return reply.continue();
    }
}

exports.generateAdmin = {
    handler: function(request, reply) {
        let email = request.query.email;
        let user = new User({
            name: "Admin",
            email: email,
            roles: ["user", "admin"]
        });
        user.hashPassword("admin", function(err, encrypted) {
            user.password = encrypted;
            user.save().then(function() {
                return reply({ status: true, msg: "Generate successful" });
            });
        });
        // User.findOne({ email: email })
        //     .then(function(user) {
        //         if (user) {
        //             if (!user.roles) {
        //                 user.roles = [];
        //             }
        //             user.roles.push("admin");
        //             user.save()
        //                 .then(function() {
        //                     return reply("Success!");
        //                 });
        //         } else {
        //             return reply("User not exist!");
        //         }
        //     });
    }
};