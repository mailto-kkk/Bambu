'use strict';

var http = require('http');
var express = require('express');
var kraken = require('kraken-js');
var nconf = require('nconf');
var nconfPort = require('nconf').file({file: 'config/config.json'});
var logger = require('./lib/logUtil');
var requestController = require('./lib/requestController');
var cluster = require('cluster');

var options, app, server;

/*
 * Create and configure application. Also exports application instance for use by tests.
 * See https://github.com/krakenjs/kraken-js#options for additional configuration options.
 */
options = {
    onconfig: function (config, next) {
        /*
         * Add any additional config setup or overrides here. `config` is an initialized
         * `confit` (https://github.com/krakenjs/confit/) configuration object.
         */
        logger.config(nconf.get('loggerConfig'));
        next(null, config);
    }
};

app = module.exports = express();
app.use(requestController);
app.use(kraken(options));
app.on('start', function () {
    //logger.info('Application ready to serve requests.');
    logger.msg('INFO', 'index(Main)', '', '', 'start', 'Application ready to serve requests.');
});


/*
 * Create and start HTTP server.
 */
if (!module.parent) {

    /*
     * This is only done when this module is run directly, e.g. `node .` to allow for the
     * application to be used in tests without binding to a port or file descriptor.
     */

    //Clustering - START
    if (cluster.isMaster) {
        //var numWorkers = 1; //require('os').cpus().length;
        var numWorkers = require('os').cpus().length;
        logger.msg('INFO', 'index(Main)', '', '', 'listening', 'Master cluster setting up ' + numWorkers + ' workers...');
        for (var i = 0; i < numWorkers; i++) {
            cluster.fork();
        }
        cluster.on('online', function (worker) {
            logger.msg('INFO', 'index(Main)', '', '', 'listening', 'Worker ' + worker.process.pid + ' is online');
        });
        cluster.on('exit', function (worker, code, signal) {
            logger.msg('INFO', 'index(Main)', '', '', 'listening', 'Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
            logger.msg('INFO', 'index(Main)', '', '', 'listening', 'Starting a new worker');
            cluster.fork();
        });
    } else {
        server = http.createServer(app);
        server.listen(process.env.PORT || nconfPort.get('port'));
        server.on('listening', function () {
            logger.msg('INFO', 'index(Main)', '', '', 'listening', 'Server listening on port:' + this.address().port);
        });
    }
    //Clustering - END
}
