'use strict';

var log4js = require('log4js'),
    logId = 'SUGGESTION_API',
//nconf = require('nconf'),
    stackTrace = require('stack-trace/lib/stack-trace'),
    cluster = require('cluster'),
    Q = require('q');

var frameLoggerMsg = (loggerObj, callback) => {
    var loggerMsg = '', additionalInfo = '';
    loggerMsg = (loggerObj.controller) ? 'Controller:' + loggerObj.controller : '';
    loggerMsg = loggerMsg + ((loggerObj.model) ? ((loggerMsg) ? ',' : '') + 'Model:' + loggerObj.model : '');
    loggerMsg = loggerMsg + ((loggerObj.lib) ? ((loggerMsg) ? ',' : '') + 'Lib:' + loggerObj.lib : '');
    loggerMsg = loggerMsg + ((loggerObj.method) ? ((loggerMsg) ? ',' : '') + 'Method:' + loggerObj.method : '');
    if (loggerObj.printLineFile) {
        //Print worker process ID only after worker threads are created
        if (!cluster.isMaster) {
            additionalInfo = ' [Line:#' + loggerObj.line + ', File:' + loggerObj.file + ', WorkedPID:' + cluster.worker.process.pid + ']';
        } else {
            additionalInfo = ' [Line:#' + loggerObj.line + ', File:' + loggerObj.file + ']';
        }
    }
    loggerMsg = (loggerMsg) ? ' - [' + loggerMsg + ']' : '';
    loggerMsg = loggerObj.info + loggerMsg + additionalInfo;
    callback(loggerMsg);
};

var validateInput = (level, info, controller) => {
    var d = Q.defer();
    var definedLevels = new Set();
    var err;
    definedLevels.add('INFO').add('DEBUG').add('TRACE').add('WARN').add('ERROR').add('FATAL');
    if (!definedLevels.has(level)) {
        err = '[logUtil]: Invalid level. ';
        d.reject(err); //Reject error
    } else if (!info) {
        err = '[logUtil]: Info cannot be empty. ';
        d.reject(err); //Reject error
    } else if (!controller) {
        err = '[logUtil]: Controller cannot be empty. ';
        d.reject(err); //Reject error
    } else {
        d.resolve(true); //Resolve success
    }
    return d.promise;
};

var logger = () => {
    var log = log4js.getLogger(logId);
    return {
        config: (conf) => {
            console.log('logUtil: Logger configuration');
            log4js.configure(conf);
        },
        /*
         initialize: () => {
         return (req, res, next) => {
         log4js.connectLogger(log, {level: 'auto'}); //connect console.log to the logger
         next();
         };
         },
         */
        validateInput: (level, info, controller) => {
            return validateInput(level, info, controller);
        },
        frameLoggerMsg: (loggerObj, callback) => {
            return frameLoggerMsg(loggerObj, callback);
        },
        msg: (level, controller, model, lib, method, info) => {
            var file, frame, line, printLineFile;
            frame = stackTrace.get()[1];
            file = frame.getFileName();
            line = frame.getLineNumber();
            printLineFile = true; //nconf.get('loggerConfig').printLineNumber;
            //Validate input to logger.msg
            validateInput(level, info, controller)
                .then(() => {
                    //Frame logger message
                    var loggerObj = {
                        controller: controller,
                        model: model,
                        lib: lib,
                        method: method,
                        info: info,
                        printLineFile: printLineFile,
                        line: line,
                        file: file
                    };
                    frameLoggerMsg(loggerObj, (loggerMsg) => {
                        if (level === 'INFO') {
                            log.info(loggerMsg);
                        } else if (level === 'DEBUG') {
                            log.debug(loggerMsg);
                        } else if (level === 'TRACE') {
                            log.trace(loggerMsg);
                        } else if (level === 'WARN') {
                            log.warn(loggerMsg);
                        } else if (level === 'ERROR') {
                            log.error(loggerMsg);
                        } else if (level === 'FATAL') {
                            log.fatal(loggerMsg);
                        }
                    });
                })
                .fail((err) => {
                    log.error(err + 'Please check line #' + line + ' in ' + file);
                });
        }
    };
};
module.exports = logger();
