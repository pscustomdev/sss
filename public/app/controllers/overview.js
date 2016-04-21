(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$nodeServices', '$stateParams'];

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

    function OverviewController($scope, $nodeServices, $stateParams) {
        $scope.snippetId = $stateParams.snippetId;

        $nodeServices.getSnippetOverview($scope.snippetId).then (
            function(overview) {

                $scope.snippetOverview = overview;
            }
        );

        $scope.deleteSnippet = function(snippetId) {
            alert("TODO: Delete snippet (overview.js -> deleteSnippet())")
        }
    }
}());