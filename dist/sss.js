(function() {
    'use strict';

    angular.module('app.create', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('CreateController', CreateController);

    StateProvider.$inject = ['$stateProvider'];
    CreateController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices', 'growl'];

    function StateProvider($stateProvider) {
        $stateProvider.state('search.create', {
            url: '/create',
            data: {
                displayName: 'Create'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/create.html', controller: 'CreateController'
                }
            }
        });
    }

    function CreateController($scope, $rootScope, $state, $nodeServices, growl) {
        $scope.formData = {};
        $scope.rawView = true;
        var indexMessage = "It may take up to 5 minutes for your new snippet to be searchable.";

        //if they aren't logged in then send them to the login page.
        $nodeServices.getCurrentUser().then(
            function (user) {
                if(!user) {
                    $state.go('login');
                }
            }
        );

        $scope.createSnippet = function() {
            var uuid = generateUUID();
            var snippet = {
                _id: uuid,
                displayName: $scope.formData.displayName,
                description: $scope.formData.description,
                owner: $rootScope.currentUser.username,
                readme: $scope.formData.readme
            };

            $nodeServices.addSnippet(snippet).then(
                function () {
                    $nodeServices.runDBIndexer();
                    growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                    $state.go('search.results.overview', { snippetId: uuid});
                }
            );
        };

        $scope.cancelCreate = function() {
            $state.go('search', {});
        };

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            _session.setMode('ace/mode/markdown');
            _session.setUndoManager(new ace.UndoManager());

            // height adjusted dynamically in util.js
            $(window).resize();
        };

        $scope.formatReadmeForPreview = function() {
            $scope.formData.formattedReadme = marked($scope.formData.readme || '');
        };
    }
}());

(function() {
    'use strict';
    angular.module('app.details', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', DetailsController);

    StateProvider.$inject = ['$stateProvider'];
    DetailsController.$inject = ['$scope', '$nodeServices', '$stateParams', '$state', 'growl'];

    function StateProvider($stateProvider) {
        $stateProvider.state('search.results.overview.details', {
            url: '/snippet-detail/:snippetId/:fileName',
            data: {
                displayName: '{{$stateParams.fileName}}'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/details.html', controller: 'DetailsController'
                }
            },
            params: {
                isOwner: null
            }
        });
    }

    function DetailsController($scope, $nodeServices, $stateParams, $state, growl) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileName = $stateParams.fileName;
        $scope.isOwner = $stateParams.isOwner;
        $scope.showEditor = false;
        $scope.confirmCancel = false;
        $scope.content = "";
        $scope.origContent = "";
        var indexMessage = "It may take up to 5 minutes for your changes to be searchable.";

        var overviewPage = "search.results.overview";

        $nodeServices.getFile($scope.snippetId, $scope.fileName).then (
            function(data) {
                // if the data starts with http, assume the file contains binary data
                // so it is a URL (see db/github-dao.js)
                if (data.toLowerCase().startsWith("http")) {
                    $scope.contentUrl = data;
                    // otherwise it is raw data
                } else {
                    $scope.content = data;
                    $scope.origContent = data;
                    $scope.showEditor = true;
                }
            }
        );

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            // autodetect file type by extension, if none default to text
            var fileComps = ($scope.fileName ? $scope.fileName.toLowerCase().split(".") : ['text']);
            var mode = fileComps[fileComps.length - 1];
            // if no extension, default to text
            if (fileComps.length == 1) {
                mode = "text";
            }
            switch (mode) {
                case 'xsl': mode = 'xml'; break;
                case 'js': mode = 'javascript'; break;
            }
            _session.setMode('ace/mode/' + mode);
            _session.setUndoManager(new ace.UndoManager());
            _editor.setReadOnly(!$scope.isOwner);

            // height adjusted dynamically in util.js
            $(window).resize();
        };

        $scope.saveFile = function() {
            // if not modified, no need to save
            if ($scope.content == $scope.origContent) {
                $state.go(overviewPage, {});
                return;
            }

            $nodeServices.updateFile($scope.snippetId, $scope.fileName, $scope.content).then (
                function() {
                    $nodeServices.runFileIndexer();
                    growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                    $state.go(overviewPage, {});
                }
            )
        };

        $scope.cancelEdit = function() {
            // if data has been modified, verify cancel
            if ($scope.content != $scope.origContent) {
                // display modal to confim cancel
                $scope.confirmCancel = false;
                $("#cancelEditModal").modal();
                $("#cancelEditModal").on('hidden.bs.modal', function() {
                    if ($scope.confirmCancel) {
                        $state.go(overviewPage, {});
                        return;
                    }
                });



            } else {
                $state.go(overviewPage, {});
            }
        };

    }
}());
(function() {
    'use strict';
    angular.module('app.login', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize','app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('LoginController', LoginController);

    StateProvider.$inject = ['$stateProvider'];
    LoginController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices'];

    function StateProvider(stateProvider) {
        stateProvider.state('login', {
            url: '/login',
            data: {
                displayName: 'Login'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/login.html', controller: 'LoginController'}
            }
        })
    }


    function LoginController($scope, $rootScope, $state, $nodeServices) {
    }
}());
(function() {
    'use strict';
    angular.module('app.mySnippets', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize','app.$nodeServices','app.$searchService'])
        .config(['$stateProvider', StateProvider])
        .controller('MySnippetsController', MySnippetsController);

    StateProvider.$inject = ['$stateProvider'];
    MySnippetsController.$inject = ['$scope', '$rootScope', '$state', '$nodeServices', '$searchService'];

    function StateProvider(stateProvider) {
        stateProvider.state('search.mySnippets', {
            url: '/mySnippets',
            data: {
                displayName: 'My Snippets'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/results.html', controller: 'MySnippetsController'}
            }
        })
    }

    function MySnippetsController($scope, $rootScope, $state, $nodeServices, $searchService) {
        //if they aren't logged in then send them to the login page.
        $nodeServices.getCurrentUser().then(
            function (user) {
                if(!user) {
                    $state.go('login');
                }
            }
        );

        $rootScope.$watch('currentUser', function(user) {
            if (user) {
                $searchService.submitSearch($rootScope.currentUser.username);
            }
        });
    }
}());
(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'app.$searchService', 'xeditable', 'angularFileUpload', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$rootScope', '$nodeServices', '$stateParams', '$state', '$searchService', 'editableOptions', 'FileUploader', 'growl'];

    function StateProvider(stateProvider) {
        stateProvider.state('search.results.overview', {
            url: '/snippet-overview/:snippetId',
            data: {
                displayName: 'Overview'
            },
            views: {
                '@': { templateUrl: '/app/views/overview.html', controller: 'OverviewController'
                }
            }
        });
    }

    function OverviewController($scope, $rootScope, $nodeServices, $stateParams, $state, $searchService, editableOptions, FileUploader, growl) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.snippetOverview = {};
        $scope.snippetOverview.isOwner = false;
        $scope.fileContent = "";
        $scope.readme = "";
        $scope.origReadme = "";
        $scope.confirmDelete = false;
        $scope.editReadme = false;
        var indexMessage = "It may take up to 5 minutes for your changes to be searchable.";
        var fileLimitExceededMessage = "An uploaded file must not exceed 10M in size.";

        $scope.avgRatingOptions = {
            ratedFill: '#337ab7',
            readOnly: true,
            halfStar: true,
            starWidth: "20px"
        };

        $scope.ratingOptions = {
            //ratedFill: '#337ab7',
            readOnly: false,
            halfStar: true,
            starWidth: "20px"
        };
        var disqusUrl = 'http://www.softwaresnippetsearch.com/#!/search/results/snippet-overview/' + $scope.snippetId;
        $scope.disqusConfig = {
            disqus_shortname: 'softwaresnippetsearch',
            disqus_identifier: $scope.snippetId,
            disqus_url: disqusUrl
        };

        // watch for $rootScope.currentUser to be populated before getting the snippet rating for the user
        $rootScope.$watch('currentUser', function(user) {
            if (user) {
                $nodeServices.getSnippetRatingByUser({
                    snippetId: $scope.snippetId,
                    user: user.username
                }).then(
                    function (userRating) {
                        if (userRating) {
                            $scope.userRating = userRating.rating;
                        }
                    }
                );
            }
        });

        $nodeServices.getSnippetRating($scope.snippetId).then(
            function(result) {
                if(result){
                    $scope.avgRating = result;
                }
            }
        );

        $scope.setRating = function(event, data) {
            if(data.rating && $scope.userRating != data.rating) {
                $scope.userRating = data.rating;
                var snippetRating = {snippetId: $scope.snippetId, rater:$rootScope.currentUser.username, rating:data.rating};
                $nodeServices.addUpdateSnippetRating(snippetRating);
            }
        };

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            _session.setMode('ace/mode/markdown');
            _session.setUndoManager(new ace.UndoManager());

            // height adjusted dynamically in util.js
            $(window).resize();

            //This has to happen otherwise ACE won't show the content since we were at an ng-hide when it was first rendered
            $scope.redrawAce = function() {
                _editor.resize();
                _editor.renderer.updateFull()
            };
        };

        editableOptions.theme = 'bs3';
        var count = 0;

        function getOverview(snippetId) {
            $nodeServices.getCurrentUser().then( function(result){
                $scope.isLoggedIn = result ? true : false;
            });
            $nodeServices.getSnippetOverview(snippetId).then(
                function (overview) {
                    if (!overview) {
                        console.log("Error getting snippet.");
                        $scope.snippetOverview.description = "Snippet is in index but is not in database";
                        $scope.snippetOverview.displayName = "Snippet Not Found";
                    } else {
                        $scope.snippetOverview = overview;
                        $scope.readme = overview.readme;
                        $scope.origReadme = overview.readme;
                        if(overview.readme){
                            $scope.formattedReadme = formatReadme(overview.readme);
                        }
                    }
                }
            );
        }
        getOverview($scope.snippetId);

        // mark a snippet for deletion
        $scope.deleteSnippet = function() {
            $nodeServices.markSnippet($scope.snippetId, $scope.snippetOverview.files).then (
                    function() {
                    $nodeServices.runDBIndexer();
                    $nodeServices.runFileIndexer();
                    growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                    // redirect to the search page
                    $state.go('search', {});
                }
            )
        };

        // update the display name, readme and description
        $scope.updateSnippet = function() {
            $scope.snippetOverview.owner = $rootScope.currentUser.username;
            $nodeServices.updateSnippet($scope.snippetOverview).then (
                function() {
                    $nodeServices.runDBIndexer();
                    growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                }
            )
        };

        $scope.addFile = function(fileName) {
            var content = "";
            $nodeServices.addFile($scope.snippetId, fileName, content).then (
                function() {
                    // refresh the overview page
                    $state.reload();
                }
            )
        };

        $scope.deleteFile = function(fileName) {
            // display modal to confim delete
            $scope.confirmDelete = false;
            $("#fileDeleteModal").modal();
            $("#fileDeleteModal").on('hidden.bs.modal', function() {
                if ($scope.confirmDelete) {
                    $nodeServices.markFile($scope.snippetId, fileName).then (
                        function() {
                            $nodeServices.runFileIndexer();
                            growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
                            // refresh the overview page
                            $state.reload();
                        }
                    );
                    $scope.confirmDelete = false;
                }
            });
        };

        $scope.formatReadmeForPreview = function() {
            $scope.formattedReadme = formatReadme($scope.readme);
        };

        $scope.saveReadme = function() {
            // if not modified, no need to save
            if ($scope.readme == $scope.origReadme) {
                // $state.go(overviewPage, {});
                $scope.editReadme = false;
            } else {
                $scope.origReadme = $scope.readme;
                $scope.snippetOverview.readme = $scope.readme;
                $scope.updateSnippet();
                $scope.formattedReadme = formatReadme($scope.readme);
                $scope.editReadme = false;
            }
        };

        $scope.cancelEdit = function() {
            // if data has been modified, verify cancel
            if ($scope.readme != $scope.origReadme) {
                // display modal to confim cancel
                $scope.confirmCancel = false;
                $("#cancelEditModal").modal();
                $("#cancelEditModal").on('hidden.bs.modal', function() {
                    if ($scope.confirmCancel) {
                        $scope.editReadme = false;
                        $scope.formattedReadme = formatReadme($scope.origReadme);
                        $scope.readme = $scope.origReadme;
                        $scope.$apply();
                    }
                });
            } else {
                $scope.editReadme = false;
            }
        };

        // focus the input field when the new file dialog is shown
        $("#fileNameModal").on('shown.bs.modal', function() {
            $("#newFileName").focus();
        });

        // file uploader
        var uploader = $scope.uploader = new FileUploader({
            url: '/api/snippet-detail/' + $scope.snippetId
        });

        uploader.onAfterAddingFile = function(item) {
            if(item.file.size > 10000000) {
                growl.info(fileLimitExceededMessage, {ttl: 5000, disableCountDown: true});
                uploader.removeFromQueue(item);
            }
        };

        // refresh the overview page when upload is complete
        $scope.uploadComplete = function() {
            $nodeServices.runFileIndexer();
            growl.info(indexMessage,{ttl: 5000, disableCountDown: true});
            $state.reload();
        };

        // format the marked down readme to html for preview
        var formatReadme = function(content) {
            if (!content) { content = "" };
            // replace <img src="image.jpg"> with a full path to the image on azure
            var imgUrl = $scope.snippetOverview.imageUrlPrefix + "/" +$scope.snippetId + "/";
            content = content.replace(/src=\"/g,"src=\"" + imgUrl);
            // if img tag doesn't have a width element, set width to 100%
            var startIdx = 0;
            while (true) {
                var idx = content.indexOf("<img", startIdx);
                if (idx == -1) break;
                // handle both > or /> tag ends
                var endIdx = content.indexOf(">", idx);
                var endIdx2 = content.indexOf("/>", idx);
                if (endIdx == -1) break;
                if (endIdx2 > -1 && endIdx2 < endIdx ) endIdx = endIdx2;
                var imgElement = content.substring(idx, endIdx);
                if (!imgElement.includes("width")) {
                    imgElement += " width='100%' ";
                    content = content.substring(0, idx - 1) + imgElement + content.substring(endIdx);
                }
                startIdx = endIdx;
            }
            return marked(content || '');
        }
    }
}());
(function() {
    'use strict';
    angular.module('app.results', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'ngSanitize'])
        .config(['$stateProvider', StateProvider])
        .controller('SearchBarFilteringController', SearchBarFilteringController)
        .controller('ResultsController', ResultsController)
        .controller('SearchCriteriaController', SearchCriteriaController)
        .directive('showMoreDirective', showMoreDirective);

    StateProvider.$inject = ['$stateProvider'];
    SearchBarFilteringController.$inject = ['$scope'];
    ResultsController.$inject = ['$scope'];
    SearchCriteriaController.$inject = ['$scope'];

    function StateProvider(stateProvider) {
        stateProvider.state('search.results', {
            url: '/results',
            data: {
                displayName: 'Results'
            },
            views: {
                '@': {
                    templateUrl: '/app/views/results.html', controller: 'ResultsController'}
            }
        })
    }

    function SearchBarFilteringController($scope) {
        // ToDo: Get counts from a periodic check against the repository
        $scope.results_filter = {
            templateUrl: 'results_filter.html',
            categories: [
                { displayValue: 'Active Directory', active: true, count: 1 },
                { displayValue: 'IDM', active: true, count: 4 },
                { displayValue: 'Policy', active: true, count: 2 }
            ],
            tags: [
                { displayValue: 'Javascript', active: true, count: 1 },
                { displayValue: 'Formula', active: true, count: 4 }
            ],
            ratings: [
                { displayValue: '* * * * *', active: true, count: 4 },
                { displayValue: '* * * *', active: true, count: 2 },
                { displayValue: '* * *', active: true, count: 0 },
                { displayValue: '* *', active: true, count: 0 },
                { displayValue: '*', active: true, count: 0 }
            ]
        };
    }

    function ResultsController($scope) {
        // Rating
        $scope.avgRatingOptions = {
            ratedFill: '#337ab7',
            readOnly: true,
            halfStar: true,
            starWidth: "20px"
        };
    }

    function SearchCriteriaController($scope) {
        // ToDo: Get customTags from search results
        $scope.search_criteria = [
            { displayValue: 'javascript', active: true, count: 0 },
            { displayValue: 'idm', active: true, count: 35},
            { displayValue: 'searchterm3', active: true, count: 7 }
        ];
    }

    function showMoreDirective() {
        return function() {
            $('.show-more').showMore({
                adjustHeight: 40,
                moreText: "+ More",
                lessText: "- Less"
            });
        };
    }
}());
(function() {
    'use strict';

    angular.module('app.search', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap'])
        .config(['$stateProvider', StateProvider])
        .controller('SearchController', SearchController);

    StateProvider.$inject = ['$stateProvider'];
    SearchController.$inject = ['$scope', '$rootScope', '$nodeServices'];

    function StateProvider(stateProvider) {
        stateProvider.state('search', {
            url: '/search',
            data: {
                displayName: 'Search'
            },
            views: {
                '': {
                    templateUrl: '/app/views/search.html', controller: 'SearchController' }
            }
        })
    }

    function SearchController($scope, $rootScope, $nodeServices) {
        $nodeServices.getUserRankings().then(
            function (result) {
                if (result) {
                    $scope.userRankings = result.data;
                }
            }
        );
        $nodeServices.getSnippetRankings().then(
            function (result) {
                if (result) {
                    $scope.snippetRankings = result.data;
                }
            }
        )

        $nodeServices.getSnippetsByLatest().then(
            function (result) {
                if (result) {
                    $scope.latestSnippets = result;
                }
            }
        )
    }
}());
(function() {
    'use strict';

    angular.module('app.sss', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap'])
        .config(['$stateProvider', StateProvider]);
    StateProvider.$inject = ['$stateProvider'];

    function StateProvider(stateProvider) {
        stateProvider.state('asdasd', {
            url: '/sss',
            abstract: true,
            template: '/app/views/sss.html'
        }).state('search', {
            url: '',
            data: {
                displayName: 'Search'
            },
            templateUrl: '/app/views/search.html'
        });
    }
}());


(function() {
    'use strict';
    
    angular.module('app.$nodeServices', [])
        .factory('$nodeServices', apiFactory);

    apiFactory.$inject = ['$http', '$log'];

    function apiFactory($http, $log) {
        return {
            getCurrentUser: getCurrentUser,
            getUserRankings: getUserRankings,
            getSnippetRankings: getSnippetRankings,
            getSnippets: getSnippets,
            getSnippetsByLatest: getSnippetsByLatest,
            getSnippetOverview: getSnippetOverview,
            getSnippetRating: getSnippetRating,
            getSnippetsRatingsByArray: getSnippetsRatingsByArray,
            getSnippetRatingByUser: getSnippetRatingByUser,
            searchCode: searchCode,
            getCommits: getCommits,
            addSnippet: addSnippet,
            addUpdateSnippetRating: addUpdateSnippetRating,
            updateSnippet: updateSnippet,
            markSnippet: markSnippet,
            deleteSnippet: deleteSnippet,
            getFile: getFile,
            addFile: addFile,
            updateFile: updateFile,
            markFile: markFile,
            deleteFile: deleteFile,
            runDBIndexer: runDBIndexer,
            runFileIndexer: runFileIndexer
        };

        //Make sure to add the function into the return statement.

        function getCurrentUser() {
            return $http.get("/api/authenticated-user")
                .then(function (response) {
                        return response.data;
                    },
                    function (reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function (err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function getUserRankings() {
            return $http.get("/api/users/rating-rank")
                .then(function (response) {
                        return response;
                    },
                    function (reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function (err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function getSnippetRankings() {
            return $http.get("/api/snippets/rating-rank")
                .then(function (response) {
                        return response;
                    },
                    function (reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function (err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // list all snippets
        function getSnippets() {
            return $http.get('/api/snippets')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function getSnippetsByLatest() {
            return $http.get('/api/snippets/latest')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }
        
        // get information about a snippet
        function getSnippet() {
            return $http.get('/api/snippet')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function addSnippet(snippet) {
            return $http.post('/api/snippet', snippet)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function updateSnippet(snippet) {
            return $http.put('/api/snippet/' + snippet._id, snippet)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // mark snippet for deletion
        function markSnippet(snippetId, files) {
            // mark all files in the snippet as deleted
            _.each(files, function(file) {
                markFile(snippetId, file.name);
            });
            return $http.put('/api/snippet/' + snippetId, {_id:snippetId, deleted:"true"})
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function deleteSnippet(snippetId) {
            return $http.delete('/api/snippet/' + snippetId)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }


        // cleanup (delete) all marked snippets and files
        function cleanupMarkedSnippetsFiles() {
            return $http.delete('/api/cleanup-marked-snippets-files')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }


        // get overview information about a snippet
        function getSnippetOverview(snippetId) {
            return $http.get('/api/snippet-overview/' + snippetId)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // get a file from a snippet
        function getFile(snippetId, fileName) {
            return $http.get('/api/snippet-detail/' + snippetId + "/" + fileName)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // add a file to a snippet
        function addFile(snippetId, fileName, content) {
            var data = {};
            data.content = content;
            return $http.post('/api/snippet-detail/' + snippetId + "/" + fileName, data)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // update a file in a snippet
        function updateFile(snippetId, fileName, content) {
            var data = {};
            data.content = content;
            return $http.put('/api/snippet-detail/' + snippetId + "/" + fileName, data)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // mark a file for deletion in a snippet
        function markFile(snippetId, fileName) {
            var data = {};
            data.content = "deleted=true";
            return $http.put('/api/snippet-detail/' + snippetId + "/" + fileName, data)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // delete a file from a snippet
        function deleteFile(snippetId, fileName) {
            return $http.delete('/api/snippet-detail/' + snippetId + "/" + fileName)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function searchCode(searchTerms) {
            return $http.get('/api/snippet-search?q=' + encodeURIComponent(searchTerms))
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });    
        }

        function getCommits(repoOwner, repoName) {
            return $http.get('/api/snippet-search/' + repoOwner + "/" + repoName)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        //get rating for one snippet
        function getSnippetRating(snippetId) {
            return $http.get('/api/rating/' + snippetId)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        //Returns an array of snippets with their ratings
        function getSnippetsRatingsByArray(snippets) {
            //snippets should be a list split by ,
            return $http.get('/api/ratings/' + snippets)
                .then(function(responses) {
                        return responses;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        function getSnippetRatingByUser(userRating) {
            return $http.get('/api/rating/' + userRating.snippetId + '/' + userRating.user)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // add a rating for a snippet
        function addUpdateSnippetRating(rating) {
            return $http.post('/api/rating/' + rating.snippetId, rating)
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // run azure db indexer
        function runDBIndexer() {
            return $http.get('/api/indexer/db')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }

        // run azure file indexer
        function runFileIndexer() {
            return $http.get('/api/indexer/file')
                .then(function(response) {
                        return response.data;
                    },
                    function(reason) {
                        $log.debug(JSON.stringify(reason));
                    })
                .catch(function(err) {
                    $log.debug(JSON.stringify(err));
                });
        }
    }
}());
(function() {
    'use strict';

    angular.module('app.$searchService', ['app.$nodeServices'])
        .factory('$searchService', SearchService);

    //$nodeServices is defined in the client-rest-server-interface.js and is used to let the
    // client to talk to the server's REST API (routes/api.js) which is programmed in NODE

    SearchService.$inject = ['$nodeServices', '$sce', '$log'];

    function SearchService($nodeServices, $sce, $log) {
        var snippetResults = {
            repoId: {

            }
        };

        var vm = this;
        vm.searchTerms = ""; // The search term (for decoration)
        vm.searchResults = {}; // The object that will contain search results
        vm.searchResults.total_count = 0;
        vm.searchResults.inProgress = false;
        vm.userSearched = false; // Control if user searched recently
        vm.typeOfSearch = "web"; // Control the state of the search

        vm.switchSearchType = function (searchType) { // Switch the search type/state
            vm.typeOfSearch = searchType;

            if (vm.searchTerms !== "") { // Check if user has a search term, if true then rerun search
                $log.debug("rerunning search!");
                vm.searchResults = [];
                vm.submitSearch(vm.searchTerms);
            }
        };

        vm.clearSearch = function () { // Clear the search
            vm.searchTerms = "";
            vm.searchResults = {};
            vm.searchResults.total_count = 0;
            vm.searchResults.inProgress = false;

            vm.userSearched = false;
        };

        vm.submitSearch = function (searchTerms) { // Search function
            vm.searchResults = {};
            vm.searchResults.total_count = 0;
            vm.searchResults.inProgress = true;
            if (searchTerms && searchTerms !== "") {
                vm.searchTerms = searchTerms;

                $nodeServices.searchCode(searchTerms).then(function (response) {
                    //None found
                    if(!response) {
                        vm.searchResults.inProgress = false;
                        vm.pagination.totalItems = 0;
                        return;
                    }

                    if (!response.items) {
                        response.items = [];
                    }
                     //filter out all the data type and the display Name since we don't want to show those on the UI.
                    _.each(response.items, function(r){
                        var newArray = [];
                         _.each(r['@search.highlights'], function(item, k){
                            if(!k.includes("data.type") && k != 'displayName'){
                                var obj= {};
                                // Change the em to mark because we use bootstrap for styling
                                _.each(item, function(s, k){
                                    s= encodeHtml(s);
                                    s = s.replace(/&lt;em&gt;/g, "<mark>");
                                    s = s.replace(/&lt;\/em&gt;/g, "</mark>");
                                    // replace img tags with a bogus tag that will be ignored by the html trust code
                                    // as we do not want images in results
                                    s = s.replace(/&lt;img/g, "<noimg");
                                    item[k] = s;
                                });
                                obj[k] = item;
                                newArray.push(obj);
                            }
                        });
                        r['@search.highlights'] = newArray;
                    });

                    vm.userSearched = true;
                    vm.searchResults.items = response.items;
                    vm.searchResults.total_count = response.items.length;
                    vm.searchResults.inProgress = false;
                    vm.pagination.totalItems = vm.searchResults.total_count;
                    updateMetaData(vm.searchResults.items);
                });
            }
        };

        vm.trustHtmlSnippet = function (html) {
            return $sce.trustAsHtml(html);
        };

        function updateMetaData(snippets) {
            updateRating(snippets);
            // updateViewsCount(snippets);
            // updateLastUpdated(snippets);
        }

        function updateRating(snippets) {
            //copy the repository name to the snippetId so we can merge the two arrays.
            var ids = _.pluck(snippets, "snippetId");
            $nodeServices.getSnippetsRatingsByArray(ids).then(
                function(result) {
                    if(result){
                        //merge the ratings into the snippets so we can display then all together
                        mergeByProperty(snippets, result.data, "snippetId");
                        vm.searchResults.items = snippets;
                    }
                }
            );
        }

        function updateViewsCount(snippets) {

        }

        function updateLastUpdated(snippets) {
            snippets.forEach(function(snippet){
                snippet.text_matches.fragment;
                $nodeServices.getCommits(snippet.repository.owner.login, snippet.repository.name).then(function (response) {
                    snippet[""] = [];
                    vm["sss-storage"]["2"] = [];
                    vm["sss-storage"]["2"].commits = response;
                });
            });
        }

        // Pagination for SearchResults
        vm.pagination = [];
        vm.pagination.viewby = vm.pagination.viewby ? vm.pagination.viewby : '10';
        vm.pagination.totalItems = 0;
        vm.pagination.currentPage = 1;
        vm.pagination.itemsPerPage = vm.pagination.viewby;
        vm.pagination.maxSize = 5; // Number of page buttons to show
        vm.pagination.setPage = function (pageNo) {
            vm.pagination.currentPage = pageNo;
        };
        vm.pagination.setItemsPerPage = function(num) {
            vm.pagination.itemsPerPage = num;
            vm.pagination.currentPage = 1; //reset to first page
        };
        return vm;
    }
}());
(function() {
    'use strict';

    // Declare app level module which depends on views, and components
    var app = angular.module('app', ['ui.router', 'ui.router.breadcrumbs', 'rateYo', 'app.$nodeServices','app.$searchService', 'app.search', 'app.results', 'app.overview', 'app.details', 'app.create','app.mySnippets','app.login', 'angularUtils.directives.dirDisqus', 'angular-growl','anguFixedHeaderTable'])
       .config(['$urlRouterProvider', URLRouteProvider])
        .directive('ngEnter', ngEnter)
        .run(main);

    app.config(function($locationProvider) {
        $locationProvider.hashPrefix('!');
    });

    URLRouteProvider.$inject = ['$urlRouterProvider'];
    main.$inject = ['$rootScope', '$searchService', '$state', '$stateParams', '$log', '$nodeServices'];
    
    function URLRouteProvider(urlRouterProvider) {
        urlRouterProvider.otherwise('/search');    // Sets default view to render
    }

    function ngEnter() {
        return function(scope, element, attrs) {
            element.bind("keydown keypress", function(event) {
                if(event.which === 13) {
                    scope.$apply(function(){
                        scope.$eval(attrs.ngEnter, {'event': event});
                    });

                    event.preventDefault();
                }
            });
        };
    }
    
    function main($rootScope, $searchService, $state, $stateParams, $log, $nodeServices) {
        $rootScope.title = 'Software Snippet Search';
        $rootScope.$log = $log;
        $rootScope.$state = $state;
        $rootScope.$stateParams = $stateParams;
        $rootScope.$searchService = $searchService;

        $nodeServices.getCurrentUser().then (function(result){
            $rootScope.currentUser = result;
        });
    }

}());
