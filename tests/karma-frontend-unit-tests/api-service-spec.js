'use strict';

console.log("(KARMA Front-End Testing: 'api-service-spec')");
describe('Unit: SSS APIServices', function() {
    var rootScope, httpBackend, angularService;

    beforeEach(module('app'));

    beforeEach(inject(function ($injector) {
        rootScope = $injector.get('$rootScope').$new();
        angularService = $injector.get('angularService');
        httpBackend = $injector.get('$httpBackend');
        httpBackend.whenGET(/\/js\/app\/sss\/search\/.*/).respond(200, '');  // Prevents ui router calls, which are retrieving views, from throwing a false error
    }));

    afterEach(function() {
        httpBackend.flush();
        httpBackend.verifyNoOutstandingExpectation();
        httpBackend.verifyNoOutstandingRequest();
    });

    describe('getSnippets()', function() {
        it('should return data as passed in via mock', function() {
            var mockPayload = ["mockdata1", "mockdata2"];
            httpBackend.expectGET(/\/api\/snippets.*/).respond(mockPayload);

            angularService.getSnippets().then(function(payload){
                expect(payload).toEqual(mockPayload);
            });
        });
    });

    describe('getSnippetOverview()', function(){
        it('should return data as passed in via mock', function() {
            var mockSnippetId = 'mockSnippetId';
            var mockPayload = [{"name": "README.md"}];
            httpBackend.expectGET(/\/api\/snippet\-overview\/\w+.*/).respond(mockPayload);

            angularService.getSnippetOverview(mockSnippetId).then(function(payload){
                expect(payload).toEqual(mockPayload);
            });
        });
    });

    describe('getSnippetDetail()', function(){
        it('should return data as passed in via mock', function() {
            var mockSnippetId = 'mockSnippetId';
            var mockSnippetFilename = 'mockFilename';
            var mockPayload = "mock file data";
            httpBackend.expectGET(/\/api\/snippet\-detail\/\w+.*\/\w+.*/).respond(mockPayload);

            angularService.getSnippetDetail(mockSnippetId, mockSnippetFilename).then(function(payload){
                expect(payload).toEqual(mockPayload);
            });
        });
    });

    describe('searchCode()', function(){
        it('should return data as passed in via mock', function() {
            var mockSnippetSearchTerms = "mock search terms";
            var mockPayload = [mockSnippetSearchTerms];
            httpBackend.expectGET(/\/api\/snippet-search\?.*/).respond(mockPayload);

            angularService.searchCode(mockSnippetSearchTerms).then(function(payload){
                expect(payload).toEqual(mockPayload);
            });
        });
    });
});