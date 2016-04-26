'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'node-services-spec') ****");

describe('SSS Node Services', function() {
    beforeEach(module('app.$nodeServices'));

    var $httpBackend, $nodeServices;

    beforeEach(inject(function ($injector) {
        $nodeServices = $injector.get('$nodeServices');
        $httpBackend = $injector.get('$httpBackend');
        $httpBackend.whenGET(/\/js\/app\/sss\/search\/.*/).respond(200, '');  // Prevents ui router calls, which are retrieving views, from throwing a false error
    }));

    afterEach(function() {
        $httpBackend.flush();
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('getSnippets()', function() {
        var mockPayload;

        beforeEach(function() {
            mockPayload = ["mockdata1", "mockdata2"];
            $httpBackend.expectGET(/\/api\/snippets.*/).respond(mockPayload);
        });

        it('should return data as passed in via mock', function() {
            $nodeServices.getSnippets().then(function(payload){
                expect(payload).to.deep.equal(mockPayload);
            });
        });
    });

    describe('getSnippetOverview()', function(){
        var mockPayload, mockSnippetId;

        beforeEach(function() {
            mockSnippetId = 'mockSnippetId';
            mockPayload = [{"name": "README.md"}];
            $httpBackend.expectGET(/\/api\/snippet\-overview\/\w+.*/).respond(mockPayload);
        });

        it('should return data as passed in via mock', function() {
            $nodeServices.getSnippetOverview(mockSnippetId).then(function(payload){
                expect(payload).to.deep.equal(mockPayload);
            });
        });
    });

    describe('getSnippetDetail()', function(){
        var mockPayload, mockSnippetFilename, mockSnippetId;

        beforeEach(function() {
            mockSnippetFilename = 'mockFilename';
            mockSnippetId = 'mockSnippetId';
            mockPayload = "mock file data";
            $httpBackend.expectGET(/\/api\/snippet\-detail\/\w+.*\/\w+.*/).respond(mockPayload);
        });

        it('should return data as passed in via mock', function() {
            $nodeServices.getFile(mockSnippetId, mockSnippetFilename).then(function(payload){
                expect(payload).to.deep.equal(mockPayload);
            });
        });
    });

    describe('searchCode()', function(){
        var mockPayload, mockSnippetSearchTerms;

        beforeEach(function() {
            mockSnippetSearchTerms = "mock search terms";
            mockPayload = [mockSnippetSearchTerms];
            $httpBackend.expectGET(/\/api\/snippet-search\?.*/).respond(mockPayload);
        });

        it('should return data as passed in via mock', function() {
            $nodeServices.searchCode(mockSnippetSearchTerms).then(function(payload){
                expect(payload).to.deep.equal(mockPayload);
            });
        });
    });
});