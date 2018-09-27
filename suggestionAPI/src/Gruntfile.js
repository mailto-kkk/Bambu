'use strict';


module.exports = function (grunt) {

    // Load the project's grunt tasks from a directory
    require('grunt-config-dir')(grunt, {
        configDir: require('path').resolve('tasks')
    });

    grunt.initConfig({
        mochaTest: {
            unit: ['test/unit/*.js'],
            integration: ['test/integration/*.js']
        },
        mocha_istanbul: {
            coverage: {
                src: 'test/unit/*' // a folder works nicely
            }
        }
    });

    grunt.loadNpmTasks('grunt-mocha-cli');
    grunt.loadNpmTasks('grunt-mocha-istanbul');

    // Register group tasks
    grunt.registerTask('build', [ 'jshint', 'less', 'requirejs', 'i18n', 'copyto' ]);
    //grunt.registerTask('test', [ 'jshint', 'mochacli' ]);
	grunt.registerTask('unitTest', [ 'mochaTest:unit' ]);
    grunt.registerTask('integrationTest', [ 'mochaTest:integration' ]);
    grunt.registerTask('default', [ 'mochaTest:unit', 'mochaTest:integration' ]);
    grunt.registerTask('coverage', ['mocha_istanbul']);
};
