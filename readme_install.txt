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
    npm install angular
    npm install angular-route
    
   
IntelliJ Plugins
  NodeJS
  Karma
   
   
   
   