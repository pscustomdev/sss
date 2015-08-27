(function() {
    'use strict';

    angular
      .module('app')
      .controller('SSSController', ['$scope', 'SearchService', 'api', 
        function($scope, SearchService, api) {
          var vm = this;
          vm.firstName = "FIRST NAME GOES HERE";
    
          // Create a reference to the SearchService and add it to the 
          // $scope so it will be available on the page
          $scope.searchService = SearchService;
        }
      ])
      .controller('SearchController', ['$scope', 'SearchService', '$http', '$location', 
        function($scope, SearchService, $http, $location) {
          // Your search input
          $scope.searchTerms = "";
        }
      ])
      .factory('SearchService', ["$location", "$http", 'api',
        function($location, $http, api) {
          var SearchService;
          SearchService = {};
          
          // The array that will contain search results
          SearchService.arrSearchResults = [];
          
          // The search term (for decoration)
          SearchService.searchTerm = "";
          
          // Control if user searched recently
          SearchService.userSearched = false;
          
          // Control the state of the search
          SearchService.typeOfSearch = "web";
          
          // Switch the search type/state
          SearchService.switchSearchType = function(aSearchType) {
            SearchService.typeOfSearch = aSearchType;
            
            // Check if user has a search term, if true then rerun search
            if (SearchService.searchTerm !== "") {
              console.log("rerunning search!");
              SearchService.arrSearchResults = [];
              SearchService.submitSearch(SearchService.searchTerm);
            }
          };
          
          // Clear the search
          SearchService.clearSearch = function() {
            SearchService.searchTerm = "";
            SearchService.arrSearchResults = [];
            SearchService.userSearched = false;
          };
          
          // Search function
          SearchService.submitSearch = function(aSearchTerm) {
            // Make sure aSearchTerm has content (always good to double check)
            if(aSearchTerm !== "") {
              // Alter URL to show new request
              $location.search('q', aSearchTerm);
              SearchService.searchTerm = aSearchTerm; 
              
              api.getSnippets()
                .then(function(data) {
                  SearchService.userSearched = true;
                  SearchService.arrSearchResults = data;    
                });
            }
          }
          
          return SearchService;
        }
      ]);
}());