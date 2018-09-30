"use strict";


module.exports = function mochaTest(grunt) {
	// Load task
	grunt.loadNpmTasks("grunt-mocha-test");

	// Options
	return {
	    "src": ["test/*.js"],
	    "options": {
	        "ui": "bdd",
                "reporter": "xunit",
	        "timeout": 10000,
	        "ignoreLeaks": false,
                "force":false,
                "quiet":true,
                "captureFile":"testResults.xml", //NOTE: save option currently is not including test summary and error details
                "bail": false,
                "colors":false
	    }
	};
};
