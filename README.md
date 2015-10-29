Setting up SSS on the host
---------------------
1) Checkout code
2) Open Terminal/Command Prompt:
    # npm install
    # bower install
3) Set DEBUG=sss in the OS environment
4) Install MongoDB
   * Put mongo bin in the path:
      * C:\Program Files\MongoDB\Server\3.0\bin\
      * /usr/bin/
   * Create \data\db
   * Open Terminal/Command Prompt:
      # mongod --nojournal --dbpath=data

Starting Application
---------------------
1) Start Mongo:
    * Option 1 -> Open Terminal/Command Prompt:
        # mongod-start
    * Option 2 -> In IntelliJ
        Tools | External Tools | "MongoDB"
2) Execute the IntelliJ Run/Debug Configuration "SSS (Debug)"

Starting tests
---------------------
1) Start mongo  
    * Click on "Tools | External Tools | MongoDB", or
		* ./mongod-start
2) Start sss via nodejs
		node ./bin/www
*  Start karma
		karma start
*  Start mocha (won't autorun on cloud9 when files change)
  		jasmine-node-karma node_modules/jasmine-node-karma/lib/jasmine-node-karma/cli.js /home/ubuntu/workspace/tests/mocha-backend-unit-tests --captureExceptions --autotest
*  Start protractor
			webdriver-manager start  (Starts the selenium server)
			/usr/local/lib/node_modules/protractor/lib/cli.js protractor.conf.js

-------------
Files
-------------
              
auth-conf.js (NOTE: security values can't be stored in GIT or they will deactivate the token)
============ COPY BELOW TEXT, THEN REPLACE WITH ACTUAL VALUES ============ 
module.exports = {
    github: {
        clientID: 'follow url for value: http://nccd-archive.lab.novell.com/twiki/bin/view/Main/NccdInternal#SsS',
        clientSecret: 'follow url for value: http://nccd-archive.lab.novell.com/twiki/bin/view/Main/NccdInternal#SsS',
        callbackURL: 'follow url for value: http://nccd-archive.lab.novell.com/twiki/bin/view/Main/NccdInternal#SsS'
    },
    github_api: {
        username: 'pscustomdev-sss',
        token: 'follow url for value: http://nccd-archive.lab.novell.com/twiki/bin/view/Main/NccdInternal#SsS'
    }
};
============ COPY ABOVE TEXT, THEN REPLACE WITH ACTUAL VALUES ============

:-:-: SERVER SIDE :-:-:
============
/app.js                                     - Node master configuration that configures and starts the Express() web-server
/config.js                                  - Generic configuration values
/gulpfile.js                                - Gulp configuration. Produces a minified javascript file, with all application javascript included
/auth/                                      - ** AUTHENTICATION **
/auth/auth-config.js                        - Stores credentials to be used by Passport Strategies.  Git ignored.  Create this file manually by using the text found in this file
/auth/authentication.js                     - Code for passport authentication strategies, and serialize/deserialize user to local storage
/auth/restrict.js                           - Code that checks if a user is authenticated and causes a redirect to the authentication url, if not
/bin/                                       - ** BINARIES **
/bin/www                                    - Node Express starting javascript file
/db/                                        - ** STORAGE OPERATION DAO FILES
/db/github-dao.js                           - Dao used to expose github apis to the application
/db/mongo-dao.js                            - Dao used to expose mongo apis to the application
/node_modules                               - ** NODE MODULES ** (NPMs/libraries used by the Node Server. Git ignored. Run "install npm" to recreate)
/routes/                                    - ** NODE-EXPRESS ROUTING **
/routes/index.js                            - Routing configuration
/routes/api.js                              - "{webserver:port}/api/*" urls/routes
/routes/main.js                             - "{webserver:port}/*" urls/routes
/tests/                                     - TESTING
/tests/karma.conf.js                        - Configuration of Karma testing framework
/tests/mocha.conf.js                        - Configuration of Mocha testing framework
/tests/protractor.conf.js                   - Configuration of Protractor testing framework
/tests/karma-frontend-unit-tests            - Holds all of the Karma tests used for client side testing (eg. AngularJS code)
/tests/mocha-backend-unit-tests             - Holds all of the Mocha tests used for server side testing (eg. NodeJS code)
/tests/protractor-end2end-tests             - Holds all of the Protractor tests used for system testing (eg. Browser/GUI tests)
/views/                                     - HANDLEBARS/MUSTACHES TEMPLATES
/views/error.hbs                            - Handlebars template - injects error html code
/views/layout.hbs                           - Handlebars template - default html layout to hold other content


:-:-: CLIENT SIDE :-:-:
/public/                                    - ** WEB-APP ROOT **
/public/favicon.ico                         - Favorite icon file displayed on browser tabs
/public/bower/                              - ** BOWER PACKAGES ** (Bower packages/libraries used by the web-app. Git ignored.  Run "install bower" to recreate)
/public/images/                             - Web-app images
/public/fonts/                              - Web-app fonts
/public/css/                                - ** STYLESHEETS **
/public/css/styles.css                      - Master stylesheet. Imports all other stylesheets (eg. bootstrap).
/public/js/                                 - ** JAVASCRIPT / RESOURCES **
/public/js/app/                             - ** ANGULAR ROOT **
/public/js/app/app.js                       - Provides the default Angular route, includes all dependant modules, and adds the $state and $stateparams data to the $scope available to each Controller
/public/js/app/services/                    - ** ANGULAR SERVICES/FACTORIES **
/public/js/app/services/node-services.js  - API wrapper that manages calls to the Node-Express REST URLs
/public/js/app/services/search-service.js   - Search Service/Factory that encapsulates/manages snippet searches
/public/js/app/sss/                         - ** ANGULAR VIEWS/CONTROLLERS/STATES **
/public/js/app/sss/search/view.html         - "/search" view/state html code
/public/js/app/sss/search/view.js           - "/search" view/state configuration and code.  (eg. Angular state, template, controller, view-model and any other javascript specific to this view.  Note: this file must be included in the Handlebar ""/views/index.hbs" file)
/public/js/app/sss/search/*_partial.html    - These files are html snippets that are used to populate this state's view.html
/public/js/app/sss/results/view.html        - "/results" view/state html code
/public/js/app/sss/results/view.js          - "/results" view/state configuration and code.  (eg. Angular state, template, controller, view-model and any other javascript specific to this view.  Note: this file must be included in the Handlebar ""/views/index.hbs" file)
/public/js/app/sss/results/*_partial.html   - These files are html snippets that are used to populate this state's view.html
/public/js/app/sss/details/*                - Experimental code.  Not used.
/public/js/app/sss/overview/*               - Experimental code.  Not used.
/public/js/build/                           - ** BUILD ** (Directory with the latest Gulp build of the application. Git ignored)

-------------
Bibliography
-------------

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


Testing
=======
Front End [Angularjs] (Karma)
Back End [Nodejs] (Mocha)
End to End [Browser] (Protractor)