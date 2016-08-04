(function() {
    'use strict';

    angular.module('app.$searchService', ['app.$nodeServices'])
        .factory('$searchService', SearchService);

    //$nodeServices is defined in the client-rest-server-interface.js and is used to let the
    // client to talk to the server's REST API (routes/api.js) which is programmed in NODE

    SearchService.$inject = ['$nodeServices', '$sce', '$log'];

    function SearchService($nodeServices, $sce, $log) {
        var snippetResults = {
            repoId: {

            }
        };

        var vm = this;
        vm.searchTerms = ""; // The search term (for decoration)
        vm.searchResults = {}; // The object that will contain search results
        vm.searchResults.total_count = 0;
        vm.searchResults.inProgress = false;
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
            vm.searchTerms = "";
            vm.searchResults = {};
            vm.searchResults.total_count = 0;
            vm.searchResults.inProgress = false;

            vm.userSearched = false;
        };

        vm.submitSearch = function (searchTerms) { // Search function
            vm.searchResults = {};
            vm.searchResults.total_count = 0;
            vm.searchResults.inProgress = true;
            if (searchTerms && searchTerms !== "") {
                vm.searchTerms = searchTerms;

                $nodeServices.searchCode(searchTerms).then(
                    function (response) {
                        vm.userSearched = true;
                        vm.searchResults = response;
                        if (!response.total_count) {
                            vm.searchResults.total_count = 0;
                        }
                        vm.searchResults.inProgress = false;

                        vm.pagination.totalItems = vm.searchResults.total_count;
                        updateFragment(vm.searchResults.items);
                        updateRating(vm.searchResults.items);
                    }
                );
            }
        };

        vm.trustHtmlSnippet = function (html) {
            return $sce.trustAsHtml(html);
        };

        vm.stripImageTag = function (content) {
            return $('<x>').html(content).find("img").remove().end().html();
        };

        // Inject html to add highlighting of returned results
        function updateFragment(hits) {
            if (!hits) { return; }
            hits.forEach(function(hit) {
                hit.text_matches[0].matches.reverse().forEach(function(match) {
                    match['highlit_fragment'] = hit.text_matches[0].fragment;
                    match['highlit_fragment'] = match['highlit_fragment'].substr(0, match.indices[1]) + "</mark><code>" + match['highlit_fragment'].substr(match.indices[1]) + "</code>";
                    match['highlit_fragment'] = "<code>" + match['highlit_fragment'].substr(0, match.indices[0]) + "</code><mark>" + match['highlit_fragment'].substr(match.indices[0]);
                });
            });
        }

        function updateRating(snippets) {

        }

        function updateViewsCount(snippets) {

        }

        function updatePostedOn(snippets) {
            // Testing to see the best way to retrieve the earliest commit (thus providing the "Repo Creation Date")
            $nodeServices.getCommits("sss-storage", "2").then(function (response) {
                vm["sss-storage"] = [];
                vm["sss-storage"]["2"] = [];
                vm["sss-storage"]["2"].commits = response;
            });
        }

        function updatePostedBy(snippets) {
            // this will need to be tracked/retrieved in mongo
        }

        function updateLastUpdated(snippets) {
            snippets.forEach(function(snippet){
                snippet.text_matches.fragment;
                $nodeServices.getCommits(snippet.repository.owner.login, snippet.repository.name).then(function (response) {
                    snippet[""] = [];
                    vm["sss-storage"]["2"] = [];
                    vm["sss-storage"]["2"].commits = response;
                });
            });
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