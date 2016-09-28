(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'app.$searchService', 'xeditable', 'angularFileUpload', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$rootScope', '$nodeServices', '$stateParams', '$state', '$searchService', 'editableOptions', 'FileUploader'];

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

    function OverviewController($scope, $rootScope, $nodeServices, $stateParams, $state, $searchService, editableOptions, FileUploader) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.snippetOverview = {};
        $scope.snippetOverview.isOwner = false;
        $scope.fileContent = "";
        $scope.readme = "";
        $scope.origReadme = "";
        $scope.confirmDelete = false;
        $scope.editReadme = false;

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
                        $scope.formattedReadme = formatReadme(overview.readme);
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
                }
            )
        };

        $scope.addFile = function(fileName) {
            var content = "";
            $nodeServices.addFile($scope.snippetId, fileName, content).then (
                function() {
                    $nodeServices.runFileIndexer();
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
        $scope.uploader = new FileUploader({
            url: '/api/snippet-detail/' + $scope.snippetId
        });

        // refresh the overview page when upload is complete
        $scope.uploadComplete = function() {
            $nodeServices.runFileIndexer();
            $state.reload();
        };

        // format the marked down readme to html for preview
        var formatReadme = function(content) {
            // replace <img src="image.jpg"> with a full path to the image on azure
            var imgUrl = $scope.snippetOverview.imageUrlPrefix + "/" +$scope.snippetId + "/";
            content = content.replace(/<img src=\"/g,"<img src=\"" + imgUrl);

            return marked(content || '');
        }
    }
}());