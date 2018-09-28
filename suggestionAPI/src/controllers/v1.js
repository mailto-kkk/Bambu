'use strict';
var logger = require('../lib/logUtil');
var constants = require('../lib/constants');
var commonUtil = require('../lib/commonUtil');
var httpStatus = require('http-status');
var suggestionService = require('../services/suggestionService');
var fs = require('fs');
var parse = require('csv-parse');
var lodash = require('lodash');

module.exports = function (router) {

    router.get(constants.URI_PEOPLE_LIKE_YOU, function(req, res){
        logger.msg('INFO', 'v1', '', '', 'GET ' + constants.URI_PEOPLE_LIKE_YOU, 'GET All people like you');
        suggestionService.getSuggestedData(req,res);
    });
};
