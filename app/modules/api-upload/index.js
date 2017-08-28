'use strict';

const UploadController = require('./controller/upload.controller.js');

exports.register = function(server, options, next) {
    var configManager = server.plugins['hapi-kea-config'];
    let queue = server.plugins['hapi-kue'];

    server.route({
        method: 'POST',
        path: '/api/upload/image',
        config: UploadController.uploadImage
    });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/image-avatar',
    //     config: UploadController.uploadAvatar
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/image-sticker',
    //     config: UploadController.uploadSticket
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/image-category',
    //     config: UploadController.uploadCategory
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/coppy-file-share-product',
    //     config: UploadController.opyOneImageGallerToThumbShare
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/image-link',
    //     config: UploadController.imageLink
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/image-tag',
    //     config: UploadController.uploadTag
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/resizeImageThumbPoduct',
    //     config: UploadController.resizeImageThumbPoduct
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/remove-odd-image',
    //     config: UploadController.removeOddImage
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/mutiple-image',
    //     config: UploadController.imageMutiple
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/mutiple-thumb',
    //     config: UploadController.imageMutipleThumb
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/mutiple-origin',
    //     config: UploadController.imageMutipleOrigin
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/order-upload',
    //     config: UploadController.orderUpload
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/coppyProductLinkToOrigin',
    //     config: UploadController.coppyProductLinkToOrigin
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/base64-image-collection',
    //     config: UploadController.base64ImageCollection
    // });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/convert-link-product-to-collection',
    //     config: UploadController.convertLinkProductToCollection
    // });

    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/base64-image-collection-origin',
    //     config: UploadController.base64ImageCollectionOrigin
    // });
    server.route({
        method: 'POST',
        path: '/api/upload/deleteFile',
        config: UploadController.deleteFile
    });
    server.route({
        method: 'POST',
        path: '/api/upload/deleteFilePost',
        config: UploadController.deleteFilePost
    });
    // server.route({
    //     method: 'POST',
    //     path: '/api/upload/check-file-resize-collection',
    //     config: UploadController.checkFileResizeCollection
    // });

    server.route({
        method: 'POST',
        path: '/api/upload/duplicateFolder',
        config: UploadController.duplicateFolder
    });

    server.route({
        method: 'POST',
        path: '/api/upload/removeFolder',
        config: UploadController.removeFolder
    });

    server.route({
        method: 'POST',
        path: '/api/upload/copyFolder',
        config: UploadController.copyFolder
    });

    server.route({
        method: 'POST',
        path: '/api/upload/uploadPostContentImage',
        config: UploadController.uploadPostContentImage
    });

    next();
};

exports.register.attributes = {
    name: 'api-upload'
};