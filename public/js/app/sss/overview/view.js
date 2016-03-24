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
                displayName: '{{$stateParams.snippetId}}'
            },
            views: {
                '@': { templateUrl: '/js/app/sss/overview/view.html', controller: 'OverviewController'
                },
                'list@search.results.overview': {
                    templateUrl: '/js/app/sss/overview/overview_partial.html'
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
            alert("TODO: Delete snippet (deletSnippet(snippetId) -> overview/view.js)")
        }
     }
}());


