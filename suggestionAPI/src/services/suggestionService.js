'use strict';

var logger        = require('../lib/logUtil');
var commonUtil    = require('../lib/commonUtil');
var httpStatus    = require('http-status');
var constants = require('../lib/constants');
var fs = require('fs');
var parse = require('csv-parse');
var lodash = require('lodash');

//var Client = require('node-rest-client').Client;

var Q = require('q');

function suggestionService() {
}

module.exports = suggestionService;

suggestionService.getSuggestedData = async function (req,res) {
    var inputPath=constants.SEEDING_DATA;
    var resultSet = fs.createReadStream(inputPath);
    var matchedRecords;
    var validationResult = await commonUtil.validateSuggestionGetRequest(req,res);
    if(validationResult){
        var settingsConfig = require('nconf').file({file: 'config/settings.json'});

        // Getting the user inputs and store in some variables
        var age=parseInt(req.query.age);
        var monthlyIncome=parseInt(req.query.monthlyIncome);
        var latitude=parseInt(req.query.latitude);
        var longitude=parseInt(req.query.longitude);
        var experienced=req.query.experienced;

        // below variables holds to define the range for the search criteria.
        // For ex, if the user supplied age as 45 and the graceAge is 5, then our system will fetch the records from 40 to 50
        var graceAge=settingsConfig.get('graceAge');
        var graceMonthlyIncome=settingsConfig.get('graceMonthlyIncome');

        // Below variable defines the points for different set of age ranges
        var ageSuggestionMatrix=settingsConfig.get('ageSuggestionMatrix');
        var monthlyIncomeSuggestionMatrix=settingsConfig.get('monthlyIncomeSuggestionMatrix');

        var parser = parse({columns: true,skip_empty_lines: true}, function(err, data){
            var finalData = data.reduce((finalData, iteratedData) => {
                iteratedData.age=parseInt(iteratedData.age);
            iteratedData.monthlyIncome=parseInt(iteratedData.monthlyIncome);
            suggestionService.computeAgeSuggestion(age,iteratedData,graceAge,ageSuggestionMatrix,finalData)
                .then(function (finalData){
                    return suggestionService.computeMonthlyIncomeSuggestion(monthlyIncome,iteratedData,graceMonthlyIncome,monthlyIncomeSuggestionMatrix,finalData);
                }).then(function (finalData) {
                return ;

            },function (err) {
                logger.msg('ERROR', 'v1', '', '', 'controllers', 'Undefined error in controllers - ' + err.stack);
                return commonUtil.sendResponseWoBody(res, httpStatus.INTERNAL_SERVER_ERROR);
            });

            return finalData;
        }, []);
            return commonUtil.sendResponse(res, httpStatus.OK,finalData);
        });
        resultSet.pipe(parser);
    }



};

suggestionService.computeAgeSuggestion = function(age,iteratedData,graceAge,ageSuggestionMatrix,finalData){
    logger.msg('INFO', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', 'computeAgeSuggestion started');
    var d = Q.defer();

    // satisfies with the grace period
    if(age && iteratedData.age >= age-graceAge && iteratedData.age <= age+graceAge){
        var ageDiff=0;
        if(iteratedData.age>=age){
            ageDiff=iteratedData.age-age;
        }else{
            ageDiff=age-iteratedData.age;
        }
        logger.msg('INFO', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', 'grace age is found for '+iteratedData.name+' with diff '+ageDiff);
        var ageData = ageSuggestionMatrix.reduce((ageData, ageSuggestionData) => {
           if (ageDiff >=ageSuggestionData.lowerLimit && ageDiff<=ageSuggestionData.upperLimit) {
            logger.msg('INFO', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', "Age condition satisfied for "+ageSuggestionData.lowerLimit+" and "+ageSuggestionData.upperLimit+" for the diff "+ageDiff);
            iteratedData.score=ageSuggestionData.suggestionLevel;
            iteratedData.searchField="age";
            finalData.push(iteratedData);
        }
        return ageData;
    }, []);

    }
    d.resolve(finalData);

    return d.promise;
};

suggestionService.computeMonthlyIncomeSuggestion = function(monthlyIncome,iteratedData,graceMonthlyIncome,monthlyIncomeSuggestionMatrix,finalData){
    logger.msg('INFO', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', 'computeMonthlyIncomeSuggestion started');
    var d = Q.defer();

    if(monthlyIncome && iteratedData.monthlyIncome >= monthlyIncome-graceMonthlyIncome && iteratedData.monthlyIncome <= monthlyIncome+graceMonthlyIncome){

        var monthlyIncomeDiff=0;
        if(iteratedData.monthlyIncome>=monthlyIncome){
            monthlyIncomeDiff=iteratedData.monthlyIncome-monthlyIncome;
        }else{
            monthlyIncomeDiff=monthlyIncome-iteratedData.monthlyIncome;
        }
        logger.msg('INFO', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', 'grace monthly Income is found for '+iteratedData.name+' with diff '+monthlyIncomeDiff);
        var monthlyIncomeData = monthlyIncomeSuggestionMatrix.reduce((monthlyIncomeData, monthlyIncomeSuggestionData) => {
           if (monthlyIncomeDiff >=monthlyIncomeSuggestionData.lowerLimit && monthlyIncomeDiff<=monthlyIncomeSuggestionData.upperLimit) {
            logger.msg('INFO', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', "monthlyIncome condition satisfied for "+monthlyIncomeSuggestionData.lowerLimit+" and "+monthlyIncomeSuggestionData.upperLimit+" for the diff "+monthlyIncomeDiff);
            if(iteratedData.score){
                // Already this record has some score(based on age criteria).
                iteratedData.score=iteratedData.score+monthlyIncomeSuggestionData.suggestionLevel;
                iteratedData.searchField="age & monthlyIncome";
            }else{
                iteratedData.score=monthlyIncomeSuggestionData.suggestionLevel;
                iteratedData.searchField="monthlyIncome";
                finalData.push(iteratedData);
            }
            }

        return monthlyIncomeData;
    }, []);


    }
    d.resolve(finalData);

    return d.promise;
};


