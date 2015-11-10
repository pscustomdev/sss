module.exports = function(grunt) {
    grunt.initConfig({
        env: {
            dev: {
                NODE_ENV: 'development',
                DEBUG: 'SSS:*'
            },
            prod: {
                NODE_ENV: 'production'
            }
        },
        nodemon: {
            dev: {
                script: 'bin/www',
                options: {
                    ext: 'js,html,hbs',
                    watch: ['*.js', '*.json', 'auth/**/*.js', 'bin/www', 'db/**/*.js', 'routes/**/*.js', 'views/**/*.hbs']
                }
            },
            debug: {
                script: 'bin/www',
                options: {
                    nodeArgs: ['--debug'],
                    ext: 'js,html,hbs',
                    watch: ['*.js', '*.json', 'auth/**/*.js', 'bin/www', 'db/**/*.js', 'routes/**/*.js', 'views/**/*.hbs']
                }
            }
        },
        mochaTest: {
            src: 'tests/backend-unit-tests/**/*.js',
            options: {
                reporter: 'spec'
            }
        },
        karma: {
            unit: {
                configFile: 'tests/karma.conf.js'
            }
        },
        protractor: {
            e2e: {
                options: {
                    configFile: 'tests/protractor.conf.js'
                }
            }
        },
        csslint: {
            all: {
                src: 'public/css/**/*.css'
            }
        },
        jshint: {
            all: {
                src: ['gruntfile.js', '*.js', 'bin/www', 'auth/**/*.js', 'db/**/*.js', 'routes/**/*.js']
            },
            min: {
                src: ['gruntfile.js', 'public/js/app/app.js', 'public/js/app/**/*.js']
            }
        },
        concat: {
            'public/js/build/sss.js': ['public/js/app/app.js', 'public/js/app/**/*.js']
        },
        uglify: {
            'public/js/build/sss.min.js': ['public/js/build/sss.js']
        },
        watch: {
            min: {
                files: ['<%= jshint.files =>'],
                tasks: ['jshint:min', 'concat', 'uglify']
            },
            js: {
                files: ['*.js', 'bin/www', 'auth/**/*.js', 'db/**/*.js', 'routes/**/*.js', 'public/js/**/*.js', 'public/bower/**/*.js'],
                tasks: ['jshint:all']
            },
            css: {
                files: 'public/css/**/*.css',
                tasks: ['csslint:all']
            }
        },
        concurrent: {
            sss: {
                tasks: ['nodemon:dev', 'watch:js', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-debug': {
                tasks: ['nodemon:debug', 'watch:js', 'watch:css'],
                options: {
                    logConcurrentOutput: true
                }
            },
            'sss-debug-node': {
                tasks: ['nodemon:debug', 'watch:js', 'watch:css', 'node-inspector:debug'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        'node-inspector': {
            debug: {}
        }
    });

    grunt.loadNpmTasks('grunt-env');
    grunt.loadNpmTasks('grunt-nodeMon');
    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-protractor-runner');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-csslint');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-node-inspector');

    grunt.registerTask('default', ['sss-debug']);
    grunt.registerTask('run-tests-in-dev-environment', ['env:dev', 'sss-debug', 'backend-tests', 'frontend-tests', 'end2end-tests']);
    grunt.registerTask('run-tests-in-prod-environment', ['env:prod', 'sss', 'backend-tests', 'frontend-tests', 'end2end-tests']);
    grunt.registerTask('lint', ['jshint:all', 'csslint:all']);
    grunt.registerTask('sss', ['env:prod', 'lint', 'concurrent:sss']);
    grunt.registerTask('sss-debug', ['env:dev', 'lint', 'concurrent:sss-debug']);
    grunt.registerTask('sss-debug-node', ['env:dev', 'lint', 'concurrent:sss-debug']);
    grunt.registerTask('backend-tests', ['mochaTest']);
    grunt.registerTask('frontend-tests', ['karma:unit']);
    grunt.registerTask('end2end-tests', ['protractor:e2e']);
};