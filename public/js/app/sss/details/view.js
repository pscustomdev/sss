(function() {
    'use strict';
    angular.module('app.details', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', DetailsController);

    StateProvider.$inject = ['$stateProvider'];
    DetailsController.$inject = ['$scope', '$nodeServices', '$stateParams'];

    function StateProvider($stateProvider) {
        $stateProvider.state('search.results.overview.details', {
            url: '/snippet-detail/:snippetId/:fileName',
            data: {
                displayName: '{{$stateParams.fileName}}'
            },
            views: {
                '@': {
                    templateUrl: '/js/app/sss/details/view.html', controller: 'DetailsController'
                },
                'contents@search.results.overview.details': {
                    templateUrl: '/js/app/sss/details/details_partial.html'
                }
            }
        });
    }

    function DetailsController($scope, $nodeServices, $stateParams) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileName = $stateParams.fileName;

        $nodeServices.getSnippetDetail($scope.snippetId, $scope.fileName).then (
            function(data) {
                $scope.content = data;
            }
        );
    }
}());