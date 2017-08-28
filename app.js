'use strict';

const Hapi = require('hapi');
const server = new Hapi.Server();
global.BASE_PATH = __dirname;
if (process.env.NODE_ENV == "development") {
    process.env.PORT = 6655;
}

server.register({
    register: require('hapi-kea-config'),
    options: {
        confPath: BASE_PATH + '/app/config',
        decorateServer: true
    }
});

server.connection({ port: process.env.PORT });

const config = server.plugins['hapi-kea-config'];

//registering hapi plugins and bootstrap app
require('./app/bootstrap/bootstrap.js')(server);
//start the server
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log(`Server running at port: ${process.env.PORT}`);
});

module.exports = server;