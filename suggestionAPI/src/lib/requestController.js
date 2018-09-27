'use strict';

var logger = require('./logUtil');
var commonUtil = require('./commonUtil');
var constants = require('./constants');
var httpStatus = require('http-status');


module.exports = function (req, res, next) {

    var accept = req.get('Accept');
    var contentType = req.get('content-type');
    var authorization = req.get('Authorization');
    var authorizationConfig = require('nconf').file({file: 'config/authorizationConfig.json'});
    var apiKeyArray = authorizationConfig.get('keys');
    var method = req.method;
    logger.msg('INFO', 'requestController', '', '', '', 'req.path = ' + req.path);
    if (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'GET') {
        logger.msg('INFO', 'requestController', '', '', '', 'accept = ' + accept);
        logger.msg('INFO', 'requestController', '', '', '', 'contentType = ' + contentType);
        var acceptFlag = false, authorizationFlag = false;

        acceptFlag = (!(accept === undefined || accept === null || accept === '' || accept === '*/*'));


        authorizationFlag = (!(authorization === undefined || authorization === null || authorization === ''));


    logger.msg('INFO', 'requestController', '', '', '', 'acceptFlag = ' + acceptFlag);

        if (acceptFlag && accept !== constants.CON_TYPE) {
            logger.msg('INFO', 'requestController', '', '', '', 'accept header is invalid');
            commonUtil.sendResponseWoBody(res, httpStatus.NOT_ACCEPTABLE);
        
        } else if (contentType && contentType !== constants.CON_TYPE) {
            logger.msg('INFO', 'requestController', '', '', '', 'content type is invalid');
            commonUtil.sendResponseWoBody(res, httpStatus.UNSUPPORTED_MEDIA_TYPE);
        } else if (!authorizationFlag || (authorizationFlag && !apiKeyArray.find(obj => obj.key.value === authorization))) {
            logger.msg('INFO', 'requestController', '', '', '', 'authorization Header is invalid');
            commonUtil.sendResponseWoBody(res, httpStatus.UNAUTHORIZED);
        } else {
            logger.msg('INFO', 'requestController', '', '', '', 'authorization Header is valid');
            next();
        }
    } else {
        next();
    }
};


