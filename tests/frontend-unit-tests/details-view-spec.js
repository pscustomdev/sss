'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'details-view-spec') ****");

describe('SSS Views', function() {
    describe('Details-View', function() {
        beforeEach(module('app.details'));

        var $scope, $nodeServices, $stateParams, $httpBackend, $controller;

        beforeEach(inject(function($injector) {
            $scope = $injector.get('$rootScope').$new();  // Create a new child scope or $rootScope
            $nodeServices = $injector.get('$nodeServices');
            $stateParams = $injector.get('$stateParams');
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
                controller = $controller('DetailsController', { $scope: $scope, $nodeServices: $nodeServices, $stateParams: $stateParams});
                $httpBackend.expectGET(/\/api\/snippet-detail\/\w+.*\/.*/).respond(200, mockPayload);
                $httpBackend.flush();
            });

            it('should be defined', function() {
                expect(controller).to.not.be.undefined;
            });

        });
    });
});