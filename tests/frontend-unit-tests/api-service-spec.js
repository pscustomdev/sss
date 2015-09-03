'use strict';

console.log("(KARMA Front-End Testing: 'api-service-spec')");
describe('API Service', function(){
    var $httpBackend, api;

    beforeEach(module('app'));

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        api = $injector.get('api');
        
    }));
    
    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    describe('getSnippets()', function() {
        it('should return data as passed in via mock', inject(function($controller) {
            var mockPayload = ["mockdata1", "mockdata2"];
            $httpBackend.when('GET', '/api/snippets')
                .respond(200, mockPayload);
        
                api.getSnippets().then(function(payload){
                    expect(payload).toEqual(mockPayload);
                });
            $httpBackend.flush();    
        })); 
    });
    
    describe('getSnippetOverview()', function(){
        it('should return data as passed in via mock', inject(function($controller) {
            var mockId = 'mockId';
            var mockPayload = [{"name":"README.md"}];
            $httpBackend.when('GET', '/api/snippet-overview/' + mockId)
                .respond(200, mockPayload);
        
                api.getSnippetOverview(mockId).then(function(payload){
                    expect(payload).toEqual(mockPayload); 
                });
            $httpBackend.flush();    
        }));
    });
    
    describe('getSnippetDetail()', function(){
        it('should return data as passed in via mock', inject(function($controller) {
            var mockId = 'mockId';
            var mockFilename = 'mockFilename';
            var mockPayload = "mock file data";
            $httpBackend.when('GET', '/api/snippet-detail/' + mockId + "/" + mockFilename)
                .respond(200, mockPayload);
        
                api.getSnippetDetail(mockId, mockFilename).then(function(payload){
                    expect(payload).toEqual(mockPayload); 
                });
            $httpBackend.flush();    
        })); 
    });
});