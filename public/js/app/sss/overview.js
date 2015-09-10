(function() {
    'use strict';
    
    angular
        .module('app')
        .controller('OverviewController', OverviewController);
        
    OverviewController.$inject = ['angularService','$routeParams'];
        
    function OverviewController(angularService, $routeParams) {
        var vm = this;
        vm.snippetId = $routeParams.snippetId;

        angularService.getSnippetOverview($routeParams.snippetId)
            .then(function(data) {
                vm.snippetOverview = data;    
            });
    }
}());
