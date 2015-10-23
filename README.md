Setting up SSS on the host

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
/auth/                                      -
/auth/auth-config.js                        - Stores credentials to be used by Passport Strategies.  Ignored by Git and populated with text from readme_install.txt and NCCD Twiki
/auth/authentication.js                     - Code for passport authentication strategies and serialize/deserialize user to local storage
/auth/restrict.js                           - Code that causes a redirect to the authentication url, if user is not authenticated
/bin/                                       -
/bin/www                                    - Node Express starting javascript file
/db/                                        - Dao files for storage related operations
/db/github-dao.js                           - Dao used to expose github apis to the application
/db/mongo-dao.js                            - Dao used to expose mongo apis to the application
/node_modules                               - NPMs/libraries used by the Node Server
/routes/                                    - Handlebars routes
/routes/api.js                              - Configures the available routes for the "{webserver:port}/api/*" urls
/routes/index.js                            - Configures the available routes for the default "{webserver:port}/" url
/routes/main.js                             - Configures the available routes for the "{webserver:port}/sss/*" urls
/routes/users.js                            - Configures the available routes for the "{webserver:port}/users/*" urls
/tests/                                     -
/views/                                     - Handlebars templates for JS and resources (eg html)
/views/error.hbs                            - Handlebar template - injects error html code
/views/index.hbs                            - Handlebar template - injects login html code
/views/layout.hbs                           - Handlebar template - default html page to hold other content
/views/main/                                -
/views/main/index.hbs                       - Handlebar template for default Angular view.  Adds the Angular App javascript files to each page. Note: If any new Angular view is added, make sure to include a reference to it's javascript file here.
/views/users/                               -
/views/users/create.hbs                     - Handlebar template for Create User form
/app.js                                     - Node master configuration that configures and starts the Express() web-server
/config.js                                  - Generic configuration values
/gulpfile.js                                - Files to be combined into the production delivery javascript file
/karma.conf.js                              - Configuration of Karma testing framework


:-:-: CLIENT SIDE :-:-:
/public/                                    -
/public/bower/                              - Bower packages/libraries used by the webapp
/public/images/                             - Webapp images
/public/fonts/                              - Webapp fonts
/public/css/                                - Webapp stylesheets
/public/css/styles.css                      - Master stylesheet. Imports all other stylesheets (eg. bootstrap).
/public/js/                                 - Webapp javascript and resources
/public/js/app/                             - Angular code for webapp
/public/js/app/app.js                       - Provides the default Angular route, includes all dependant modules, and adds the $state and $stateparams data to the $scope available to each Controller
/public/js/app/services/                    - Utility services used to interact with the backend Node server via the exposed REST Services (eg API Routes)
/public/js/app/services/angular-service.js  - Angular API wrapper that manages calls to the Node REST Services
/public/js/app/services/search-service.js   - Angular Service/Factory used to manage the snippet searches
/public/js/app/sss/                         - Angular views and javascript (eg Controller definitions)
/public/js/app/sss/search/view.html         - Configures this specific Angular view/layout (html code)
/public/js/app/sss/search/view.js           - Configures/Defines this views Angular state, route, template, controller, view-model and any other javascript specific to this view.  Note: this file must be included in the Handlebars' /views/index.hbs file.
/public/js/app/sss/search/*_partial.html    - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/results/view.html        - Configures this specific Angular view/layout (html code)
/public/js/app/sss/results/view.js          - Configures/Defines this views Angular state, route, template, controller, view-model and any other javascript specific to this view.  Note: this file must be included in the Handlebars' /views/index.hbs file.
/public/js/app/sss/results/*_partial.html   - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/details/*                - Experimental code.  Not used.
/public/js/app/sss/overview/*               - Experimental code.  Not used.
/public/js/build/                           - Directory with the latest Gulp build of the application

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