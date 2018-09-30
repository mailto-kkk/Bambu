/*global describe:false, it:false, before:false, after:false, afterEach:false*/

'use strict';

var commonUtil = require('../../lib/commonUtil');
var suggestionService = require('../../services/suggestionService');

var Q = require('q');
var chai = require('chai');
var expect = chai.expect;
var assert = chai.assert;
var sinon = require('sinon');
var httpStatus = require('http-status');
var geolib = require('geolib');
var sinonChai = require('sinon-chai');
chai.use(sinonChai);
require('sinon-as-promised');


var ageSuggestionMatrix=[
    {
        "lowerLimit": 0,
        "upperLimit": 1,
        "suggestionLevel": 0.5
    },
    {
        "lowerLimit": 2,
        "upperLimit": 5,
        "suggestionLevel": 0.3
    },
    {
        "lowerLimit": 6,
        "upperLimit": 10,
        "suggestionLevel": 0.2
    }
];

var monthlyIncomeSuggestionMatrix=[
    {
        "lowerLimit": 0,
        "upperLimit": 100,
        "suggestionLevel": 0.8
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
var experiencedFlagSuggestion=0.2;
var latLongSuggestionMatrixInMeters=[
    {
        "lowerLimit": 0,
        "upperLimit": 100,
        "suggestionLevel": 0.5
    },
    {
        "lowerLimit": 101,
        "upperLimit": 300,
        "suggestionLevel": 0.3
    },
    {
        "lowerLimit": 301,
        "upperLimit": 500,
        "suggestionLevel": 0.2
    }
];


//========================================================================================TestCases starts below


describe('Method: computeAgeSuggestion() - compute score based on age criteria', () => {

    it('should return empty JSON,As there is no matching criteria', (done) => {
        let age=95,graceAge=5;
        let expectedJSON = [];
        let finalData=[];
        let iteratedData={
            "name": "Kendra1",
            "age": 45,
            "latitude": 40.71667,
            "longitude": 19.56667,
            "monthly income": 5000,
            "experienced": "false"
        };
        suggestionService.computeAgeSuggestion(age,iteratedData,graceAge,ageSuggestionMatrix,finalData).then(function (actual) {
                expect(actual).to.deep.equal(expectedJSON);
                done();
            });

    }); // end of 'test case 1'

    it('should return JSON As there is a matching criteria', (done) => {
        let age=45,graceAge=5;
        let expectedJSON = [
            {
                "name": "Kendra1",
                "age": 45,
                "latitude": 40.71667,
                "longitude": 19.56667,
                "monthly income": 5000,
                "experienced": "false",
                "score": 0.5
            }
        ];
        let finalData=[];

        let iteratedData={
            "name": "Kendra1",
            "age": 45,
            "latitude": 40.71667,
            "longitude": 19.56667,
            "monthly income": 5000,
            "experienced": "false"
        };
        suggestionService.computeAgeSuggestion(age,iteratedData,graceAge,ageSuggestionMatrix,finalData).then(function (actual) {
            expect(actual).to.deep.equal(expectedJSON);
                done();
            });
        }); // end of 'test case 2'
}); // end of 'Describe'



//  computeMonthlyIncomeSuggestion test case
describe('Method: computeMonthlyIncomeSuggestion() - compute score based on monthlyIncome criteria', () => {

    it('should return empty JSON,As there is no matching criteria', (done) => {
        let experienced="TRUE",monthlyIncome=100,graceMonthlyIncome=100;
        let expectedJSON = [];
        let finalData=[];
        let iteratedData={
            "name": "Kendra1",
            "age": 45,
            "latitude": 40.71667,
            "longitude": 19.56667,
            "monthly income": 5000,
            "experienced": "false"
        };

        suggestionService.computeMonthlyIncomeAndExperiencedSuggestion(experienced,experiencedFlagSuggestion,monthlyIncome,iteratedData,graceMonthlyIncome,monthlyIncomeSuggestionMatrix,finalData).then(function (actual) {
            expect(actual).to.deep.equal(expectedJSON);
            done();
        });

    }); // end of 'test case 1'

    it('should return JSON As there is a matching criteria', (done) => {
        let experienced="FALSE",monthlyIncome=5000,graceMonthlyIncome=100;
        let expectedJSON = [
            {
                "name": "Kendra1",
                "age": 45,
                "latitude": 40.71667,
                "longitude": 19.56667,
                "monthly income": 5000,
                "experienced": "false",
                "score": 1
            }
        ];
        let iteratedData={
            "name": "Kendra1",
            "age": 45,
            "latitude": 40.71667,
            "longitude": 19.56667,
            "monthly income": 5000,
            "experienced": "false"
        };
        let finalData=[];
            suggestionService.computeMonthlyIncomeAndExperiencedSuggestion(experienced,experiencedFlagSuggestion,monthlyIncome,iteratedData,graceMonthlyIncome,monthlyIncomeSuggestionMatrix,finalData).then(function (actual) {
                //console.log("actual is "+JSON.stringify(actual)) ;
                expect(actual).to.deep.equal(expectedJSON);
                done();
            });
        }); // end of 'test case 2'

}); // end of 'Describe'



//  computeLatLongSuggestion test case
describe('Method: computeLatLongSuggestion() - compute score based on latLong criteria', () => {

    it('should return empty JSON,As there is no matching criteria for latLong', (done) => {
        let latitude=50.71667,longitude=29.56667,graceMeters=100;
        let expectedJSON = [];
        let finalData=[];
        let iteratedData={
            "name": "Kendra1",
            "age": 45,
            "latitude": 40.71667,
            "longitude": 19.56667,
            "monthly income": 5000,
            "experienced": "false"
        };

        let stubGeoLibReq = sinon.stub(geolib, 'getDistance');
        stubGeoLibReq.returns(1000);

        suggestionService.computeLatLongSuggestion(latitude,longitude,iteratedData,graceMeters,latLongSuggestionMatrixInMeters,finalData).then(function (actual) {

            expect(actual).to.deep.equal(expectedJSON);
            stubGeoLibReq.restore();
            done();
        });

    }); // end of 'test case 1'

    it('should return JSON As there is a matching criteria', (done) => {
        let latitude=40.71667,longitude=19.56667,graceMeters=100;
        let expectedJSON = [
            {
                "name": "Kendra1",
                "age": 45,
                "latitude": 40.71667,
                "longitude": 19.56667,
                "monthly income": 5000,
                "experienced": "false",
                "score": 0.5
            }
        ];
        let iteratedData={
            "name": "Kendra1",
            "age": 45,
            "latitude": 40.71667,
            "longitude": 19.56667,
            "monthly income": 5000,
            "experienced": "false"
        };
        let finalData=[];

        let stubGeoLibReq = sinon.stub(geolib, 'getDistance');
        stubGeoLibReq.returns(0);

        suggestionService.computeLatLongSuggestion(latitude,longitude,iteratedData,graceMeters,latLongSuggestionMatrixInMeters,finalData).then(function (actual) {
                console.log("actual is "+JSON.stringify(actual)) ;
                expect(actual).to.deep.equal(expectedJSON);
                stubGeoLibReq.restore();
                done();
            });
        }); // end of 'test case 2'

}); // end of 'Describe'
