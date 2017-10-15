'use strict';

module.exports = {
    web: {
        cookieOptions: {
            ttl: 365 * 24 * 60 * 60 * 1000, // expires a year from today
            encoding: 'none', // we already used JWT to encode
            path: '/',
            isSecure: false, // warm & fuzzy feelings
            isHttpOnly: true, // prevent client alteration
            clearInvalid: true, // remove invalid cookies
            strictHeader: true // don't allow violations of RFC 6265
        },
        jwt: {
            secret: 'L7FWdNnQU7cfmQ87WuucQFK3YZvNBuvc'
        },
        upload: {
            path: BASE_PATH + '/public/files',
            avatar: BASE_PATH + '/public/files/avatar',
            tag: BASE_PATH + '/public/files/tag',
            post: BASE_PATH + '/public/files/posts'
        },
        error: {
            web: {
                login: "/dang-nhap"
            },
            admin: {
                login: "/admin/dang-nhap"
            },
        },
    }
};