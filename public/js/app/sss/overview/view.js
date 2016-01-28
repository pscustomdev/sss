(function() {
    'use strict';

    angular.module('app.overview', ['ui.router', 'ngAnimate', 'ui.bootstrap', 'app.$nodeServices'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', OverviewController);

    StateProvider.$inject = ['$stateProvider'];
    OverviewController.$inject = ['$nodeServices', '$stateParams'];

    function StateProvider($stateProvider) {
        $stateProvider.state('overview', {
            url: '/snippet-overview/:snippetId',
            views: {
                '': { templateUrl: '/js/app/sss/overview/view.html', controller: 'OverviewController' }
            }
        });
    }

    function OverviewController($nodeServices, $stateParams) {
        var vm = this;
        vm.snippetId = $stateParams.snippetId;

        $nodeServices.getSnippetOverview(vm.snippetId).then (
            function(files) {
                vm.snippetOverview = files;
            }
        );
    }
}());