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
            },
            params: {
                isOwner: null
            }
        });
    }

    function DetailsController($scope, $nodeServices, $stateParams, $state) {
        $scope.snippetId = $stateParams.snippetId;
        $scope.fileName = $stateParams.fileName;
        $scope.isOwner = $stateParams.isOwner;
        $scope.isMarkdown = false;
        $scope.content = "";
        $scope.formattedReadme = "";

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

            // autodetect file type by extension
            var fileComps = ($scope.fileName ? $scope.fileName.toLowerCase().split(".") : ['txt']);
            var mode = fileComps[fileComps.length - 1];
            switch (mode) {
                case 'xsl': mode = 'xml'; break;
                case 'md': mode = 'markdown'; $scope.isMarkdown = true; break;
            }
            _session.setMode('ace/mode/' + mode);
            _session.setUndoManager(new ace.UndoManager());
            _editor.setReadOnly(!$scope.isOwner);

            // height adjusted dynamically in util.js
            $(window).resize();
        };

        $scope.saveFile = function() {
            $nodeServices.updateFile($scope.snippetId, $scope.fileName, $scope.content).then (
                function() {
                    $state.go('search.results.overview', {});
                }
            )
        };

        $scope.cancelEdit = function() {
            $state.go('search.results.overview', {});
        };

        // format the marked down readme to html for preview
        $scope.formatReadme = function() {
            $nodeServices.formatReadme({content: $scope.content}).then(
                function(data) {
                    $scope.formattedReadme = data.data;
                }
            );
        }

    }
}());