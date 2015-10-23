# sss

How things work:

:-:-: SERVER SIDE :-:-:
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
/views/main/index.hbs                       - Handlebar template for default Angular view.  Adds the Angular App
                                              javascript files to each page. Note: If any new Angular view is added, make
                                              sure to include a reference to it's javascript file here.
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
/public/js/app/services/                    - Utility services used to interact with the backend Node server via the exposed REST Services (eg API Routes)
/public/js/app/services/angular-service.js  - Angular API wrapper that manages calls to the Node REST Services
/public/js/app/services/search-service.js   - Angular Service/Factory used to manage the snippet searches
/public/js/app/sss/                         - Angular views and javascript (eg Controller definitions)
/public/js/app/sss/app.js                   - Provides the default Angular route, includes all dependant modules, and adds
                                              the $state and $stateparams data to the $scope available to each Controller
/public/js/app/sss/search/view.html         - Configures this specific Angular view/layout (html code)
/public/js/app/sss/search/view.js           - Configures/Defines this views Angular state, route, template, controller,
                                              view-model and any other javascript specific to this view.  Note: this file
                                              must be included in the Handlebars' /views/index.hbs file.
/public/js/app/sss/search/*_partial.html    - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/results/view.html        - Configures this specific Angular view/layout (html code)
/public/js/app/sss/results/view.js          - Configures/Defines this views Angular state, route, template, controller,
                                              view-model and any other javascript specific to this view.  Note: this file
                                              must be included in the Handlebars' /views/index.hbs file.
/public/js/app/sss/results/*_partial.html   - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/details/*                - Experimental code.  Not used.
/public/js/app/sss/overview/*               - Experimental code.  Not used.
/public/js/build/                           - Directory with the latest Gulp build of the application
