Setting up SSS on the host

1) Checkout code
2) npm install
3) bower install
3) Set DEBUG=sss in the OS environment
4) Install MongoDB
   * Put mongo bin in to the path:  C:\Program Files\MongoDB\Server\3.0\bin
   * Create c:\data\db
   * Run: mongod --nojournal
   * Run: mongo
      - use sss  (this will create the sss database)

To manually install node_modules or bower_packages
--------------------------------------------------
1) Install Karma:
   https://karma-runner.github.io/0.12/intro/installation.html
   npm install -g karma
   npm install -g karma-cli
   npm install karma-phantomjs-launcher --save-dev
   bower install angular-mocks   (after installing bower)
   In karma.conf.js - 
     -Include any files where the module is loaded and what the modules are dependant on, and include all tests
      Will run test when any of the files in the conf file are modified.     
2) Install Protractor
   npm install -g protractor
   webdriver-manager update
   webdriver-manager start
3) Create protractor.conf.js manually based on Kent's sample
4) Install jasmine-node-karma
   npm install -g jasmine-node-karma
   Run: jasmine-karma-node <test location> --autotest  NOTE: autotest runs test automatically
   
5) npm install mongoskin --save
6) npm install github-api --save
7) npm install underscore --save
8) npm install bower -g
    bower install angular
    bower install angular-ui-router
9) npm install -g gulp --save-dev
    npm install gulp-concat --save-dev
    npm install gulp-uglify --save-dev
    Create a file called gulpfile.js at the root with a gulp program
    Run:  gulp   (this will concat your source and minify it
   
IntelliJ Plugins
----------------
  NodeJS
  Karma

Starting Application
---------------------
1) Execute the Run Configuration "SSS"

Starting tests
---------------------
1) Start mongo  
    * Click on "Tools | External Tools | MongoDB", or
		* ./mongod-start
2) Start sss via nodejs
		node ./bin/www
*  Start karma
		karma start
*  Start jasmine-node-js (won't autorun on cloud9 when files change)
  		jasmine-node-karma node_modules/jasmine-node-karma/lib/jasmine-node-karma/cli.js /home/ubuntu/workspace/tests/mocha-backend-unit-tests --captureExceptions --autotest
*  Start protractor
			webdriver-manager start  (Starts the selenium server)
			/usr/local/lib/node_modules/protractor/lib/cli.js protractor.conf.js

-------------
Files
-------------

auth-conf.js
============
var config = {};
config.github_username = 'sss-storage';
config.github_urlbase = 'https://api.github.com/orgs/sss-storage/';
config.github_urlrepos = config.github_urlbase + 'repos';
config.github_token = 'Look in TWIKI to find the token for pscustomdev-sss';

module.exports = config;


-------------
Bibliography
-------------

Testing
=======
Front End [Angular] (Karma)
Back End [Nodejs] (Jasmine-Node-Karma)
End to End [Browser] (Protractor)

