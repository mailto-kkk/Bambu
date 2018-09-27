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



    //Get All Merchant-Campaigns
    router.get(constants.URI_PEOPLE_LIKE_YOU, function(req, res){
        logger.msg('INFO', 'v1', '', '', 'GET ' + constants.URI_PEOPLE_LIKE_YOU, 'GET All people like you');
        var inputPath="data/test.csv";
        var rs = fs.createReadStream(inputPath);
        var matchedRecords;
        var name=req.query.name;
        var age=parseInt(req.query.age);
        var monthlyIncome=parseInt(req.query.monthlyIncome);
        var latitude=parseInt(req.query.latitude);
        var longitude=parseInt(req.query.longitude);
        var experienced=req.query.experienced;
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

        // Later get the below value from Config file.
        var graceAge=10;
        var graceMonthlyIncome=500;

        var parser = parse({columns: true,skip_empty_lines: true}, function(err, data){


            var finalData = data.reduce((finalData, iteratedData) => {
                    iteratedData.age=parseInt(iteratedData.age);
                    iteratedData.monthlyIncome=parseInt(iteratedData.monthlyIncome);
                    suggestionService.computeAgeSuggestion(age,iteratedData,graceAge,finalData)
                    .then(function (finalData){
                        return suggestionService.computeMonthlyIncomeSuggestion(monthlyIncome,iteratedData,graceMonthlyIncome,finalData);
                    }).then(function (finalData) {
                        return ;

                    },function (err) {
                        logger.msg('ERROR', 'v1', '', '', 'controllers', 'Undefined error in controllers - ' + err.stack);
                        return commonUtil.sendResponseWoBody(res, httpStatus.INTERNAL_SERVER_ERROR);
                    });

                    /*if(monthlyIncome && iteratedData.monthlyIncome >= monthlyIncome-graceMonthlyIncome && iteratedData.monthlyIncome <= monthlyIncome+graceMonthlyIncome){
                        iteratedData.score="NeedToCompute";
                        iteratedData.searchField="monthlyIncome";
                        finalData.push(iteratedData);
                    }*/

            return finalData;
        }, []);
            return commonUtil.sendResponse(res, httpStatus.OK,finalData);
        });
        rs.pipe(parser);
    });



};
