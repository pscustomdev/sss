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

                $nodeServices.searchCode(searchTerms).then(function (response) {
                    //None found
                    if(!response) {
                        vm.searchResults.inProgress = false;
                        vm.pagination.totalItems = 0;
                        return;
                    }

                    if (!response.items) {
                        response.items = [];
                    }
                     //filter out all the data type and the display Name since we don't want to show those on the UI.
                    _.each(response.items, function(r){
                        var newArray = [];
                         _.each(r['@search.highlights'], function(item, k){
                            if(!k.includes("data.type") && k != 'displayName'){
                                var obj= {};
                                // Change the em to mark because we use bootstrap for styling
                                _.each(item, function(s, k){
                                    s = s.replace(/<em>/g, "<mark>");
                                    s = s.replace(/<\/em>/g, "</mark>");
                                    // replace img tags with a bogus tag that will be ignored by the html trust code
                                    // as we do not want images in results
                                    s = s.replace(/<img/g, "<noimg");
                                    item[k] = s;
                                });
                                obj[k] = item;
                                newArray.push(obj);
                            }
                        });
                        r['@search.highlights'] = newArray;
                    });

                    vm.userSearched = true;
                    vm.searchResults.items = response.items;
                    vm.searchResults.total_count = response.items.length;
                    vm.searchResults.inProgress = false;
                    vm.pagination.totalItems = vm.searchResults.total_count;
                    updateMetaData(vm.searchResults.items);
                });
            }
        };

        vm.trustHtmlSnippet = function (html) {
            return $sce.trustAsHtml(html);
        };

        function updateMetaData(snippets) {
            updateRating(snippets);
            // updateViewsCount(snippets);
            // updateLastUpdated(snippets);
        }

        function updateRating(snippets) {
            //copy the repository name to the snippetId so we can merge the two arrays.
            var ids = _.pluck(snippets, "snippetId");
            $nodeServices.getSnippetsRatingsByArray(ids).then(
                function(result) {
                    if(result){
                        //merge the ratings into the snippets so we can display then all together
                        mergeByProperty(snippets, result.data, "snippetId");
                        vm.searchResults.items = snippets;
                    }
                }
            );
        }

        function updateViewsCount(snippets) {

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
        vm.pagination.viewby = vm.pagination.viewby ? vm.pagination.viewby : '10';
        vm.pagination.totalItems = 0;
        vm.pagination.currentPage = 1;
        vm.pagination.itemsPerPage = vm.pagination.viewby;
        vm.pagination.maxSize = 5; // Number of page buttons to show
        vm.pagination.setPage = function (pageNo) {
            vm.pagination.currentPage = pageNo;
        };
        vm.pagination.setItemsPerPage = function(num) {
            vm.pagination.itemsPerPage = num;
            vm.pagination.currentPage = 1; //reset to first page
        };
        return vm;
    }
}());