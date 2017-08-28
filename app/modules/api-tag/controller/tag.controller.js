'use strict';

const Boom = require('boom');
const util = require('util');
const Joi = require('joi');
const mongoose = require('mongoose');
const _ = require('lodash');
const async = require('async');

const Tag = mongoose.model('Tag');
const Category = mongoose.model('Category');

exports.getAll = {
    handler: function(request, reply) {
        let options = request.payload || request.query;
        let limit = request.payload.limit || null;
        delete request.payload.limit;
        if (options.count) {
            // query >0
            options.count = { $gt: 0 };
        }
        Tag
            .find(options)
            .sort('-count')
            .limit(limit)
            .select("slug name")
            .lean()
            .then(function(result) {
                return reply(result);
            });
    }
};

exports.listOnBoard = {
    pre: [{
        method: getCategory,
        assign: 'getCategory'
    }],
    handler: function(request, reply) {
        let options = request.query;
        let findOpt = {
            type: 'onboard'
        };
        if (request.pre.getCategory) {
            findOpt.scope = request.pre.getCategory._id
        }
        Tag.find(findOpt).then(tags => {
            // console.log(tags)
            return reply(tags);
        }).catch(err => {
            return reply(Boom.badRequest(err, err));
        })
    }
};

exports.listTagByCommunityId = {
    pre: [{
        method: getAuthUser,
        assign: 'user'
    }, {
        method: getCommunityIdBySlug,
        assign: 'getCommunityIdBySlug'
    }],
    handler: function(request, reply) {
        let getCommunityIdBySlug = request.pre.getCommunityIdBySlug;
        let { type } = request.payload;
        let user = request.pre.user;
        if (user == false) {
            return reply(Boom.badRequest('Chưa login'));
        }

        let activeCommunity = user.activeCommunity[0];
        if (getCommunityIdBySlug != null && getCommunityIdBySlug != '') {
            activeCommunity = getCommunityIdBySlug;
        }
        //Check edit product
        if (request.payload.communityId) {
            activeCommunity = request.payload.communityId;
        }
        Tag.find({
                status: 1,
                communityId: activeCommunity,
                type: type
            })
            .select("name slug")
            .sort('-count')
            .lean()
            .then(tags => {
                return reply(tags);
            })
            .catch(err => {
                console.log('err', err);
                return reply(Boom.badRequest(err, err));
            });
    }
};

exports.listAllTag = {
    pre: [{
        method: getCommunityIdBySlug,
        assign: 'getCommunityIdBySlug'
    }],
    handler: function(request, reply) {
        let getCommunityIdBySlug = request.pre.getCommunityIdBySlug;
        let { type } = request.payload;
        let options = {
            status: 1,
            communityId: getCommunityIdBySlug,
            count: { $gt: 0 }
        }
        if (type) {
            options.type = type;
        }
        Tag
            .find(options)
            .lean()
            .select("slug name")
            .sort('-count')
            .then(tags => {
                return reply(tags);
            })
            .catch(err => {
                console.log('err', err);
                return reply(Boom.badRequest(err, err));
            });
    }
};

exports.createTag = {
    pre: [{
        method: getAuthUser,
        assign: 'user'
    }, {
        method: getCommunityIdBySlug,
        assign: 'getCommunityIdBySlug'
    }],
    handler: function(request, reply) {
        if (request.auth.credentials && request.auth.credentials.id) {
            let funcArr = [];
            var resultFinal = [];

            let { type } = request.payload;
            let user = request.pre.user;
            let userCommunity = user.activeCommunity[0];
            let getCommunityIdBySlug = request.pre.getCommunityIdBySlug;

            if (getCommunityIdBySlug != '' && getCommunityIdBySlug != null) {
                userCommunity = getCommunityIdBySlug;
            }
            //Check edit product
            if (request.payload.communityId) {
                userCommunity = request.payload.communityId;
            }
            _.forEach(request.payload.dataTag, function(item) {
                if (item.isTag == true) {
                    funcArr.push(function(callback) {
                        Tag.findOne({ slug: item.slug, communityId: userCommunity }).lean().then(tags => {
                            var resultFind = {};
                            if (tags != null) {
                                if (tags.status == 1) {
                                    resultFinal.push(tags);
                                    callback();
                                } else {
                                    var timeStr = new Date().getTime() % 1000;

                                    let data = {
                                        name: item.name,
                                        slug: item.slug + '-' + timeStr,
                                        communityId: userCommunity,
                                        type: type
                                    };
                                    var tag = new Tag(data);
                                    tag.save()
                                        .then(result => {
                                            if (result) {
                                                resultFinal.push(result);
                                                callback();
                                            }
                                        }).catch(err => {
                                            return reply(Boom.badRequest(err, err));
                                        });
                                }

                            } else {
                                let data = {
                                    name: item.name,
                                    slug: item.slug,
                                    communityId: userCommunity,
                                    type: type
                                };

                                var tag = new Tag(data);
                                tag.save()
                                    .then(result => {
                                        result = JSON.parse(JSON.stringify(result));
                                        result.isNew = true;
                                        if (result) {
                                            resultFinal.push(result);
                                            callback();
                                        }
                                    }).catch(err => {
                                        return reply(Boom.badRequest(err, err));
                                    });

                            }
                        }).catch(err => {
                            return reply(Boom.badRequest(err, err));
                        });

                    });
                } else {
                    resultFinal.push(item);
                }
            });
            async.parallel(funcArr, function(err, results) {
                return reply(resultFinal);
            });
        } else {
            return reply([]);
        }
    }
};

function getCategory(request, reply) {
    let hostname = request.info.hostname;
    // console.log('hostname', hostname)
    if (hostname == 'localhost') {
        return reply(null)
    } else {
        Category.findOne({
            identity: hostname
        }).then(category => {
            return reply(category);
        }).catch(err => {
            return reply(null);
        });
    }
}

function getCommunityIdBySlug(request, reply) {
    let communitySlug = request.payload.communitySlug;
    Community
        .findOne({ slug: communitySlug })
        .select('_id')
        .lean()
        .then(result => {
            if (result) {
                return reply(result._id);
            } else {
                return reply('');
            }
        })
}


function getAuthUser(request, reply) {
    if (request.auth.isAuthenticated) {
        const id = request.auth.credentials.id;
        let promise = User
            .findOne({
                _id: id
            })
            .select('activeCommunity');
        promise
            .then(function(user) {
                if (user.status == 2) {
                    return reply.continue();
                }
                // console.log("User:", user);
                reply(user)
            })
            .catch(function(err) {
                request.log(['error'], err);
                return reply.continue();
            });
    } else {
        return reply(false);
    }
}

exports.getTagById = {
    handler: function(request, reply) {
        let id = request.payload.id;

        Tag.findOne({
                _id: id
            })
            .populate('communityId', 'title slug')
            .lean()
            .then(resp => {
                if (resp)
                    return reply(resp);
                reply(null);
            })
            .catch(err => {
                console.log('err', err);
                return reply(Boom.badRequest(err, err));
            });
    }
}
exports.getTagBySlug = {
    handler: function(request, reply) {
        let slug = request.payload.slug || request.params.slug;

        Tag.findOne({
                slug: slug
            })
            .populate('communityId', 'title slug')
            .lean()
            .then(resp => {
                if (resp)
                    return reply(resp);
                else
                    return reply(null);
            })
            .catch(err => {
                console.log('err', err);
                return reply(Boom.badRequest(err, err));
            });
    }
}