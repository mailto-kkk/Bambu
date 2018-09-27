'use strict';

var commonUtil = require('../lib/commonUtil');
var httpStatus = require('http-status');

module.exports = function () {

    return function fileNotFound(req, res, next) {
		commonUtil.sendResponseWoBody(res, httpStatus.NOT_FOUND);
    };

};
