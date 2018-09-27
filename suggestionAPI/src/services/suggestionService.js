'use strict';

var logger        = require('../lib/logUtil');
var commonUtil    = require('../lib/commonUtil');
var httpStatus    = require('http-status');



//var Client = require('node-rest-client').Client;

var Q = require('q');

function suggestionService() {
}

module.exports = suggestionService;



suggestionService.computeAgeSuggestion = function(age,iteratedData,graceAge,finalData){
    logger.msg('INFO', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', 'computeAgeSuggestion started');
    var d = Q.defer();
    // Later get the below value from Config file.
    var ageSuggestionMatrix=[
        {
            "lowerLimit": 0,
            "upperLimit": 1,
            "suggestionLevel": 1
        },
        {
            "lowerLimit": 2,
            "upperLimit": 5,
            "suggestionLevel": 0.5
        },
        {
            "lowerLimit": 6,
            "upperLimit": 10,
            "suggestionLevel": 0.2
        }
    ];
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
            //console.log("Age condition satisfied for "+ageSuggestionData.lowerLimit+" and "+ageSuggestionData.upperLimit+" for the diff "+ageDiff);
            logger.msg('INFO', 'computeAgeSuggestion', '', '', 'computeAgeSuggestion', "Age condition satisfied for "+ageSuggestionData.lowerLimit+" and "+ageSuggestionData.upperLimit+" for the diff "+ageDiff);
            //ageData.push(ageSuggestionData);

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

suggestionService.computeMonthlyIncomeSuggestion = function(monthlyIncome,iteratedData,graceMonthlyIncome,finalData){
    logger.msg('INFO', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', 'computeMonthlyIncomeSuggestion started');
    var d = Q.defer();
    // Later get the below value from Config file.
    var monthlyIncomeSuggestionMatrix=[
        {
            "lowerLimit": 0,
            "upperLimit": 100,
            "suggestionLevel": 1
        },
        {
            "lowerLimit": 101,
            "upperLimit": 300,
            "suggestionLevel": 0.5
        },
        {
            "lowerLimit": 301,
            "upperLimit": 500,
            "suggestionLevel": 0.2
        }
    ];
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
                //console.log("monthlyIncome condition satisfied for "+monthlyIncomeSuggestionData.lowerLimit+" and "+monthlyIncomeSuggestionData.upperLimit+" for the diff "+monthlyIncomeDiff);
            logger.msg('INFO', 'computeMonthlyIncomeSuggestion', '', '', 'computeMonthlyIncomeSuggestion', "monthlyIncome condition satisfied for "+monthlyIncomeSuggestionData.lowerLimit+" and "+monthlyIncomeSuggestionData.upperLimit+" for the diff "+monthlyIncomeDiff);
                //monthlyIncomeData.push(monthlyIncomeSuggestionData);
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
