(function() {
    'use strict';

    angular.module('app.overview', ['ui.router'])
        .config(['$stateProvider', StateProvider])
        .controller('OverviewController', Controller);

    StateProvider.$inject = ['$stateProvider'];
    Controller.$inject = ['angularService', '$stateParams'];

    function StateProvider(stateProvider) {
        stateProvider.state('overview', {
            url: '/snippet-overview/:snippetId',
            controller: 'OverviewController',
            controllerAs: 'vm',
            views: {
                '': { templateUrl: '/js/app/sss/overview/view.html' }
            }
        });
    }

    function Controller(angularService, stateParams) {
        var vm = this;
        vm.snippetId = stateParams.snippetId;

        angularService.getSnippetOverview(vm.snippetId).then (
            function(data) {
                vm.snippetOverview = data;
            }
        );
    }
}());