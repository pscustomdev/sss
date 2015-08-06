(function() {
    'use strict';
    
    angular
        .module('app')
        .controller('SSSController', SSSController);
        
    SSSController.$inject = ['api'];    
        
    function SSSController(api) {
        var vm = this;
        vm.firstName = "FIRST NAME GOES HERE";
        
        api.getSnippets()
            .then(function(data) {
                vm.snippets = data;    
            });
        
        
    }
}());
