module.exports = function(config) {
  'use strict';

  config.set({
    basePath: '../', // base path that will be used to resolve all patterns (eg. files, exclude)

    frameworks: ['mocha', 'chai'],

    files: [
       //Dependent Libs
      'public/bower/underscore/underscore.js', // Included Library
      'public/bower/angular/angular.js',
      'public/bower/angular-ui-router/release/angular-ui-router.js',
      'public/bower/angular-bootstrap/ui-bootstrap-tpls.js',
      'public/bower/angular-sanitize/angular-sanitize.js',
      'public/bower/angular-animate/angular-animate.js',
      'public/bower/jquery/dist/jquery.js',
      'public/bower/bootstrap/js/modal.js',
      'public/bower/bootstrap/js/tab.js',
      'public/bower/angular-xeditable/dist/js/xeditable.min.js',
      'public/bower/angular-file-upload/dist/angular-file-upload.js',
      'public/bower/ace-builds/src-min-noconflict/ace.js',
      'public/bower/angular-ui-ace/ui-ace.min.js',

      // Libs Needed for testing and they need to be after the dependent libs or you'll get an error
      'node_modules/chai/chai.js',
      'node_modules/sinon-chai/lib/sinon-chai.js',
      'node_modules/karma-read-json/karma-read-json.js',
      'public/bower/angular-mocks/angular-mocks.js',
      'public/bower/angular-sanitize/angular-sanitize.js',

      'public/app/**/*.js',  //include all app files
      //'tests/frontend-unit-tests/**/*spec.js',            //ToDo: disabled until we can simplify these to the point of understanding
        'tests/frontend-unit-tests/node-services-spec.js',
        'tests/frontend-unit-tests/mySnippets-spec.js',
        'tests/frontend-unit-tests/details-spec.js',
      { pattern:  'tests/frontend-unit-tests/*.json',
        watched:  true,
        served:   true,
        included: false } // Data for Tests
    ],

    exclude: [
      '**/*.html'
    ],

    reporters: ['progress'], // possible values: 'dots', 'progress'
    //reporters: ['coverage'],

    port: 9876,
    colors: true,
    autoWatch: true, // enable / disable watching file and executing tests whenever any file changes
    singleRun: false,

    logLevel: config.LOG_INFO, // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    browsers: ['Firefox']
  });
};
