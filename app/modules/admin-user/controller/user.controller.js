'use strict';

const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const mongoose = require('mongoose');
const User = mongoose.model('User');
const ErrorHandler = require(BASE_PATH + '/app/utils/error.js');
const Bcrypt = require('bcryptjs');
const _ = require('lodash');
const crypto = require('crypto');
const fs = require("fs");
const Slug = require('slug');
const async = require("async");

exports.getAll = {
    pre: [{
            method: getHasBidUser,
            assign: 'hasBid'
        },
        {
            method: getOptions,
            assign: 'options'
        },
        // {
        //     method: statisticActivity,
        //     assign: 'statistic'
        // }
    ],
    handler: function(request, reply) {
        let {
            hasBid,
            options,
            statistic
        } = request.pre;
        let page = request.query.page || 1;
        let random = Number(request.query.random);
        let select = request.query.select || {
            _id: 1,
            name: 1,
            email: 1,
            phone: 1,
            status: 1,
            pendingSeller: 1,
            is_seed: 1,
            social_info: 1,
            created: 1
        };
        let config = request.server.configManager;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');

        options = _.merge(hasBid.option, options);
        // console.log("Options: ", options);

        var promise = User.find(options)
            .select(select)
            // .populate('products_had_bid.productId')
            // .populate({
            //     path: 'favorite_product',
            //     match: {
            //         is_collection: true
            //     }
            // })
            .lean()
            .sort('id')
        if (page == 'all') {
            promise.then(function(data) {
                let randomed = [];
                let randomData = [];
                if (random) {
                    for (var i = 0; i < random; i++) {
                        let numberRandom = Math.floor((Math.random() * data.length) + 0);
                        if (randomed.indexOf(numberRandom) == -1) {
                            randomed.push(numberRandom);
                            randomData.push(data[numberRandom]);
                        } else {
                            i--;
                        }
                    }
                } else {
                    randomData = data;
                }
                return reply({
                    items: randomData
                });
            });
        } else {
            promise.paginate(page, itemsPerPage, function(err, items, total) {
                if (err) {
                    console.log(err)
                    request.log(['error', 'list', 'user'], err);
                    return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                }
                let totalPage = Math.ceil(total / itemsPerPage);
                let dataRes = {
                    status: 1,
                    totalItems: total,
                    totalPage: totalPage,
                    currentPage: page,
                    itemsPerPage: itemsPerPage,
                    numberVisiblePages: numberVisiblePages,
                    items: items,
                    statistic: statistic
                };
                return reply(dataRes);
            });
        }
    }
};

exports.getSeed = {
    handler: function(request, reply) {
        User.find({
                is_seed: 1
            }, 'name email avatar')
            .then(user => {
                return reply({ items: user })
            })
    }
}

exports.getAllStatistic = {
    pre: [{
            method: getHasBidUser,
            assign: 'hasBid'
        }, {
            method: getOptions,
            assign: 'options'
        }
        /*, {
                method: statisticActivity,
                assign: 'statistic'
            }*/
    ],
    handler: function(request, reply) {
        let {
            hasBid,
            options,
            // statistic
        } = request.pre;
        let page = request.query.page || 1;
        let config = request.server.configManager;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');

        options = _.merge(hasBid.option, options);
        // console.log("Options: ", options);

        var promise = User.find(options)
            .populate('products_had_bid.productId')
            .populate({
                path: 'favorite_product',
                match: {
                    is_collection: true
                }
            })
            .lean()
            .sort('id')
        if (page == 'all') {
            promise.then(function(data) {
                return reply({
                    items: data
                });
            });
        } else {
            promise.then(function(users) {
                // console.log(users.length);
                let products_had_bid = _.map(users, 'products_had_bid');
                let favorite_product = _.map(users, 'favorite_product');
                let total = users.length;

                favorite_product = favorite_product.filter(item => {
                    if (item && item.length > 0) {
                        return item;
                    }
                })
                products_had_bid = products_had_bid.filter(item => {
                    if (item && item.length > 0) {
                        return item;
                    }
                })

                let bidOrCollect = users.filter(item => {
                    if (item.products_had_bid && item.products_had_bid.length > 0) {
                        return item;
                    }
                    if (item.favorite_product && item.favorite_product.length > 0) {
                        return item;
                    }
                })

                let statistic = {
                    userBid: products_had_bid.length,
                    userCollect: favorite_product.length,
                    userBidOrCollect: bidOrCollect.length,
                    total: total
                };

                promise.paginate(page, itemsPerPage, function(err, items, total) {
                    // console.log(items.length);
                    if (err) {
                        console.log(err)
                        request.log(['error', 'list', 'user'], err);
                        return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                    }
                    let totalPage = Math.ceil(total / itemsPerPage);
                    let dataRes = {
                        status: 1,
                        totalItems: total,
                        totalPage: totalPage,
                        currentPage: page,
                        itemsPerPage: itemsPerPage,
                        numberVisiblePages: numberVisiblePages,
                        items: items,
                        statistic: statistic
                    };
                    return reply(dataRes);
                });
            });
        }
    }
}

exports.statisticCollect = {
    pre: [{
        method: getHasBidUser,
        assign: 'hasBid'
    }, {
        method: getOptions,
        assign: 'options'
    }],
    handler: function(request, reply) {
        let {
            hasBid,
            options
        } = request.pre;
        let page = request.query.page || 1;
        let config = request.server.configManager;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');

        options = _.merge(hasBid.option, options);
        // console.log("Options: ", options);

        var promise = User.find(options)
            .lean()
            .sort('id')
        if (page == 'all') {
            promise.then(function(data) {
                return reply({
                    items: data
                });
            });
        } else {
            promise.paginate(page, itemsPerPage, function(err, items, total) {
                if (err) {
                    request.log(['error', 'list', 'user'], err);
                    return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                }
                let totalPage = Math.ceil(total / itemsPerPage);
                let dataRes = {
                    status: 1,
                    totalItems: total,
                    totalPage: totalPage,
                    currentPage: page,
                    itemsPerPage: itemsPerPage,
                    numberVisiblePages: numberVisiblePages,
                    items: items
                };
                return reply(dataRes);
            });
        }
    }
};

exports.collectHistory = {
    handler: function(request, reply) {
        let { user_id } = request.payload;
        let page = request.payload.page || 1;
        let config = request.server.configManager;
        let itemsPerPage = config.get('web.paging.itemsPerPage');
        let numberVisiblePages = config.get('web.paging.numberVisiblePages');

        var promise = Favorite.find({
                user_id: user_id,
                is_collection: true
            })
            .populate({
                path: "product_id",
                select: "title slug status"
            })
            .select("product_id created is_collection")
            .lean()
            .sort('-created')
            .then(function(favorites) {
                favorites = _.filter(favorites, function(item) {
                    if (item.product_id && item.product_id._id && item.product_id.status == 1) {
                        return item;
                    }
                });
                if (page == 'all') {
                    return reply({
                        items: favorites
                    });
                } else {
                    let total = favorites.length;
                    let totalPage = Math.ceil(total / itemsPerPage);
                    let dataRes = {
                        status: 1,
                        totalItems: total,
                        totalPage: totalPage,
                        currentPage: page,
                        itemsPerPage: itemsPerPage,
                        numberVisiblePages: numberVisiblePages,
                        items: favorites.splice((page - 1) * itemsPerPage, itemsPerPage)
                    };
                    return reply(dataRes);
                }
            })
            .catch(function(err) {
                console.log("Err", err);
                request.log(['error', 'list', 'user'], err);
                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            });
        // if (page == 'all') {
        //     promise.then(function(data) {
        //         return reply({
        //             items: data
        //         });
        //     });
        // } else {
        //     promise.paginate(page, itemsPerPage, function(err, items, total) {
        //         if (err) {
        //             request.log(['error', 'list', 'user'], err);
        //             return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        //         }
        //         let totalPage = Math.ceil(total / itemsPerPage);
        //         let dataRes = {
        //             status: 1,
        //             totalItems: total,
        //             totalPage: totalPage,
        //             currentPage: page,
        //             itemsPerPage: itemsPerPage,
        //             numberVisiblePages: numberVisiblePages,
        //             items: items
        //         };
        //         return reply(dataRes);
        //     });
        // }
    }
};

function getOptions(request, reply) {
    let options = {
        status: {
            $ne: 2
        }
    };
    let {
        is_seed,
        status,
        keyword,
        role,
        socialSource,
        registerSource,
        phoneVerify,
        activity_scope,
        communityJoined,
        registerCommunity,
        ban_status,
        pending_seller
    } = request.payload || request.query;
    let tmpKeyword = new RegExp("", 'i');
    let idKeyword = null;
    if (keyword &&
        keyword.length > 0) {

        options.$or = [{
                email: new RegExp(keyword, 'i')
            },
            {
                name: new RegExp(keyword, 'i')
            }, {
                phone: new RegExp(keyword, 'i')
            }, {
                slug: new RegExp(keyword, 'i')
            }
        ];

        if (mongoose.Types.ObjectId.isValid(keyword)) {
            options.$or.push({
                _id: keyword
            });
        }
    }
    if (is_seed) {
        if (Number(is_seed)) {
            options.is_seed = is_seed;
        } else {
            if (!options.$or) {
                options.$or = [];
            }
            options.$or.push({
                is_seed: false
            }, {
                is_seed: undefined
            });
        }
    }
    if (communityJoined) {
        options.communityJoined = communityJoined;
    }
    if (registerCommunity) {
        options.registerCommunity = registerCommunity;
    }
    if (phoneVerify == 1 && phoneVerify.length > 0) {
        options['verify_phone.isVerify'] = true;
    }
    if (phoneVerify == 0 && phoneVerify.length > 0) {
        options['verify_phone.isVerify'] = {
            $ne: true
        };
    }

    if (status) {
        options.status = status;
    }

    if (ban_status) {
        if (Number(ban_status)) {
            options["ban.ban_status"] = ban_status;
        } else {
            if (!options.$or) {
                options.$or = [];
            }
            options.$or.push({
                "ban.ban_status": ban_status
            }, {
                ban: undefined
            });
        }
    }
    if (pending_seller == 'true') {
        options.pendingSeller = pending_seller;
    }

    if (role) {
        try {
            role = JSON.parse(role);
        } catch (e) {}
        options.roles = role;
    }

    if (activity_scope) {
        options.activity_scope = activity_scope;
    }

    if (registerSource) {
        if (registerSource == 'fig.bidy.vn') {
            options.registerSource = registerSource;
        } else {
            options.registerSource = {
                $ne: 'fig.bidy.vn'
            }
        }
    }
    if (socialSource) {
        switch (socialSource) {
            case 'facebook':
                options['social_info.facebook'] = {
                    $ne: null
                };
                break;
            case 'google':
                options['social_info.google'] = {
                    $ne: null
                };
                break;
        }
    }
    // console.log("Options: ", options);
    return reply(options);
}

exports.changeStatus = {

    handler: function(request, reply) {

        User.update({
            _id: request.params.id
        }, {
            $set: {
                status: request.params.status
            }
        }, function(err) {
            if (err) {
                return reply(Boom.forbidden("403"));
            }
        });
        return reply.redirect('/user/list');
    },
};

exports.productBid = {
    handler: function(request, reply) {
        Product.findOne({
                _id: request.params.product_id
            })
            .select("users_bid")
            .populate("users_bid", "_id name")
            .lean()
            .then(function(product) {
                return reply({
                    status: true,
                    data: product.users_bid
                });
            })
            .catch(function(err) {
                return reply({
                    status: false,
                });
            });
    },
};

exports.userByComment = {
    handler: function(request, reply) {
        Comment.find({
                product: request.params.product_id
            })
            .populate("created_by", "_id name")
            .select("created_by")
            .lean()
            .then(function(comments) {
                var users = _.uniq(_.map(comments, 'created_by'));
                return reply({
                    status: true,
                    data: users
                });
            })
            .catch(function(err) {
                return reply({
                    status: false
                });
            });
    },
};

exports.userByFavorite = {
    handler: function(request, reply) {
        Favorite.find({
                product_id: request.params.product_id
            })
            .populate("user_id", "_id name")
            .select("user_id")
            .lean()
            .then(function(comments) {
                var users = _.uniq(_.map(comments, 'user_id'));
                return reply({
                    status: true,
                    data: users
                });
            })
            .catch(function(err) {
                return reply({
                    status: false
                });
            });
    },
};


exports.edit = {
    pre: [{
        method: getById,
        assign: 'user'
    }],
    handler: function(request, reply) {

        let user = request.pre.user;
        if (user) {
            return reply(user);
        } else {
            return reply(Boom.notFound('User is not found'));
        }

    }
};


exports.save = {
    pre: [{
        method: getUserByEmail,
        assign: 'userByEmail'
    }, {
        method: checkSlug,
        assign: 'checkSlug'
    }],
    handler: function(request, reply) {
        if (request.pre.userByEmail) {
            return reply(Boom.badRequest('Email already exits'));
        }
        let {
            password
        } = request.payload || request.params;
        if (!password) {
            return reply(Boom.badRequest('Password should not be empty'));
        }
        if (password &&
            password.length <= 5) {

            return reply(Boom.badRequest('Password should be longer than 5 character'));
        }
        if (request.payload.password != request.payload.cfpassword) {
            return reply(Boom.badRequest('Confirm new password does not match'));
        }
        if (!request.pre.checkSlug.ok) {
            return reply(Boom.badRequest(request.pre.checkSlug.message));
        } else {
            request.payload.slug = request.pre.checkSlug.slug;
        }
        delete request.payload.cfpassword;
        let user = new User(request.payload);
        if (!user.provider) {
            user.provider = 'local';
        }
        user.hashPassword(request.payload.password, function(err, hash) {

            user.password = hash;
            // const token = crypto.randomBytes(20).toString('hex');
            // user.activeToken = token;
            const promise = user.save();
            promise.then(user => {

                user = user.toObject();
                delete user.password;
                //@TODOsend email welcome here
                return reply(user);
            }).catch(err => {

                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            });
        });
    },
    // description: 'Created user',
    // tags: ['api'],
    // plugins: {
    //     'hapi-swagger': {
    //         responses: {'400': {'description': 'Bad Request'}},
    //         payloadType: 'form'
    //     }
    // },
    validate: {
        payload: {
            name: Joi.string().required().description('Name'),
            email: Joi.string().email().required().description('Email'),
            slug: Joi.any().description('slug'),
            phone: Joi.any(),
            avatar: Joi.any(),
            address: Joi.any(),
            password: Joi.string().required().description('Password'),
            cfpassword: Joi.string().required(),
            transfer_infor: Joi.any(),
            district: Joi.any(),
            bio: Joi.string(),
            status: Joi.number().integer().min(0).max(1),
            is_seed: Joi.number().integer().min(0).max(1),
            roles: Joi.any().description('Roles'),
            recipient_infor: Joi.any().description('Roles'),
            activity_scope: Joi.any().description('Activity scope'),
            activeCommunity: Joi.any().description('Activity scope'),
            hub_id: Joi.string(),
            sellerType: Joi.number()
        }
    }
};


exports.update = {
    pre: [{
        method: getById,
        assign: 'user'
    }],
    handler: function(request, reply) {
        let user = request.pre.user;
        let {
            password,
            cfpassword,
            checkBtnConfirm
        } = request.payload;
        if (password) {
            if (password.length <= 5) {
                return reply(Boom.badRequest('Password should be longer than 5 character'));
            }
            if (password === cfpassword) {
                user.hashPassword(password, function(err, hash) {
                    if (request.payload.ban && request.payload.ban.ban_to) {
                        request.payload.ban.ban_to = new Date(new Date(request.payload.ban.ban_to).toDateString());
                    }
                    user = _.extend(user, request.payload);
                    user.password = hash;
                    user.save()
                        .then(function(user) {
                            return reply(user);
                        }).catch(function(err) {
                            return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                        });
                });
            } else {

                return reply(Boom.badRequest('Confirm new password does not match'));
            }
        } else {
            var passTmp = user.password;
            if (request.payload.ban && request.payload.ban.ban_to) {
                request.payload.ban.ban_to = new Date(new Date(request.payload.ban.ban_to).toDateString());
            }
            user = _.extend(user, request.payload);
            user.password = passTmp;
            console.log('checkBtnConfirm', checkBtnConfirm);
            //Pending seller
            if (checkBtnConfirm == true) {
                user.pendingSeller = false;
                user.roles.push('seller');
                user.sellerType = 2;
            }
            //End Pending seller
            user.save()
                .then(function(user) {
                    return reply(user);
                }).catch(function(err) {
                    return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
                });
        }

    },
    validate: {
        payload: {
            name: Joi.string().required().description('Name'),
            email: Joi.any().description('Email'),
            phone: Joi.any(),
            avatar: Joi.any(),
            password: Joi.any().description('Password'),
            cfpassword: Joi.any(),
            status: Joi.any(),
            is_seed: Joi.number().integer().min(0).max(1),
            district: Joi.any(),
            _id: Joi.string().description('MongoID'),
            roles: Joi.array().description('Role'),
            followed: Joi.any(),
            product_favorites: Joi.any(),
            following: Joi.any(),
            social_info: Joi.any(),
            address: Joi.any(),
            salt: Joi.any(),
            bio: Joi.any(),
            is_send_notify: Joi.any(),
            setting_notification: Joi.any(),
            recipient_infor: Joi.any().description('Roles'),
            activity_scope: Joi.any().description('Activity scope'),
            activeCommunity: Joi.any().description('Activity scope'),
            hub_id: Joi.string(),
            ban: Joi.any().description('Ban'),
            sellerType: Joi.number()
        },
        options: {
            allowUnknown: true
        }
    }
};

exports.resetFCC = {
    handler: function(request, reply) {
        let {
            id
        } = request.payload || request.params;

        let findOne = User.findOne({
            '_id': id
        });
        findOne.then(user => {
                user.firstTimeComeCollection = 1;
                return user.save();
            })
            .then(result => {
                return reply({
                    status: true,
                    msg: 'Reset success'
                });
            })
            .catch(function(err) {
                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            });

    }
}

exports.changeSendNotifyStatus = {
    handler: function(request, reply) {
        let {
            id,
            is_send_notify
        } = request.payload || request.params;

        let findOne = User.findOne({
            '_id': id
        });

        findOne.then(function(user) {
            user.is_send_notify = is_send_notify;
            let save = user.save();
            save.then(function(result) {
                return reply({
                    status: true,
                    msg: 'Update success'
                });
            }).catch(function(err) {
                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            });
        }).catch(function(err) {
            return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
        });
    },
    validate: {
        payload: {
            id: Joi.string().description('MongoID'),
            is_send_notify: Joi.any()
        }
    }
};

exports.delete = {
    pre: [{
        method: getById,
        assign: 'user'
    }],
    handler: function(request, reply) {

        const user = request.pre.user;
        user.remove((err) => {

            if (err) {
                return reply(Boom.badRequest(ErrorHandler.getErrorMessage(err)));
            }
            return reply(user);
        });
    }
};

exports.moveToTrash = {
    pre: [{
        method: getById,
        assign: 'user'
    }],
    handler: function(request, reply) {

        const user = request.pre.user;
        if (user) {
            user.status = 2;
            var _removetext = '_remove_' + new Date().getTime();
            user.email += _removetext;
            user.phone += "trash";
            user.save().then(function() {
                return reply({
                    status: true,
                    msg: 'This user has been move to trash!'
                });
            })
        } else {
            return reply(Boom.notFound('User is not found'));
        }
    }
};

exports.removeVerifyPhone = {
    pre: [{
        method: getById,
        assign: 'user'
    }],
    handler: function(request, reply) {
        const user = request.pre.user;
        if (user) {
            user.verify_phone = undefined;
            delete user.verify_phone;
            user.save().then(function(user) {
                // console.log("User: ", user.verify_phone);
                return reply({
                    status: true,
                    msg: 'This user has been remove verify phone!'
                });
            })
        } else {
            return reply(Boom.notFound('User is not found'));
        }
    }
};

exports.report = {
    pre: [{
        method: getHasBidUser,
        assign: 'hasBid'
    }, {
        method: getOptions,
        assign: 'options'
    }, {
        method: logReport
    }],
    handler: function(request, reply) {
        let {
            hasBid,
            options
        } = request.pre;
        options = _.merge(hasBid.option, options);
        // console.log("Options: ", options);

        var promise = User.find(options)
            .lean()
            .sort('id')
            .populate({
                path: 'district',
                select: 'name province',
                populate: {
                    path: 'province',
                    select: 'name'
                }
            })
            .select("_id name email phone is_seed social_info created district")
            .then(function(users) {
                var result = [];

                for (var i in users) {
                    const user = users[i];
                    console.log(user);
                    result.push({
                        "Name": user.name || '',
                        "Phone": user.phone || '',
                        "Email": user.email || '',
                        "Province": user.district ? user.district.province.name : '',
                        "District": user.district ? user.district.name : '',
                        "Is Seed": user.is_seed,
                        "ID Facebook": user.social_info && user.social_info.facebook ? user.social_info.facebook.fbid : "",
                        "Created": user.created
                    });
                }
                if (result.length > 0) {
                    var xls = json2xls(result);
                    fs.writeFileSync('stuff.xlsx', xls, 'binary');
                    return reply.file('stuff.xlsx');
                } else {
                    result.push({

                    });
                    var xls = json2xls(result);
                    fs.writeFileSync('stuff.xlsx', xls, 'binary');
                    return reply.file('stuff.xlsx');
                }
            });
    }

}
exports.verify2fa = {
    handler: function(request, reply) {
        let {
            password
        } = request.payload;
        Setting
            .findOne({
                key: 'admin-2fa'
            })
            .then(setting => {
                if (setting) {
                    var secret = setting.value;
                    var verified = speakeasy.totp.verify({
                        secret: secret,
                        encoding: 'base32',
                        token: password
                    });
                    var resp = {
                        status: 0,
                        message: 'InValid'
                    };
                    if (verified) {
                        request.yar.set('isVerified', true);
                        resp = {
                            status: 1,
                            message: 'Valid'
                        };
                    }
                    return reply(resp);
                }
            });
    }
}

exports.beautiReport = {
    pre: [{
        method: getHasBidUser,
        assign: 'hasBid'
    }, {
        method: getOptions,
        assign: 'options'
    }, {
        method: logReport
    }],
    handler: function(request, reply) {
        let {
            hasBid,
            options
        } = request.pre;
        options = _.merge(hasBid.option, options);
        // console.log("Options: ", options);

        var promise = User.find(options)
            .select({
                _id: 1,
                name: 1,
                email: 1,
                phone: 1,
                // created: 1,
                district: 1,
                bidTimes: 1,
                'products_had_bid.productId': 1,
                'products_had_bid.times': 1,
            })
            .populate({
                path: 'district',
                select: 'name province',
                populate: {
                    path: 'province',
                    select: 'name'
                }
            })
            .populate({
                path: 'products_had_bid.productId',
                select: '_id title latestTrans',
            })
            .lean()
            .then(user => {
                for (var i in user) {
                    user[i].winTimes = 0;
                    user[i].bidded_product = "";
                    if (!user[i].district) {
                        user[i].district = "";
                    } else {
                        user[i].district = user[i].district.name + ", " + user[i].district.province.name;
                    }
                    for (var j in user[i].products_had_bid) {
                        if (user[i].products_had_bid[j].productId && user[i].products_had_bid[j].productId.title) {
                            user[i].bidded_product += user[i].products_had_bid[j].productId.title + " (" + user[i].products_had_bid[j].times;
                            if (user[i].products_had_bid[j].productId.latestTrans.user_id.toString() == user[i]._id.toString()) {
                                user[i].bidded_product += ", thắng";
                                if (!user[i].winTimes) {
                                    user[i].winTimes = 1;
                                } else {
                                    user[i].winTimes++;
                                }
                            }
                            user[i].bidded_product += ")\n";
                        }
                    }
                    user[i] = {
                        "Họ tên": user[i].name,
                        "Email": user[i].email,
                        "SĐT": user[i].phone,
                        "Địa chỉ": user[i].district,
                        "Số lượng sản phẩm đã thắng": user[i].winTimes,
                        "Số lần bid trên Bidy": user[i].bidTimes,
                        "Đã tham gia bid sản phẩm": user[i].bidded_product
                    };
                }
                // console.log("User report: ", user);
                var xls = json2xls(user);
                fs.writeFileSync('stuff.xlsx', xls, 'binary');
                reply.file('stuff.xlsx');
            });
    }

};

/**
 * Middleware
 */

function getById(request, reply) {

    const id = request.params.id || request.payload.id;
    let promise = User.findOne({
        '_id': id
    });
    // .lean();
    promise.then(function(user) {
        if (user && user._id) {
            return reply(user);
        } else {
            return reply.continue();
        }
    }).catch(function(err) {
        request.log(['error'], err);
        return reply.continue();
    })
}

function getUserByEmail(request, reply) {

    const email = request.payload.email;
    User.findOne({
        email: email
    }, function(err, user) {
        if (err) {
            request.log(['error'], err);
        }
        return reply(user);
    });
}

function updatePromise(user, reply) {

    let promise = user.save();
    promise.then(function(user) {
        console.log('User', user);
        return user;
    }).catch(function(err) {
        console.log(err);

        if (11000 === err.code ||
            11001 === err.code) {

            return reply(Boom.badRequest('Email already exists'));
        } else {

            return reply(Boom.forbidden("403")); // HTTP 403
        }
    });

}

function checkSlug(request, reply) {
    let {
        _id,
        slug,
        name
    } = request.payload || request.params;
    if (!slug) {
        var newSlug = name.toLowerCase().replace(/[&\/\\#,+()$@~%' ":*?<>{}]/g, '');
        var newSlug = Slug(newSlug).toLowerCase();
        User.find({
            slug: {
                $regex: newSlug
            }
        }).then(function(users) {
            if (users.length < 0) {
                return reply({
                    ok: true,
                    slug: newSlug
                });
            }
            var map = [];

            for (var i in users) {
                map[users[i].slug] = users[i].slug;
            }
            var tmpslug = newSlug;
            console.log(tmpslug);
            while (map[tmpslug]) {
                tmpslug = newSlug + '.' + Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            }
            console.log(tmpslug);
            return reply({
                ok: true,
                slug: tmpslug
            });
        })
    } else {
        var newSlug = Slug(slug);
    }
    newSlug = newSlug.toLowerCase();
    if (_id) {
        var promise = User.find({
            slug: newSlug
        }).where({
            _id: {
                $ne: new mongoose.mongo.ObjectId(_id)
            }
        })
    } else {
        var promise = User.find({
            slug: newSlug
        })
    }
    promise.then(function(result) {
        // console.log('result', result);
        if (result &&
            result.length > 0) {
            if (slug) {
                var message = "Slug already exits";
            } else {
                var message = "System has generated a duplicate slug. Please enter a new slug";
            }
            return reply({
                ok: false,
                message: message
            });
        } else {
            return reply({
                ok: true,
                slug: newSlug
            });
        }
    }).catch(function(err) {
        return reply({
            ok: false,
            message: 'An error occurs'
        });
    });
}

function getHasBidUser(request, reply) {
    let {
        hasBidding,
        start_date,
        end_date
    } = request.payload || request.query;
    // console.log("Has bid", hasBidding);
    var commonOptions = {};
    if (start_date && !end_date) {
        start_date = new Date(start_date);
        commonOptions.created = {
            $gte: start_date
        }
    }
    if (end_date && !start_date) {
        end_date = new Date(end_date);
        commonOptions.created = {
            $lte: end_date
        }
    }
    if (start_date && end_date) {
        start_date = new Date(start_date);
        end_date = new Date(end_date);
        commonOptions.$and = [{
            created: {
                $gte: start_date
            }
        }, {
            created: {
                $lte: new Date(end_date.getTime() + 86400000)
            }
        }];
    }
    if (hasBidding == 'no' || hasBidding == 'yes') {
        if (hasBidding == 'yes') {

            Transaction.find(commonOptions)
                .select("userBid")
                .lean()
                .then(function(trans) {
                    var userIds = _.map(trans, "userBid");
                    var _userIds = userIds.filter(function(value, index, self) {
                        return self.indexOf(value) === index;
                    });
                    // userIds.forEach(function (item) {
                    //     if (_userIds.indexOf(item.toString()) == -1) {
                    //         _userIds.push(item.toString());
                    //     }
                    // });
                    return reply({
                        status: true,
                        option: {
                            _id: {
                                $in: _userIds
                            }
                        }
                    });
                });
        } else {
            User.find({
                    $or: [{
                        products_had_bid: null
                    }, {
                        products_had_bid: []
                    }]
                })
                .select("_id")
                .lean()
                .then(function(users) {
                    var userIds = _.map(users, "_id");
                    return reply({
                        status: true,
                        option: {
                            _id: {
                                $in: userIds
                            }
                        }
                    });
                });
        }
    } else {
        // console.log(commonOptions);
        return reply({
            status: false,
            option: commonOptions
        });
    }

}

function statisticActivity(request, reply) {
    var promise = User.find({
            'registerSource': { $ne: 'fig.bidy.vn' }
        })
        .select('products_had_bid favorite_product')
        .populate('products_had_bid.productId')
        .populate({
            path: 'favorite_product',
            match: {
                is_collection: true
            }
        }).lean();

    promise.then(products => {
        let products_had_bid = _.map(products, 'products_had_bid');
        let favorite_product = _.map(products, 'favorite_product');
        let total = products.length;

        favorite_product = favorite_product.filter(item => {
            if (item && item.length > 0) {
                return item;
            }
        })
        products_had_bid = products_had_bid.filter(item => {
            if (item && item.length > 0) {
                return item;
            }
        })

        let bidOrCollect = products.filter(item => {
            if (item.products_had_bid && item.products_had_bid.length > 0) {
                return item;
            }
            if (item.favorite_product && item.favorite_product.length > 0) {
                return item;
            }
        })

        return reply({
            userBid: products_had_bid.length,
            userCollect: favorite_product.length,
            userBidOrCollect: bidOrCollect.length,
            total: total
        });
    }).catch(err => {
        return reply.continue();
    })

}

function logReport(request, reply) {
    if (request.auth.credentials && request.auth.credentials.id) {
        var {
            createReportLog
        } = request.server.plugins['admin-log'];
        reply(createReportLog(request.auth.credentials.id, 'user'));
    } else {
        reply();
    }
}



exports.productBidHistory = {
    handler: function(request, reply) {
        let { user_id } = request.payload;
        console.log("user_id", user_id);
        if (user_id) {
            let page = request.payload.page || 1;
            let config = request.server.configManager;
            let itemsPerPage = config.get('web.paging.itemsPerPage');
            let numberVisiblePages = config.get('web.paging.numberVisiblePages');
            User.findOne({
                    _id: user_id
                })
                .lean()
                .select("name phone email user products_had_bid")
                .populate({
                    path: "products_had_bid.productId",
                    select: "title slug latestTrans",
                    sort: "-created"
                })
                .then(function(user) {
                    let { products_had_bid } = user;
                    let products = [];
                    _.map(products_had_bid, function(i) {
                        if (i.productId) {
                            if (i.productId.latestTrans.user_id.toString() == user._id.toString()) {
                                i.productId.is_win = true;
                            }
                            products.push(i.productId);
                        }
                    })
                    let total = products.length;
                    let totalPage = Math.ceil(total / itemsPerPage);
                    let dataRes = {
                        status: 1,
                        totalItems: total,
                        totalPage: totalPage,
                        currentPage: page,
                        itemsPerPage: itemsPerPage,
                        numberVisiblePages: numberVisiblePages,
                        items: products.splice((page - 1) * itemsPerPage, itemsPerPage)
                    };
                    return reply(dataRes);
                })
                .catch(function(err) {
                    console.log("err", err);
                    return reply(false);
                });
        } else {
            return reply(false);
        }
    }
};