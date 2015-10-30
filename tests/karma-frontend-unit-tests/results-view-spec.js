'use strict';

console.log("(KARMA Front-End Testing: 'results-view-spec')");
describe('Unit: SSS Views', function() {
    describe('Results-View', function() {
        var httpBackend, searchService;

        beforeEach(module('app'));

        beforeEach(inject(function ($injector) {
            searchService = $injector.get('$searchService');
            httpBackend = $injector.get('$httpBackend');
            httpBackend.whenGET(/\/js\/app\/sss\/search\/.*/).respond(200, '');  // Prevents ui router calls to retrieve views from throwing a false error
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        describe('ResultsController', function(){
            var createController, vm;

            beforeEach(inject(function ($controller) {
                createController = function() {
                    return $controller('ResultsController');
                };
                vm = createController();
                httpBackend.flush();
            }));

            it('should be defined', function() {
                expect(vm).toBeDefined();
            });
        });

        describe('SearchService', function(){
            var mockSearchTerms = "java sample";

            it('should be defined', function() {
                expect(searchService).toBeDefined();
                httpBackend.flush();
            });

            describe('clearSearch()', function(){
                it('should clear out existing search terms', function() {
                    searchService.searchTerms = mockSearchTerms;
                    searchService.clearSearch();
                    httpBackend.flush();

                    expect(searchService.searchTerms).toEqual("");
                });
            });

            describe('submitSearch()', function(){
                var mockPayload = ["snippetId1","snippetId2"];

                it('should receive the same filename payload as was passed in via mock', function() {
                    httpBackend.expectGET(/\/api\/snippet-search\?.*/).respond(mockPayload);
                    searchService.submitSearch(mockSearchTerms);
                    httpBackend.flush();

                    expect(searchService.searchResults).toEqual(mockPayload);
                });
            });
        });
    });
});