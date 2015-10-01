# sss

How things work:

/auth/                                      -
/auth/passport-config.js                    -
/auth/restrict.js                           -
/bin/                                       -
/bin/www                                    - Node Express "executable"
/db/                                        -
/db/github-dao.js                           - Dao used to expose github apis to the application
/db/mongo-dao.js                            - Dao used to expose mongo apis to the application
/public/                                    -
/public/bower/                              - All the Bower installs (tool for installing Express() modules)
/public/images/                             - All the webapp's available images
/public/fonts/                              - All the webapp's available fonts
/public/stylesheets/                        - All the webapp's available stylesheets
/public/stylesheets/styles.css              - Master stylesheet for entire webapp. Imports all other stylesheets (eg. bootstrap).
/public/js/                                 - Angular javascript and resources
/public/js/app/                             - Angular SSS application
/public/js/app/services/                    -
/public/js/app/services/angular-service.js  - Angular API wrapper around the web-application's exposed web-services
/public/js/app/sss/                         - Angular views and angular javascript (eg Controller definitions)
/public/js/app/sss/app.js                   - Provides the default Angular route, includes all dependant modules, and adds
                                              the $state and $stateparams data to the $scope available to each Controller
/public/js/app/sss/search/view.html           - Configures this specific Angular view/layout (html code)
/public/js/app/sss/search/view.js             - Configures/Defines this views Angular state, route, template, controller,
                                              view-model and any other javascript specific to this view.  Note: this file
                                              must be included in the Handlebars' /view/main/index.hbs file.
/public/js/app/sss/main/*_partial.html      - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/results/view.html         - Configures this specific Angular view/layout (html code)
/public/js/app/sss/results/view.js           - Configures/Defines this views Angular state, route, template, controller,
                                              view-model and any other javascript specific to this view.  Note: this file
                                              must be included in the Handlebars' /view/main/index.hbs file.
/public/js/app/sss/results/*_partial.html    - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/details/view.html        - Configures this specific Angular view/layout (html code)
/public/js/app/sss/details/view.js          - Configures/Defines this views Angular state, route, template, controller,
                                              view-model and any other javascript specific to this view.  Note: this file
                                              must be included in the Handlebars' /view/main/index.hbs file.
/public/js/app/sss/details/*_partial.html   - These files are html snippets that are used to populate this view/layout.
/public/js/app/sss/overview/view.html       - Configures this specific Angular view/layout (html code)
/public/js/app/sss/overview/view.js         - Configures/Defines this views Angular state, route, template, controller,
                                              view-model and any other javascript specific to this view.  Note: this file
                                              must be included in the Handlebars' /view/main/index.hbs file.
/public/js/app/sss/overview/*_partial.html  - These files are html snippets that are used to populate this view/layout.
/public/js/build/                           - Directory with the latest Gulp build of the application
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
/auth-conf.js                               - GitHub - authentication configuration
/config.js                                  -
/gulpfile.js                                -
/karma.conf.js                              -
