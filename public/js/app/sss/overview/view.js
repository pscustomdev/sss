(function() {
    'use strict';
    angular.module('app.overview', ['ui.router', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$scope', '$nodeServices', '$stateParams'];

    function StateProvider(stateProvider) {
        stateProvider.state('overview', {
            url: '/snippet-overview/:snippetId',
            views: {
                '': { templateUrl: '/js/app/sss/overview/view.html', controller: 'OverviewController' },
                'overviewlist@overview': {
                    templateUrl: '/js/app/sss/overview/overview_partial.html' }
            }
        });
    }

    function OverviewController($scope, $nodeServices, $stateParams) {
        $scope.snippetId = $stateParams.snippetId;

        $nodeServices.getSnippetOverview($scope.snippetId).then (
            function(files) {
                $scope.snippetOverview = files;
            }
        );
    }
}());