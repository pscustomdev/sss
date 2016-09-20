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

        $nodeServices.getSnippetRatingByUser({snippetId: $scope.snippetId, user:$rootScope.currentUser.username}).then(
            function(userRating) {
                if(userRating){
                    $scope.userRating = userRating.rating;
                }
            }
        );

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
            // retry getting the snippet 5 times
            // this is necessary because sometimes the api will return a null overview when a snippet
            // was just created and is not yet available to the api
            if (count < 5) {
                count++;
                $nodeServices.getSnippetOverview(snippetId).then(
                    function (overview) {
                        if (!overview) {
                            setTimeout(function() {
                                console.log("Error getting snippet.  Retry #" + count + "...");
                                $scope.snippetOverview.description = (count < 4)?"":"Snippet content not found. Please refresh the page to try again.";
                                $scope.snippetOverview.displayName = (count < 4)?"":"Not Found";
                                getOverview(snippetId);
                            },1500);
                        } else {
                            $scope.snippetOverview = overview;
                            $scope.readme = overview.readme;
                            $scope.origReadme = overview.readme;
                            $scope.formattedReadme = formatReadme(overview.readme);
                        }
                    }
                );
            }
        }
        getOverview($scope.snippetId);

        $scope.deleteSnippet = function(snippetId) {
            $nodeServices.deleteSnippet(snippetId).then (
                function() {
                    // redirect to the search page
                    $state.go('search', {});
                }
            )
        };


        // update the display name, readme and description
        $scope.updateSnippet = function() {
            $scope.snippetOverview.owner = $rootScope.currentUser.username;
            $nodeServices.updateSnippet($scope.snippetOverview).then (
                function() {}
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
                    $nodeServices.deleteFile($scope.snippetId, fileName).then (
                        function() {
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