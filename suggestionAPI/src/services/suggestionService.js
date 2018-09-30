'use strict';

var logger        = require('../lib/logUtil');
var commonUtil    = require('../lib/commonUtil');
var httpStatus    = require('http-status');
var constants = require('../lib/constants');
var fs = require('fs');
var parse = require('csv-parse');
var lodash = require('lodash');
var geolib = require('geolib');
var sort = require('fast-sort');

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
        logger.msg('INFO', 'v1', '', '', 'controllers', 'validation passed');

        // Getting the user inputs and store in some variables
        var age=req.query.age;
        var monthlyIncome=req.query.monthlyIncome;
        var latitude=req.query.latitude;
        var longitude=req.query.longitude;
        var experienced=req.query.experienced;

        if(age){
            age=parseInt(req.query.age)
        }

        if(monthlyIncome){
            monthlyIncome=parseInt(req.query.monthlyIncome)
        }

        if(latitude){
            latitude=parseFloat(req.query.latitude)
        }

        if(longitude){
            longitude=parseFloat(req.query.longitude);
        }

        logger.msg('INFO', 'v1', '', '', 'controllers', 'started to parse');
        var settingsConfig = require('nconf').file({file: 'config/settings.json'});
        var maxRecordsToDisplay=settingsConfig.get('maxRecordsToDisplay');
        var parser = parse({columns: true,skip_empty_lines: true}, function(err, csvData){
            //console.log("Lengrh::" + csvData.length);
        suggestionService.parseData(req,res,csvData,age,monthlyIncome,latitude,longitude,experienced)
            .then(function (tempData) {
                //console.log("before "+JSON.stringify(tempData));
                tempData=sort(tempData).desc(data => data.score);
                if(tempData!=null && tempData.length>maxRecordsToDisplay){
                    tempData.length=maxRecordsToDisplay;
                }

                return commonUtil.sendResponse(res, httpStatus.OK,tempData);
            },function (err) {
                logger.msg('ERROR', 'v1', '', '', 'controllers', 'Undefined error in controllers - ' + err.stack);
                return commonUtil.sendResponseWoBody(res, httpStatus.INTERNAL_SERVER_ERROR);
            });

        });
        resultSet.pipe(parser);
    }
};

suggestionService.parseData =  async function(req,res,csvData,age,monthlyIncome,latitude,longitude,experienced){
    var d = Q.defer();
    var result = await suggestionService.reduceData(req,res,csvData,age,monthlyIncome,latitude,longitude,experienced);
    //logger.msg('INFO', 'v1', '', '', 'controllers', 'result'+JSON.stringify(result) );
    d.resolve(result);
    return d.promise;
};

suggestionService.reduceData = function(req,res,csvData,age,monthlyIncome,latitude,longitude,experienced){
    var settingsConfig = require('nconf').file({file: 'config/settings.json'});
    // below variables holds to define the range for the search criteria.
    // For ex, if the user supplied age as 45 and the graceAge is 5, then our system will fetch the records from 40 to 50
    var graceAge=settingsConfig.get('graceAge');
    var graceMonthlyIncome=settingsConfig.get('graceMonthlyIncome');
    var graceMeters=settingsConfig.get('graceMeters');

    // Below variable defines the points for different set of age ranges
    var ageSuggestionMatrix=settingsConfig.get('ageSuggestionMatrix');
    var monthlyIncomeSuggestionMatrix=settingsConfig.get('monthlyIncomeSuggestionMatrix');
    var latLongSuggestionMatrixInMeters=settingsConfig.get('latLongSuggestionMatrixInMeters');
    var experiencedFlagSuggestion=settingsConfig.get('experiencedFlagSuggestion');

    var finalData = csvData.reduce((finalData, iteratedData) => {

        iteratedData.age=parseInt(iteratedData.age);
        iteratedData["monthly income"]=parseInt(iteratedData["monthly income"]);
        iteratedData.latitude=parseFloat(iteratedData.latitude);
        iteratedData.longitude=parseFloat(iteratedData.longitude);
        suggestionService.computeAgeSuggestion(age,iteratedData,graceAge,ageSuggestionMatrix,finalData)
            .then(function (finalData){
                return suggestionService.computeMonthlyIncomeAndExperiencedSuggestion(experienced,experiencedFlagSuggestion,monthlyIncome,iteratedData,graceMonthlyIncome,monthlyIncomeSuggestionMatrix,finalData);
                //return finalData;
            }).then(function (finalData){
                return suggestionService.computeLatLongSuggestion(latitude,longitude,iteratedData,graceMeters,latLongSuggestionMatrixInMeters,finalData);
            return finalData;
        }).then(function (finalData) {
            return finalData;
        },function (err) {
            logger.msg('ERROR', 'suggestionService', '', '', 'suggestionService', 'Undefined error in service - ' + err.stack);
            return commonUtil.sendResponseWoBody(res, httpStatus.INTERNAL_SERVER_ERROR);
        });
        return finalData;
    }, []);
    return finalData;
};
suggestionService.computeAgeSuggestion = function(age,iteratedData,graceAge,ageSuggestionMatrix,finalData){
    //logger.msg('DEBUG', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', 'computeAgeSuggestion started');
    var d = Q.defer();
    // satisfies with the grace period
    if(age && iteratedData.age >= age-graceAge && iteratedData.age <= age+graceAge){

        var ageDiff=0;
        if(iteratedData.age>=age){
            ageDiff=iteratedData.age-age;
        }else{
            ageDiff=age-iteratedData.age;
        }
            //logger.msg('DEBUG', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', 'grace age is found for '+iteratedData.name+' with diff '+ageDiff);
        var ageData = ageSuggestionMatrix.reduce((ageData, ageSuggestionData) => {
            if (ageDiff >=ageSuggestionData.lowerLimit && ageDiff<=ageSuggestionData.upperLimit) {
                //logger.msg('DEBUG', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', "Age condition satisfied for "+ageSuggestionData.lowerLimit+" and "+ageSuggestionData.upperLimit+" for the diff "+ageDiff);
                iteratedData.score=ageSuggestionData.suggestionLevel;
                //iteratedData.scoreAwardingField="age";
                finalData.push(iteratedData);
            }
            return ageData;
        }, []);

    }
    d.resolve(finalData);

    return d.promise;
};

suggestionService.computeMonthlyIncomeAndExperiencedSuggestion = function(experienced,experiencedFlagSuggestion,monthlyIncome,iteratedData,graceMonthlyIncome,monthlyIncomeSuggestionMatrix,finalData){
    //logger.msg('DEBUG', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', 'computeMonthlyIncomeSuggestion started');
    var d = Q.defer();
    if(monthlyIncome && iteratedData["monthly income"] >= monthlyIncome-graceMonthlyIncome && iteratedData["monthly income"] <= monthlyIncome+graceMonthlyIncome){

        var monthlyIncomeDiff=0;
        if(iteratedData["monthly income"]>=monthlyIncome){
            monthlyIncomeDiff=iteratedData["monthly income"]-monthlyIncome;
        }else{
            monthlyIncomeDiff=monthlyIncome-iteratedData["monthly income"];
        }
        /*logger.msg('DEBUG', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', 'grace monthly Income is found for '
                +iteratedData.name+' with diff '+monthlyIncomeDiff);*/
        var monthlyIncomeData = monthlyIncomeSuggestionMatrix.reduce((monthlyIncomeData, monthlyIncomeSuggestionData) => {
           if (monthlyIncomeDiff >=monthlyIncomeSuggestionData.lowerLimit && monthlyIncomeDiff<=monthlyIncomeSuggestionData.upperLimit) {
            //logger.msg('DEBUG', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', "monthlyIncome condition satisfied for "+monthlyIncomeSuggestionData.lowerLimit+" and "+monthlyIncomeSuggestionData.upperLimit+" for the diff "+monthlyIncomeDiff);

                if(iteratedData.score){
                    // Already this record has some score(based on age criteria).
                    iteratedData.score=iteratedData.score+monthlyIncomeSuggestionData.suggestionLevel;
                    //iteratedData.scoreAwardingField="age & monthlyIncome";
                }else{
                    iteratedData.score=monthlyIncomeSuggestionData.suggestionLevel;
                    //iteratedData.scoreAwardingField="monthlyIncome";
                    finalData.push(iteratedData);
                }
            }

        return monthlyIncomeData;
    }, []);


    }
    if(experienced && iteratedData.experienced.toUpperCase() == experienced.toUpperCase() ){
        if(iteratedData.score){
            // Already this record has some score(based on prevoius criteria).
            iteratedData.score=iteratedData.score+experiencedFlagSuggestion;
            //iteratedData.scoreAwardingField=iteratedData.scoreAwardingField+" & experienced";
        }else{
            iteratedData.score=experiencedFlagSuggestion;
            //iteratedData.scoreAwardingField="experienced";
            finalData.push(iteratedData);
        }
    }


    d.resolve(finalData);

    return d.promise;
};


suggestionService.computeLatLongSuggestion = function(latitude,longitude,iteratedData,graceMeters,latLongSuggestionMatrixInMeters,finalData){
    //logger.msg('INFO', 'computeLatLongSuggestion', '', '', 'computeLatLongSuggestion', 'computeLatLongSuggestion started');
    var d = Q.defer();


    if(latitude && longitude && iteratedData.latitude && iteratedData.longitude){
        var diffInMeters=geolib.getDistance(
            {latitude: latitude, longitude: longitude},
            {latitude: iteratedData.latitude, longitude:iteratedData.longitude}
        );
        if(diffInMeters<=graceMeters){
            //logger.msg('INFO', 'computeLatLongSuggestion', '', '', 'computeLatLongSuggestion', 'grace lat is found for '+iteratedData.name+' with diff '+diffInMeters);
            var latLongData = latLongSuggestionMatrixInMeters.reduce((latLongData, latLongSuggestionData) => {
                if (diffInMeters >=latLongSuggestionData.lowerLimit && diffInMeters<=latLongSuggestionData.upperLimit) {
                    /*logger.msg('INFO', 'computeLatLongSuggestion', '', '', 'computeLatLongSuggestion', "latLong condition satisfied for "+latLongSuggestionData.lowerLimit
                        +" and "+latLongSuggestionData.upperLimit+" for the diff "+diffInMeters);*/
                    if(iteratedData.score){
                        // Already this record has some score(based on age or monthlyIncome criteria).
                        iteratedData.score=iteratedData.score+latLongSuggestionData.suggestionLevel;
                        //iteratedData.scoreAwardingField=iteratedData.scoreAwardingField+" & LatLong";
                    }else{
                        iteratedData.score=latLongSuggestionData.suggestionLevel;
                        //iteratedData.scoreAwardingField="LatLong";
                        finalData.push(iteratedData);
                    }
                }

                return latLongData;
            }, []);
            d.resolve(finalData);
        }else{
            d.resolve(finalData);
        }
    }else{
        d.resolve(finalData);
    }

    return d.promise;
};

