(function() {
    'use strict';
    angular.module('app.details', ['ui.router', 'ui.router.breadcrumbs', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices', 'ui.ace'])
        .config(['$stateProvider', StateProvider])
        .controller('DetailsController', DetailsController);

    StateProvider.$inject = ['$stateProvider'];
    DetailsController.$inject = ['$scope', '$nodeServices', '$stateParams', '$state'];

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
            }
        });
    }

    function DetailsController($scope, $nodeServices, $stateParams, $state) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileName = $stateParams.fileName;
        $scope.content = "";

        $nodeServices.getFile($scope.snippetId, $scope.fileName).then (
            function(data) {
                // if the data starts with http, assume the file contains binary data
                // so it is a URL (see db/github-dao.js)
                if (data.toLowerCase().startsWith("http")) {
                    $scope.contentUrl = data;
                    // otherwise it is raw data
                } else {
                    $scope.content = data;
                }
            }
        );

        $scope.aceLoaded = function(_editor){
            var _session = _editor.getSession();
            var _renderer = _editor.renderer;

            _session.setUndoManager(new ace.UndoManager());
        };

        $scope.saveFile = function() {
            $nodeServices.updateFile($scope.snippetId, $scope.fileName, $scope.content).then (
                function() {
                    $state.go('search.results.overview', {});
                }
            )
        }

        $scope.cancelEdit = function() {
            $state.go('search.results.overview', {});
        }

    }
}());