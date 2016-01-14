(function() {
    'use strict';

    angular.module('app.$searchService', ['app.$nodeServices'])
        .factory('$searchService', SearchService);

    SearchService.$inject = ['$nodeServices', '$log'];

    function SearchService($nodeServices, $log) {
        var snippetResults = {
            repoId: {

            }
        };

        var vm = this;
        vm.searchResults = []; // The array that will contain search results
        vm.searchTerms = []; // The search term (for decoration)
        vm.userSearched = false; // Control if user searched recently
        vm.typeOfSearch = "web"; // Control the state of the search

        vm.switchSearchType = function (searchType) { // Switch the search type/state
            vm.typeOfSearch = searchType;

            if (vm.searchTerms !== "") { // Check if user has a search term, if true then rerun search
                $log.debug("rerunning search!");
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

                $nodeServices.searchCode(searchTerms).then(
                    function (response) {
                        vm.userSearched = true;
                        vm.searchResults = response;
                        vm.pagination.totalItems = vm.searchResults.total_count;
                        updatePostedOn(vm.searchResults.items); // assuming passing by ref
                        updateFragment(vm.searchResults.items); // assuming passing by ref
                    }
                );
            }
        };

        function updateFragment(snippets) {
           snippets;
        }

        function updateRating() {

        }

        function updateViewsCount() {

        }

        function updatePostedOn() {
            // Testing to see the best way to retrieve the earliest commit (thus providing the "Repo Creation Date")
            $nodeServices.getCommits("sss-storage", "2").then(function (response) {
                vm["sss-storage"] = [];
                vm["sss-storage"]["2"] = [];
                vm["sss-storage"]["2"].commits = response;
            });
        }

        function updatePostedBy() {

        }

        function updateLastUpdated() {

        }

        // Pagination for SearchResults
        vm.pagination = [];
        vm.pagination.viewby = 5;
        vm.pagination.totalItems = 0;
        vm.pagination.currentPage = 1;
        vm.pagination.itemsPerPage = vm.pagination.viewby;
        vm.pagination.maxSize = 5; //Number of pager buttons to show
        vm.pagination.setPage = function (pageNo) {
            vm.pagination.currentPage = pageNo;
        };
        vm.pagination.pageChanged = function() {
            $log.debug('Page changed to: ' + vm.pagination.currentPage + ' out of ' + vm.pagination.totalItems + ' pages.');
        };
        vm.pagination.setItemsPerPage = function(num) {
            vm.pagination.itemsPerPage = num;
            vm.pagination.currentPage = 1; //reset to first page
        };


        return vm;
    }
}());