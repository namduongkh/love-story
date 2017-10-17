'use strict';

const Boom = require('boom');
const mongoose = require('mongoose');
const Joi = require('joi');
const fs = require('fs-extra');
const path = require('path');
const JWT = require('jsonwebtoken');
const mkdirp = require('mkdirp');
const requestF = require('request');
const easyimg = require('easyimage');
const rimraf = require('rimraf');
const moment = require('moment');

//get file extension
var getFileExt = function(fileName) {
    var fileExt = fileName.split(".");
    if (fileExt.length === 1 || (fileExt[0] === "" && fileExt.length === 2)) {
        return "";
    }
    return fileExt.pop();
};
//get file upload name - without extension
var getFileName = function(fileName) {
    return fileName.substring(0, fileName.lastIndexOf('.'));
};

var storage = function(request, cb) {
    var data = request.payload;
    var name = data.file.hapi.filename;
    var old_name = data.old_filename;
    var uploadPath = path.join(configManager.get('web.upload.path'), name);
    if (data.type) {
        mkdirp(path.join(configManager.get('web.upload.path'), data.type), function(err) {
            if (data.filename) {
                name = data.filename + '.' + getFileExt(name);;
            } else {
                name = getFileName(name) + '-' + Date.now() + '.' + getFileExt(name);
            }
            uploadPath = path.join(configManager.get('web.upload.path'), data.type, name);
            if (old_name) {
                var old_path = path.join(configManager.get('web.upload.path'), data.type, old_name);
                fs.unlink(old_path, function(err) {
                    if (err) {
                        console.log("Err: ", err);
                    }
                })
            }
            var exist = fs.access(uploadPath, fs.constants.R_OK, (err) => {
                if (!err) {
                    uploadPath = path.join(configManager.get('web.upload.path'), data.type, name);
                }
                cb(name, uploadPath);
            });
        });
    } else {
        var exist = fs.access(uploadPath, fs.constants.R_OK, (err) => {
            if (!err) {
                if (data.filename) {
                    name = data.filename;
                } else {
                    name = getFileName(name) + '-' + Date.now() + '.' + getFileExt(name);
                }
                uploadPath = path.join(configManager.get('web.upload.path'), name);
            }
            cb(name, uploadPath);
        });
    }
}

exports.removeFolder = {
    // auth: true,
    handler: function(request, reply) {
        let path = configManager.get('web.upload.product') + '/' + request.payload.productId;
        rimraf(path, function() {
            return reply({ status: true })
        })
    }
}

exports.copyFolder = {
    // auth: true,
    handler: function(request, reply) {
        let { oldId, newId } = request.payload;
        let oldPath = configManager.get('web.upload.product') + '/' + oldId;
        let newPath = configManager.get('web.upload.product') + '/' + newId;
        if (fs.existsSync(oldPath)) {
            if (!fs.existsSync(newPath)) {
                fs.mkdirSync(newPath);
            }
            fs.copy(oldPath, newPath, function(err) {
                if (err) return console.error(err)
                return reply(true);
            });
        } else {
            return reply(false);
        }
    }
}

exports.uploadImage = {
    auth: false,
    handler: function(request, reply) {
        var configManager = request.server.configManager;
        var data = request.payload;
        storage(request, function(filename, uploadPath) {
            var file = fs.createWriteStream(uploadPath);
            file.on('error', function(err) {
                request.log(['error', 'upload'], err);
                request.log(['error'], err);
                reply({
                    status: 0,
                    file: {}
                })
            });
            data.file.pipe(file);
            data.file.on('end', function(err) {
                if (err) {
                    request.log(['error', 'upload'], err);
                    return reply(err);
                }
                var fileInfo = {
                    filename: filename
                }
                reply({
                    status: 1,
                    file: fileInfo
                })
            });
        });
    },
    validate: {
        payload: {
            file: Joi.any().required().meta({
                swaggerType: 'file'
            }).description('File'),
            type: Joi.string().description('Type'),
            filename: Joi.string().description('File name'),
            old_filename: Joi.any().description('Older file name'),
            //extension: Joi.string().description('Extension')

        }
    },
    payload: {
        maxBytes: 200048576,
        parse: true,
        allow: 'multipart/form-data',
        output: 'stream'
    },
    description: 'Handle Upload File',
    tags: ['api'],
    plugins: {
        'hapi-swagger': {
            responses: {
                '400': {
                    'description': 'Bad Request'
                }
            },
            payloadType: 'form'
        }
    },
}

function replaceBase64(base64Data) {
    return base64Data.replace(/data:image(\/png|\/jpeg|\/gif|\/bmp|\/jpg);base64,/g, '');
}

exports.deleteFile = {
    auth: false,
    handler: function(request, reply) {
        var configManager = request.server.configManager;
        var data = request.payload;
        if (data.filename) {
            var old_path = path.join(configManager.get('web.upload.path'), data.filename);
            fs.unlink(old_path, function(err) {
                if (err) {
                    console.log("Err: ", err);
                }
                return reply("Done!");
            })
        }
    },
    validate: {
        payload: {
            filename: Joi.any().description('File name'),
        }
    },
};

exports.deleteFilePost = {
    auth: false,
    handler: function(request, reply) {
        var configManager = request.server.configManager;
        var data = request.payload;
        if (data.file) {
            var filename = data.file.replace(/.+\/files\/(.+)/gi, "$1");
            // console.log("filename", filename);
            var old_path = path.join(configManager.get('web.upload.path'), filename);
            fs.unlink(old_path, function(err) {
                if (err) {
                    console.log("Err: ", err);
                }
                return reply("Done!");
            })
        }
    },
    validate: {
        payload: {
            file: Joi.any().description('File name'),
        }
    },
};

exports.duplicateFolder = {
    // auth: true,
    handler: function(request, reply) {
        let {
            oldProductId,
            newProductId
        } = request.payload;

        let oldPath = configManager.get('web.upload.product') + '/' + oldProductId;
        let newPath = configManager.get('web.upload.product') + '/' + newProductId;
        var _fs = require("fs-extra");
        _fs.copy(oldPath, newPath, function(err) {
            if (err) {
                return reply({
                    status: false,
                    message: err
                })
            } else {
                console.log('success!')
                return reply({
                    status: true,
                    message: 'success'
                })
            }

        });
    }
}

exports.uploadChapterContentImage = {
    auth: false,
    handler: function(request, reply) {
        let configManager = request.server.plugins['hapi-kea-config'];
        let data = request.payload;
        let year = moment().format("YYYY");
        let month = moment().format("MM");

        if (data.type && data.type == 'buffer') {
            data.file = data.file.toString('base64');
            data.name = (new Date()).getTime() + '_' + data.name;
        }

        if (data.file && data.name) {
            mkdirp(configManager.get('web.upload.chapter') + "/" + year + '/' + month, function(err) {
                // let base64Data = replaceBase64(data.file);
                let path = configManager.get('web.upload.chapter') + '/' + year + '/' + month + '/' + data.name;
                fs.writeFile(path, data.file, 'base64', function(err) {
                    //resize image
                    easyimg.info(path).then(file => {
                        var width = file.width;
                        if (width > 700) {
                            var withImage = 700;
                            let optionResize = {
                                src: path,
                                dst: path,
                                width: withImage
                            }
                            easyimg.resize(optionResize).then(function(image, err) {
                                if (err)
                                    console.log(err);
                            })
                        }
                    });
                    return reply({
                        status: 'OK',
                        location: year + '/' + month + '/' + data.name,
                        files: [{
                            url: configManager.get('web.context.settings.services.webUrl') + '/files/posts/' + year + '/' + month + '/' + data.name
                        }]
                    });
                });
            });
        } else {
            reply({
                status: "Error"
            });
        }

    },
    payload: {
        maxBytes: 200048576
    }
}