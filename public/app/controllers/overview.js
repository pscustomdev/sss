(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'xeditable', 'angularFileUpload'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$rootScope', '$nodeServices', '$stateParams', '$state', 'editableOptions', 'FileUploader'];

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

    function OverviewController($scope, $rootScope, $nodeServices, $stateParams, $state, editableOptions, FileUploader) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileContent = "";
        $scope.confirmDelete = false;
        var count = 0;
        editableOptions.theme = 'bs3';

        function getOverview(snippetId) {
            // retry getting the snippet 5 times
            // this is necessary because sometimes the api will return a null overview when a snippet
            // was just created and is not yet available to the api
            if (count < 5) {
                $nodeServices.getSnippetOverview(snippetId).then(
                    function (overview) {
                        if (!overview) {
                            count++;
                            console.log("Error getting snippet.  Retry #" + count + "...");
                            getOverview(snippetId);
                        } else {
                            $scope.snippetOverview = overview;
                            $scope.snippetOverview.isOwner = (overview.owner == $rootScope.currentUser.username || $rootScope.currentUser.username == 'pscustomdev-sss');
                        }
                    }
                );
            } else {
                $scope.snippetOverview = {};
                $scope.snippetOverview.isOwner = false;
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

        // update the display name and description
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
                    )
                    $scope.confirmDelete = false;
                }
            });
        };

        // focus the input field when the new file dialog is shown
        $("#fileNameModal").on('shown.bs.modal', function() {
            $("#newFileName").focus();
        })

        // file uploader
        var uploader = $scope.uploader = new FileUploader({
            url: '/api/snippet-detail/' + $scope.snippetId
        });

        // refresh the overview page when upload is complete
        $scope.uploadComplete = function() {
            $state.reload();
        };

    }
}());