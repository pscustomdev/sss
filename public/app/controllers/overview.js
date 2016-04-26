(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'xeditable'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$rootScope', '$nodeServices', '$stateParams', '$state', 'editableOptions'];

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

    function OverviewController($scope, $rootScope, $nodeServices, $stateParams, $state, editableOptions) {
        $scope.snippetId = $stateParams.snippetId;
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
                            $scope.snippetOverview.isOwner = (overview.owner == $rootScope.currentUser.username);
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

        $scope.updateSnippet = function() {
            $nodeServices.updateSnippet($scope.snippetOverview).then (
                function() {
                    // TODO what should use see after update?

                }
            )
        };
    }
}());