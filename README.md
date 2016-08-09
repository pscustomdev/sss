Setting up SSS on the host
---------------------
1) Checkout code
2) Open Terminal/Command Prompt:
    # npm install
        If on windows, bcrypt will need to be rebuilt by node-gyp, which has some pre-requisites that need to be met:
        https://github.com/nodejs/node-gyp
        On windows Visual Studio 2013 works the best.
    # bower install
3) Set DEBUG=sss in the OS environment
4) Install MongoDB
   * Put mongo bin in the path:
      * C:\Program Files\MongoDB\Server\3.0\bin\
      * /usr/bin/
   * Create .\data\db
   * Open Terminal/Command Prompt:
      # mongod --nojournal --dbpath=data
5) On Windows find in npm module mongodb ..node_moduales\mongodb\node_modules\bson\ext\index.js
   * and change path to js version in catch block
        bson = require('../build/Release/bson');
     to
        bson = require('../browser_build/bson');


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
*  Start Frontend Tests
		karma start
*  Start Backend Tests (won't autorun on cloud9 when files change)
  		jasmine-node-karma node_modules/jasmine-node-karma/lib/jasmine-node-karma/cli.js /home/ubuntu/workspace/tests/backend-mocha-unit-tests --captureExceptions --autotest
*  Start End-To-End Tests
			webdriver-manager start  (Starts the selenium server)
			/usr/local/lib/node_modules/protractor/lib/cli.js protractor.conf.js

-------------
Files
-------------
              
:-:-: auth-conf.js :-:-:
 (NOTE: security values can't be stored in GIT or they will deactivate the token):
============ REPLACE THE CONTENTS OF "auth-conf-local.js" WITH VALUE FROM FOLLOWING URL ============
http://nccd-archive.lab.novell.com/twiki/bin/view/Main/NccdInternal#SsS
============ REPLACE THE CONTENTS OF "auth-conf-local.js" WITH VALUE FROM ABOVE URL ============

:-:-: SERVER SIDE :-:-:
============
/app.js                                     - Node master configuration that configures and starts the Express() web-server
/config.js                                  - Generic configuration values
/gulpfile.js                                - Gulp configuration. Produces a minified javascript file, with all application javascript included
/auth/                                      - ** AUTHENTICATION **
/auth/auth-conf.js                        - Stores credentials from the environment in prod or from the auth-config-local.js in dev
/auth/auth-conf-local.js                  - Stores credentials to be used by Passport Strategies.  Git ignored.  Create this file manually by using the text found in this file
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
/tests/frontend-karma-unit-tests            - Holds all of the Frontend tests used for client side testing (eg. testing AngularJS code)
/tests/backend-mocha-unit-tests             - Holds all of the Backend tests used for server side testing (eg. testing NodeJS code)
/tests/end2end-protractor-tests             - Holds all of the End to End tests used for system testing (eg. testing Browser/GUI)
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
/public/app/                             - ** ANGULAR ROOT **
/public/app/app.js                       - Provides the default Angular route, includes all dependant modules, and adds the $state and $stateparams data to the $scope available to each Controller
/public/app/services/                    - ** ANGULAR SERVICES/FACTORIES **
/public/app/services/client-rest-server-interface.js  - API wrapper that manages calls to the Node-Express REST URLs
/public/app/services/search-service.js   - Search Service/Factory that encapsulates/manages snippet searches
/public/app/controllers/                         - ** ANGULAR VIEWS/CONTROLLERS/STATES **
/public/app/views/search.html         - "/search" view/state html code
/public/app/controllers/search.js           - "/search" view/state configuration and code.  (eg. Angular state, template, controller, view-model and any other javascript specific to this view.  Note: this file must be included in the Handlebar ""/views/index.hbs" file)
/public/app/views/results.html        - "/results" view/state html code
/public/app/controllers/results.js          - "/results" view/state configuration and code.  (eg. Angular state, template, controller, view-model and any other javascript specific to this view.  Note: this file must be included in the Handlebar ""/views/index.hbs" file)
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

5) npm install tingodb --save
6) npm install github-api --save
7) npm install underscore --save
8) npm install bower -g
    bower install angular
    bower install angular-ui-router

IntelliJ Plugins
----------------
  NodeJS
  Karma


Testing
=======
Front End [Angularjs] (Karma)
Back End [Nodejs] (Mocha)
End to End [Browser] (Protractor)

Adding a New View
=================
To add a new view, pattern it after an existing view, such as "overview".
1) Copy the folder structure of an existing view to a new folder.
   e.g.  Copy folder "overview" and rename to "yournewview"
2) Rename the files in the new folder accordingly
3) Add the new module to the main module definition in app.js (like 'app.overview')
     e.g.  angular.module('app', ['ui.router', 'app.$searchService', 'app.search', 'app.results', 'app.overview'])
4) Include the new js file in layout.hbs
     e.g.  <script src="/app/controllers/overview/view.js"></script>
5) Modify the new files accordingly



===== RELEASE 1 =========


===== RELEASE FUTURE ========
ToDo: Line 31 in karma.conf.js is commented because the tests are just too complicated to triage.  We need to simplify the frontend tests to the point where we can understand them 2 days later.
ToDo: Results Page - Fix issue with original/default results per page value isn't displayed (it defaults to 5)
ToDo: Rename a file
ToDo: Tests - Validate End2End tests make sense
ToDo: Tests - Add Frontend tests
ToDo: Tests - Add End2End tests
ToDo: Design - Snippet json object (pojo) to represent snippet results including individual hit data
ToDo: Login - Make hover over "Logged in as NAME", not show mouse pointer.  We should not communicate that this does anything.
ToDo: GitHub Dao - Expand GitHubDao to provide for calls that will retrieve missing data on results page
ToDo: GitHub Dao - Results Page - Write API to get "last updated" (based on latest commit date of whole repo) and add to page
ToDo: GitHub Dao - Results Page - Write API to get "number of views" (repo based) and add to page
ToDo: Mongo Dao - Add result "rating" to mongo
ToDo: Mongo Dao - Add 'sss-id' to mongo.  And figure out the sss-id format and how to create it.
ToDo: Results Page - Change layout so it is as follows:
        Repo Title
          Repo Description [Less/More]
            File Name (first #1)
                100 characters before and after hit #1 [More/Less]
            File Name (first #2)
                100 characters before and after hit #2 [More/Less]
        Repo Title
          Repo Description [Less/More]
            File Name (first #1)
                100 characters before and after hit #1 [More/Less]
