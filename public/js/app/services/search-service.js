(function() {
    'use strict';

    angular.module('app.searchService', ['app.angularService'])
        .factory('searchService', SearchService);

    SearchService.$inject = ['angularService'];

    function SearchService(angularService) {
        var vm = {};
        vm.searchResults = []; // The array that will contain search results
        vm.searchTerms = []; // The search term (for decoration)
        vm.userSearched = false; // Control if user searched recently
        vm.typeOfSearch = "web"; // Control the state of the search

        vm.switchSearchType = function (searchType) { // Switch the search type/state
            vm.typeOfSearch = searchType;

            if (vm.searchTerms !== "") { // Check if user has a search term, if true then rerun search
                console.log("rerunning search!");
                vm.searchResults = [];
                vm.submitSearch(vm.searchTerms);
            }
        };

        vm.clearSearch = function () { // Clear the search
            vm.searchTerms = [];
            vm.searchResults = [];
            vm.userSearched = false;
        };

        vm.submitSearch = function (searchTerms) { // Search function
            if (searchTerms && searchTerms !== "") {
                vm.searchTerms = searchTerms.split(" ");

                angularService.searchCode(searchTerms).then(function (response) {
                    vm.userSearched = true;
                    vm.searchResults = response;
                });
            }
        };

        return vm;
    }
}());