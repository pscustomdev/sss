module.exports = function(config) {
  'use strict';

  config.set({
    basePath: '../', // base path that will be used to resolve all patterns (eg. files, exclude)

    frameworks: ['mocha', 'chai'],

    files: [
      'node_modules/chai/chai.js', // Included Library
      'node_modules/sinon-chai/lib/sinon-chai.js', // Included Library
      'public/bower/underscore/underscore.js', // Included Library
      'public/bower/angular/angular.js', // Included Library
      'public/bower/angular-ui-router/release/angular-ui-router.js', // Included Library
      'public/bower/angular-bootstrap/ui-bootstrap-tpls.js', // Included Library
      'public/bower/angular-animate/angular-animate.js', // Included Library
      'public/bower/angular-mocks/angular-mocks.js', // Included Library
      'public/bower/angular-sanitize/angular-sanitize.js', // Included Library
      'public/bower/jquery/dist/jquery.js', // Included Library

      'public/js/app/services/util.js', // Source Files
      'public/js/app/services/node-services.js', // Source Files
      'public/js/app/services/search-service.js', // Source Files
      'public/js/app/sss/search/view.js', // Source Files
      'public/js/app/sss/results/view.js', // Source Files
      'public/js/app/sss/details/view.js', // Source Files
      'public/js/app/sss/overview/view.js', // Source Files
      'public/js/app/app.js', // Source Files
      'tests/frontend-unit-tests/**/*spec.js' // Tests Files
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
    browsers: ['PhantomJS']
  });
};
