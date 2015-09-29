'use strict';

console.log("(KARMA Front-End Testing: 'overview-view-spec')");
describe('Unit: SSS Views', function() {
    describe('Overview-View', function(){
        var httpBackend, angularService;

        beforeEach(
            module('app')
        );

        beforeEach(inject(function ($injector) {
            angularService = $injector.get('angularService');
            httpBackend = $injector.get('$httpBackend');
            httpBackend.whenGET(/\/js\/app\/sss\/main\/.*/).respond(200, '');  // Prevents ui router calls to retrieve views from throwing a false error
        }));

        afterEach(function() {
            httpBackend.verifyNoOutstandingExpectation();
            httpBackend.verifyNoOutstandingRequest();
        });

        describe('OverviewContoller', function(){
            var createController, vm;
            var mockPayload = [{"name": "README.md"}];

            beforeEach(inject(function ($controller) {
                createController = function() {
                    return $controller('OverviewController');
                };
                vm = createController();
                httpBackend.expectGET(/\/api\/snippet-overview\/\w+.*/).respond(200, mockPayload);
                httpBackend.flush();
            }));

            it('should be defined', function() {
                expect(vm).toBeDefined();
            });

            it('should have the same filename as was passed in via mock', function() {
                expect(vm.snippetOverview).toEqual(mockPayload);
            });
        });
    });
});