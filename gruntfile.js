"use strict";

module.exports = function(grunt) {
    var cfg = require('./config.js');
    var productionPort = 10 + cfg.serverPort;
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        clean: {
            dist: ['dist'],
            production: ['gruntfile.js','copyAuthConf', 'installer.js', 'README.md','sss.iml','tests', 'public/app/controllers','public/app/services','.idea','docs','node-modules','public/bower']
        }
            ,
        concat: {   // Concatenate files
            package: {
                files: {
                    'dist/sss.js': ['public/app/controllers/*.js','public/app/services/*.js']
                }
            }
        },
        concurrent: {
            'sss-development-mode': {
                tasks: ['nodemon:sss'],
                //tasks: ['nodemon:sss', 'watch:js', 'watch:tests', 'watch:css', 'watch:dev'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-development-debug-mode': {
                tasks: ['nodemon:sss-debug'],
                //tasks: ['nodemon:sss-debug', 'watch:js', 'watch:tests', 'watch:css', 'watch:dev'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-production-mode': {
                tasks: ['nodemon:sss-production'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'run-all-tests': {
                tasks: ['run-all-tests'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        csslint: {  // Lint CSS files
            options: {
                import: false
            },
            src: ['public/css/**/*.css']
        },
        env: {
            debug: {
                NODE_ENV: 'development',
                PORT: cfg.serverPort,
                DEBUG: 'SSS:*'
            },
            dev: {
                NODE_ENV: 'development' ,
                PORT: cfg.serverPort
            },
            prod: {
                NODE_ENV: 'production',
                PORT: productionPort
            }
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
                    reporter: 'spec'
                }
            }
        },
        nodemon: {    // Restart NodeJS's Application whenever watched file patterns are added, changed or deleted
            sss: {
                script: 'bin/www',
                ignore:  ['node_modules/**'],
                options: {
                    ext: 'js',
                    watch: ['auth', 'db', 'routes', 'views'],
                    delay: 300,
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });

                        /** Open the application in a new browser window **/
                        nodemon.on('config:update', function () {
                            // Delay before server listens on port
                            setTimeout(function () {
                                require('open')('http://localhost:' + cfg.serverPort);
                            }, 1000);
                        });
                    }
                }
            },
            'sss-debug': {
                script: 'bin/www',
                ignore:  ['node_modules/**'],
                options: {
                    nodeArgs: ['--debug'],
                    ext: 'js',
                    watch: ['auth', 'db', 'routes', 'views'],
                    delay: 300,
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });

                        /** Open the application in a new browser window **/
                        nodemon.on('config:update', function () {
                            // Delay before server listens on port
                            setTimeout(function () {
                                require('open')('http://localhost:' + cfg.serverPort);
                            }, 1000);
                        });
                    }
                }
            },
            'sss-production': {
                script: 'dist/sss/bin/www',
                ignore:  ['node_modules/**'],
                options: {
                    ext: 'js',
                    watch: ['auth', 'db', 'routes', 'views'],
                    delay: 300,
                    callback: function (nodemon) {
                        nodemon.on('log', function (event) {
                            console.log(event.colour);
                        });

                        /** Open the application in a new browser window **/
                        nodemon.on('config:update', function () {
                            // Delay before server listens on port
                            setTimeout(function () {
                                require('open')('http://localhost:' + productionPort);
                            }, 1000);
                        });
                    }
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
        },
        watch: {    // Run predefined tasks whenever watched file patterns are added, changed or deleted
            dev: {
                files: ['<%= jshint.js.files =>', '<%= jshint.tests.files =>', 'package.json', 'bower.json'],
                tasks: ['concurrent:run-all-tests'],
                options: {
                    atBegin: true
                }
            },
            css: {
                files: ['<%= csslint.files =>'],
                tasks: ['csslint'],
                options: {
                    atBegin: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-nodeMon');
    grunt.loadNpmTasks('grunt-protractor-runner');
    grunt.loadNpmTasks('grunt-remove');

    grunt.registerTask('backend-tests', ['mochaTest:single-pass']);
    grunt.registerTask('default', ['sss-development-mode']);
    grunt.registerTask('build-production', ['clean:dist', 'concat', 'uglify', 'clean:production']);
    //grunt.registerTask('build-production', ['run-all-tests','clean', 'concat', 'uglify']);
    grunt.registerTask('end2end-tests', ['protractor:single-pass']);
    grunt.registerTask('frontend-tests', ['karma:single-pass']);
    grunt.registerTask('jshint', ['jshint:js', 'jshint:tests']);
    grunt.registerTask('csslint', ['csslint']);
    // grunt.registerTask('run-all-tests', ['frontend-tests', 'backend-tests', 'end2end-tests']);
    grunt.registerTask('run-all-tests', ['backend-tests', 'end2end-tests']);
    grunt.registerTask('sss-development-mode', ['env:dev', 'concurrent:sss-development-mode']);
    grunt.registerTask('sss-production-mode', ['env:prod', 'concurrent:sss-production-mode']);
    grunt.registerTask('sss-debug-mode', ['env:debug', 'concurrent:sss-development-debug-mode']);
};