(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$rootScope', '$nodeServices', '$stateParams', '$state'];

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

    function OverviewController($scope, $rootScope, $nodeServices, $stateParams, $state) {
        $scope.snippetId = $stateParams.snippetId;

        $nodeServices.getSnippetOverview($scope.snippetId).then (
            function(overview) {
                $scope.snippetOverview = overview;
                $scope.snippetOverview.isOwner = overview.owner == $rootScope.currentUser.username;
            }
        );

        $scope.deleteSnippet = function(snippetId) {
            $nodeServices.deleteSnippet(snippetId).then (
                function() {
                    // redirect to the search page
                    $state.go('search', {});
                }
            )
        }
    }
}());