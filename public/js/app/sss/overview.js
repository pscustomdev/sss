(function() {
    'use strict';
    
    angular
        .module('app')
        .controller('OverviewController', OverviewController);
        
    OverviewController.$inject = ['api','$routeParams'];    
        
    function OverviewController(api, $routeParams) {
        var vm = this;
        vm.snippetId = $routeParams.snippetId;
        
        api.getSnippetOverview($routeParams.snippetId)
            .then(function(data) {
                vm.snippetOverview = data;    
            });
    }
}());
