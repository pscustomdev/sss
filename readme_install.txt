Setting up SSS on the host

1) Checkout code
2) npm install
3) Set DEBUG=sss in the OS environment
4) Install MongoDB
   * Put mongo bin in to the path:  C:\Program Files\MongoDB\Server\3.0\bin
   * Create c:\data\db
   * Run: mongod --nojournal
   * Run: mongo
      - use sss  (this will create the sss database)
      
5) Install Karma:
   https://karma-runner.github.io/0.12/intro/installation.html
   npm install -g karma
   npm install -g karma-cli
   npm install karma-phantomjs-launcher --save-dev
   bower install angular-mocks   (after installing bower)
   In karma.conf.js - 
     -Include any files where the module is loaded and what the modules are dependant on, and include all tests
      Will run test when any of the files in the conf file are modified.     
7) Install Protractor
   npm install -g protractor
   webdriver-manager update
   webdriver-manager start
8) Create progractor.conf.js manually based on Kent's sample
9) Install jasmine-node-karma
   npm install -g jasmine-node-karma
   Run: jasmine-karma-node <test location> --autotest  NOTE: autotest runs test automatically
   
10) npm install mongoskin --save
11) npm install github-api --save
12) npm install underscore --save
13) npm install bower -g
    bower install angular
    bower install angular-route
14) 
   
IntelliJ Plugins
  NodeJS
  Karma

   
Starting Everything
---------------------
1) Execute the Run Configuration "SSS"

Starting tests
---------------------
1) Start mongo  
		./mongod-start 
2) Start sss via nodejs
		node ./bin/www
*  Start karma
		karma start
*  Start jasmine-node-js (won't autorun on cloud9 when files change)
  		jasmine-node-karma node_modules/jasmine-node-karma/lib/jasmine-node-karma/cli.js /home/ubuntu/workspace/tests/backend-unit-tests --captureExceptions --autotest
   
   