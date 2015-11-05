'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'overview-view-spec') ****");

describe('SSS Views', function() {
    describe('Overview-View', function(){
        beforeEach(module('app.overview'));

        var $httpBackend, $controller;

        beforeEach(inject(function($injector) {
            $httpBackend = $injector.get('$httpBackend');
        }));

        beforeEach(inject(function(_$controller_) {
            $controller = _$controller_;
        }));

        afterEach(function() {
            $httpBackend.verifyNoOutstandingExpectation();
            $httpBackend.verifyNoOutstandingRequest();
        });

        describe('OverviewContoller', function(){
            var controller, mockPayload;

            beforeEach(function() {
                mockPayload = [{"name": "README.md"}];
                controller = $controller('OverviewController');
                $httpBackend.expectGET(/\/api\/snippet-overview\/\w+.*/).respond(200, mockPayload);
                $httpBackend.flush();
            });

            it('should be defined', function() {
                expect(controller).to.not.be.undefined;
            });

            it('should have the same filename as was passed in via mock', function() {
                expect(controller.snippetOverview).to.deep.equal(mockPayload);
            });
        });
    });
});