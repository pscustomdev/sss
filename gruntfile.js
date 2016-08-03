"use strict";

module.exports = function(grunt) {
    var cfg = require('./config.js');
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: ['dist'],
            production: ['gruntfile.js','copyAuthConf', 'installer.js', 'README.md','sss.iml','tests', 'public/app/controllers','public/app/services','.idea','docs','node-modules','public/bower']
        },
        concat: {   // Concatenate files
            package: {
                files: {
                    'dist/sss.js': ['public/app/controllers/*.js','public/app/services/*.js','public/app/*.js']
                }
            }
        },
        csslint: {  // Lint CSS files
            options: {
                import: false
            },
            src: ['public/css/**/*.css']
        },
        jshint: {   // Validate files with JSHint
            tests: {
                options: {
                    node: true,
                    expr: true,
                    mocha: true
                },
                src: ['tests/**/*.js']  // Comment entire line to DISABLE JSHINT.  Until we get our baseline cleaned up, this will be pretty noisy.
            },
            js: {
                options: {
                    node: true,
                    mocha: true
                },
                src: [
                    '**/*.js',
                    '!node_modules/**/*.js'
                ]
            }
        },
        karma: {    // Run frontend javascript (eg AngularJS) Karma tests as defined in config.
            options: {
                configFile: 'tests/karma.conf.js',
                autoWatch: false,   // disable the Karma server file watch functionality.  This will be done via Grunt's Watch.
                background: false,   // Keep tests on main process so you can see the results better.
                singleRun: true    // Keep Karma server running in background for use by each test
            },
            'single-pass': {
                options: {
                }
            }
        },
        mochaTest: {    // Run backend javascript (eg Node) Mocha tests as defined here.
            'single-pass': {
                src: 'tests/backend-unit-tests/**/*-spec.js',
                options: {
                    reporter: 'spec',
                    timeout: '8000'
                }
            }
        },
        protractor: {   // Run end-to-end (eg Browser/GUI) Protractor tests as defined in config.
            options: {
                configFile: 'tests/protractor.conf.js', // Default config file
                webdriverManagerUpdate: true,
                keepAlive: true, // If false, the grunt process stops when the test fails.
                noColor: false // If true, protractor will not use colors in its output.
            },
            'single-pass': {
                options: {
                }
            }
        },
        uglify: {   // Minify files with UglifyJS
            options: {
                mangle: false
            },
            package: {
                files: {
                    'public/app/sss.min.js': ['dist/sss.js']
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-protractor-runner');

    grunt.registerTask('backend-tests', ['mochaTest:single-pass']);
    grunt.registerTask('default', ['run-all-tests']);
    grunt.registerTask('build-production', ['clean:dist', 'concat', 'uglify', 'clean:production']);
    grunt.registerTask('build-testing', ['clean:dist', 'concat', 'uglify']);
    //grunt.registerTask('build-production', ['run-all-tests','clean', 'concat', 'uglify']);
    grunt.registerTask('end2end-tests', ['protractor:single-pass']);
    grunt.registerTask('frontend-tests', ['karma:single-pass']);
    grunt.registerTask('jshint', ['jshint:js', 'jshint:tests']);
    grunt.registerTask('csslint', ['csslint']);
    // grunt.registerTask('run-all-tests', ['frontend-tests', 'backend-tests', 'end2end-tests']);
    grunt.registerTask('run-all-tests', ['backend-tests']);
};