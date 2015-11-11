"use strict";

module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        env: {
            debug: {
                NODE_ENV: 'development',
                DEBUG: 'SSS:*'
            },
            dev: {
                NODE_ENV: 'development'
            },
            prod: {
                NODE_ENV: 'production'
            }
        },
        clean: {
            temp: {
                src: [ 'tmp' ]
            }
        },
        compress: {
            dist: {
                options: {
                    archive: 'dist/<%= pkg.name %>-<%= pkg.version %>.zip'
                },
                files: [{
                    src: [ 'index.html' ],
                    dest: '/'
                }, {
                    src: [ 'dist/**' ],
                    dest: 'dist/'
                }, {
                    src: [ 'assets/**' ],
                    dest: 'assets/'
                }, {
                    src: [ 'libs/**' ],
                    dest: 'libs/'
                }]
            }
        },
        concat: {   // Concatenate files
            dist: {
                src: ['public/js/app/app.js', 'public/js/app/**/*.js'],
                dest: 'public/js/build/sss.js'
            }
        },
        concurrent: {
            'sss-development': {
                tasks: ['env:dev', 'nodemon:dev', 'watch:dev', 'watch:js', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-debug-mode': {
                tasks: ['env:debug', 'nodemon:dev-debug', 'watch:dev', 'watch:js', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-continuous-integration': {
                tasks: ['env:prod', 'nodemon:dev'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'run-all-tests': {
                tasks: ['all-tests'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        connect: {
            server: {
                options: {
                    hostname: 'localhost',
                    port: 3000
                }
            }
        },
        csslint: {  // Lint CSS files
            options: {
                import: false   // @import is known to cause synchronous downloading of stylesheets, thus will hurt performance.  We don't care yet, so disabling warnings.
            },
            src: ['public/css/**/*.css']
        },
        jshint: {   // Validate files with JSHint
            src: ['*.js', 'bin/www', 'auth/**/*.js', 'db/**/*.js', 'tests/**/*.js', 'routes/**/*.js', 'public/js/app/*.js']
        },
        karma: {    // Run frontend javascript (eg AngularJS) Karma tests as defined in config.
            options: {
                configFile: 'tests/karma.conf.js',
                autoWatch: false,   // disable the Karma server file watch functionality.  This will be done via Grunt's Watch.
                background: false,   // Keep tests on main process so you can see the results better.
                singleRun: true    // Keep Karma server running in background for use by each test
            },
            'continuous-integration': {
                options: {
                }
            },
            'single-pass': {
                options: {
                }
            }
        },
        mochaTest: {    // Run backend javascript (eg Node) Mocha tests as defined here.
            'continuous-integration': {
                src: 'tests/backend-unit-tests/**/*-spec.js',
                options: {
                    reporter: 'spec'
                }
            },
            'single-pass': {
                src: 'tests/backend-unit-tests/**/*-spec.js',
                options: {
                    reporter: 'spec'
                }
            }
        },
        nodemon: {    // Restart NodeJS's Application whenever watched file patterns are added, changed or deleted
            dev: {
                script: 'bin/www',
                options: {
                    ext: 'js, hbs',
                    watch: ['auth', 'db', 'routes', 'views']
                },
                callback: function (nodemon) {
                    nodemon.on('log', function (event) {
                        console.log(event.colour);
                    });

                    // opens browser on initial server start
                    nodemon.on('config:update', function () {
                        // Delay before server listens on port
                        setTimeout(function() {
                            require('open')('http://localhost:3000');
                        }, 1000);
                    });
                }
            },
            'dev-debug': {
                script: 'bin/www',
                options: {
                    nodeArgs: ['--debug'],
                    ext: 'js, hbs',
                    watch: ['auth', 'db', 'routes', 'views']
                },
                callback: function (nodemon) {
                    nodemon.on('log', function (event) {
                        console.log(event.colour);
                    });

                    // opens browser on initial server start
                    nodemon.on('config:update', function () {
                        // Delay before server listens on port
                        setTimeout(function() {
                            require('open')('http://localhost:3000');
                        }, 1000);
                    });
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
            'continuous-integration': {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
                options: {
                }
            },
            'single-pass': {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
                options: {
                }
            }
        },
        uglify: {   // Minify files with UglifyJS
            files: {
                'public/js/build/sss.js': ['public/js/build/sss.min.js']
            },
            options: {
                mangle: false
            }
        },
        watch: {    // Run predefined tasks whenever watched file patterns are added, changed or deleted
            dev: {
                files: ['<%= jshint.files =>', 'package.json', 'bower.json'],
                tasks: ['run-all-tests'],
                options: {
                    atBegin: true
                }
            },
            js: {
                files: ['<%= jshint.files =>'],
                tasks: ['jshint']
            },
            css: {
                files: ['<%= csslint.files =>'],
                tasks: ['csslint']
            }
        }
    });

    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
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


    grunt.registerTask('backend-tests', ['mochaTest:single-pass']);
    grunt.registerTask('build', ['run-all-tests', 'lint', 'concat', 'uglify']);
    grunt.registerTask('default', ['run-all-tests']);
    grunt.registerTask('end2end-tests', ['protractor:single-pass']);
    grunt.registerTask('frontend-tests', ['karma:single-pass']);
    grunt.registerTask('lint', ['jshint', 'csslint']);
    grunt.registerTask('package', [ 'lint', 'karma:unit', 'concat:dist', 'uglify:dist', 'clean:temp', 'compress:dist' ]);
    grunt.registerTask('run-all-tests', ['frontend-tests', 'backend-tests', 'end2end-tests']);
    grunt.registerTask('run-all-tests', ['concurrent:run-all-tests']);

    grunt.registerTask('sss-development', ['concurrent:sss-development']);
    grunt.registerTask('sss-continuous-integration', ['concurrent:sss-continuous-integration']);
    grunt.registerTask('sss-debug-mode', ['concurrent:sss-debug-mode']);
};