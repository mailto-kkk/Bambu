'use strict';
/**
 * Utility module that allows the following:
 *
 */
var lodash = require('lodash');

function commonUtil() {
}

module.exports = commonUtil;

var logger = require('./logUtil');
var constants = require('./constants');
var Q = require('q');
var httpStatus = require('http-status');

commonUtil.validateSuggestionGetRequest = function(req,res){
    logger.msg('INFO', 'validateSuggestionGetRequest', '', '', 'validateSuggestionGetRequest', 'validateSuggestionGetRequest started');
    var d = Q.defer();
    var age=req.query.age;
    var monthlyIncome=req.query.monthlyIncome;
    var latitude=req.query.latitude;
    var longitude=req.query.longitude;
    var experienced=req.query.experienced;
    if(age){
        if(!isInt(age) || age<=0){
            logger.msg('INFO', 'v1', '', '', 'GET ', 'Age is not a number');
            return commonUtil.sendResponseWoBody(res, httpStatus.BAD_REQUEST);
        }
    }
    if(monthlyIncome){
        if(!isInt(monthlyIncome) || monthlyIncome<=0){
            logger.msg('INFO', 'v1', '', '', 'GET ', 'monthlyIncome is not a number');
            return commonUtil.sendResponseWoBody(res, httpStatus.BAD_REQUEST);
        }
    }
    if(latitude && !longitude){
        // Both Lat and Long has to come in pairs. or it is an error scenario
        logger.msg('INFO', 'v1', '', '', 'GET ', 'Only latitude is present. so error condition');
        return commonUtil.sendResponseWoBody(res, httpStatus.BAD_REQUEST);
    }
    if(!latitude && longitude){
        // Both Lat and Long has to come in pairs. or it is an error scenario
        logger.msg('INFO', 'v1', '', '', 'GET ', 'Only longitude is present. so error condition');
        return commonUtil.sendResponseWoBody(res, httpStatus.BAD_REQUEST);
    }
    if(latitude && longitude){
        if(isNaN(latitude) || isNaN(longitude)){
            logger.msg('INFO', 'v1', '', '', 'GET ', 'latitude/longitude is not a number');
            return commonUtil.sendResponseWoBody(res, httpStatus.BAD_REQUEST);
        }
    }
    d.resolve(true);

    return d.promise;
};

function isInt(value) {
    return (parseFloat(value) == parseInt(value)) && !isNaN(value);
}
/**
 * Send response without body
 * @param res
 * @param httpCode
 */
commonUtil.sendResponseWoBody = function (res, httpCode) {
    commonUtil.constructCommonResponseHeader(res, httpCode)
        .then(function (res) {
            res.status(httpCode);
            res.end();
        });

};

/**
 * Send response with body
 * @param res
 * @param httpCode
 * @param renderingContent
 */
commonUtil.sendResponse = function (res, httpCode, renderingContent) {
    commonUtil.constructCommonResponseHeader(res, httpCode)
        .then(function (res) {
            res.status(httpCode);
            res.end(JSON.stringify(renderingContent, null, 2));
        });

};

/**
 * Utility to construct Common Response Header
 * @param res
 * @param httpCode
 * @returns {d.promise}
 */
commonUtil.constructCommonResponseHeader = function (res, httpCode) {
    var d = Q.defer();
    res.contentType(constants.CON_TYPE_UTF);
    res.header('Cache-Control', 'no-cache');
    res.header('Pragma', 'no-cache');
    res.header('Expires', '0');
    res.header('X-FRAME-OPTIONS', 'deny');
    res.header('Server', 'Node JS / 6.1.0');
    res.header('X-XSS-Protection', '1; mode=block');
    res.header('X-WebKit-CSP', 'default-src self');
    res.header('X-Content-Type-Options', 'nosniff');

    /*sets the Cross-origin resource sharing (CORS) headers*/
    commonUtil.setCorsResponseHeaders(res)
        .then(function (res) {
            if (httpCode === httpStatus.UNAUTHORIZED) {
                res.writeHead(httpStatus.UNAUTHORIZED, {
                    'WWW-Authenticate': 'Basic realm=SuggestionAPI'
                });
            }
            d.resolve(res);
        });

    return d.promise;
};

/**
 * Utility to set Cross-origin resource sharing (CORS) headers
 * @param res
 * @returns {d.promise}
 */
commonUtil.setCorsResponseHeaders = function (res) {
    var d = Q.defer();

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'HEAD, GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'content-type, accept, authorization, from, Api-Key, Api-Version');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    d.resolve(res);
    return d.promise;
};



