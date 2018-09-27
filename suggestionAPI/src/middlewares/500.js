'use strict';

var commonUtil = require('../lib/commonUtil');
var httpStatus = require('http-status');

module.exports = function () {

    return function serverError(err, req, res, next) {
        commonUtil.sendResponseWoBody(res, httpStatus.BAD_REQUEST);
    };

};
