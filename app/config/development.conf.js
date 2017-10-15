'use strict';
const assets = require('./assets.config');

module.exports = {
    web: {
        db: {
            uri: `mongodb://localhost/db_love_story`,
            options: {
                user: '',
                pass: ''
            }
        },
        context: {
            minCycle: 1,
            userSchedule: {
                stopMinutes: 0.25,
                debug: true
            },
            settings: {
                services: {
                    webUrl: 'http://localhost:6655',
                    apiUrl: 'http://localhost:6655',
                    adminUrl: 'http://localhost:6655',
                },
            },
            assets: {
                admin: assets.admin
            }
        }
    }
};