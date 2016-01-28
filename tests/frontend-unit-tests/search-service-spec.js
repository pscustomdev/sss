'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'search-service-spec') ****");

describe('SSS Search Service', function() {
    beforeEach(module('app.$searchService'));

    var $httpBackend, $searchService;

    beforeEach(inject(function ($injector) {
        $searchService = $injector.get('$searchService');
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.whenGET(/\/js\/app\/sss\/search\/.*/).respond(200, '');  // Prevents ui router calls, which are retrieving views, from throwing a false error
    }));

    describe('clearSearch()', function(){
        var mockSearchTerms;

        beforeEach(function() {
            mockSearchTerms = "testing idm";
            $searchService.searchTerms = mockSearchTerms;
            $searchService.clearSearch();
        });

        it('should clear out existing search terms', function() {
            expect($searchService.searchTerms).to.be.empty;
        });
    });

    describe('submitSearch()', function(){
        var testData = readJSON('tests/frontend-unit-tests/test-data.json');
        var mockResponse, mockSnippetSearchTerms;

        beforeEach(function() {
            mockSnippetSearchTerms = testData.submitSearch.request.query_parameters[0];
            mockResponse = testData.submitSearch.response;

            $httpBackend.whenGET(/.*/).respond(mockResponse);
            //$httpBackend.expectGET(/\/api\/snippet-search\?.*/).respond(mockResponse);
            //$httpBackend.expectGET(/\/api\/snippet-search\/\w+.*\/\w+.*/).respond(mockResponse);
        });

        beforeEach(function() {
            $searchService.submitSearch(mockSnippetSearchTerms);
            $httpBackend.flush();
        });

        it('should return a response that inclueds a "highlit_fragment" attribute', function() {

            ($searchService.searchResults.items[0].text_matches[0].matches[0]).should.have.property('highlit_fragment');
        });

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });
    });
});