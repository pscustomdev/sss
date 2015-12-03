'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'details-view-spec') ****");

describe('SSS Views', function() {
    describe('Details-View', function() {
        beforeEach(module('app.details'));

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

        describe('DetailsController', function() {
            var controller, mockPayload;

            beforeEach(function() {
                mockPayload = "mock file data";
                controller = $controller('DetailsController');
                $httpBackend.expectGET(/\/api\/snippet-detail\/\w+.*\/.*/).respond(200, mockPayload);
                $httpBackend.flush();
            });

            it('should be defined', function() {
                expect(controller).to.not.be.undefined;
            });

            it('should have the same filename payload as was passed in via mock', function() {
                expect(controller.snippetDetail).to.equal(mockPayload);
            });
        });
    });
});