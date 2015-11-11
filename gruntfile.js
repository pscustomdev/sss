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
                            require('open')('http://localhost:5455');
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
                            require('open')('http://localhost:5455');
                        }, 1000);
                    });
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
            'development': {
                src: 'tests/backend-unit-tests/**/*-spec.js',
                options: {
                    reporter: 'spec'
                }
            }
        },
        karma: {    // Run frontend javascript (eg AngularJS) Karma tests as defined in config.
            options: {
                configFile: 'tests/karma.conf.js',
                autoWatch: false   // disable the Karma server file watch functionality.  This will be done via Grunt's Watch.
            },
            'continuous-integration': {
                background: false,   // Keep tests on main process so you can see the results better.
                singleRun: true    // Shutdown the Karma server after test.
            },
            development: {
                background: true,   // Run tests in background process so subsequent Grunt tasks can run.
                singleRun: false    // Keep Karma server running in background for use by each test
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
            development: {   // Grunt requires at least one target to run so you can simply put 'all: {}' here too.
                options: {
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
        clean: {
            temp: {
                src: [ 'tmp' ]
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
        concat: {   // Concatenate files
            dist: {
                src: ['public/js/app/app.js', 'public/js/app/**/*.js'],
                dest: 'public/js/build/sss.js'
            }
        },
        connect: {
            server: {
                options: {
                    hostname: 'localhost',
                    port: 5455
                }
            }
        },
        watch: {    // Run predefined tasks whenever watched file patterns are added, changed or deleted
            dev: {
                files: ['gruntfile.js', 'package.json', 'bower.json'],
                tasks: ['jshint', 'karma:development:run','protractor:development','mochaTest:development'],
                options: {
                    atBegin: true
                }
            },
            min: {
                files: ['<%= jshint.files =>'],
                tasks: ['jshint', 'karma:development:run','protractor:development','mochaTest:development']
            },
            css: {
                files: ['<%= csslint.files =>'],
                tasks: ['csslint']
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
        concurrent: {
            'sss-development': {
                tasks: ['env:dev', 'nodemon:dev', 'watch:grunt', 'watch:js', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-debug-mode': {
                tasks: ['env:debug', 'nodemon:debug', 'watch:grunt', 'watch:js', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-continuous-integration': {
                tasks: ['env:prod', 'nodemon:dev'],
                options: {
                    logConcurrentOutput: true
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-nodeMon');
    grunt.loadNpmTasks('grunt-protractor-runner');

    grunt.registerTask('sss-development', ['concurrent:sss-development']);
    grunt.registerTask('sss-continuous-integration', ['concurrent:sss-continuous-integration']);
    grunt.registerTask('sss-debug-mode', ['concurrent:sss-debug-mode']);

    grunt.registerTask('backend-tests', ['mochaTest:continuous-integration']);
    grunt.registerTask('frontend-tests', ['karma:continuous-integration']);
    grunt.registerTask('end2end-tests', ['protractor:continuous-integration']);
    grunt.registerTask('run-all-tests-continuous-integration', ['sss-continuous-integration', 'mochaTest:continuous-integration', 'karma:continuous-integration', 'protractor:continuous-integration']);
    grunt.registerTask('run-all-tests-manually', ['sss-development', 'mochaTest:continuous-integration', 'karma:continuous-integration', 'protractor:continuous-integration']);
    grunt.registerTask('lint', ['jshint', 'csslint']);
    grunt.registerTask('build', ['run-all-tests', 'lint', 'concat', 'uglify']);
    grunt.registerTask('default', ['run-all-tests']);
    grunt.registerTask('package', [ 'lint', 'karma:unit', 'concat:dist', 'uglify:dist', 'clean:temp', 'compress:dist' ]);
};