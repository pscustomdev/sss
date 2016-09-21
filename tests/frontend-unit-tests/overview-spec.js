'use strict';
console.log("**** (Frontend Unit Testing [KARMA]: 'overview-view-spec') ****");

describe('SSS Views', function() {
    describe('Overview-View', function(){
        beforeEach(module('app.overview'));

        var $scope, $rootScope, $nodeServices, $stateParams, $httpBackend, $controller;
        var fakeSnippetId = "fakeSnippetId";

        beforeEach(inject(function($injector) {
            $rootScope = $injector.get('$rootScope');
            $scope = $rootScope.$new();  // Create a new child scope or $rootScope
            $nodeServices = $injector.get('$nodeServices');

            $stateParams = $injector.get('$stateParams');
            $stateParams.snippetId = fakeSnippetId;

            $httpBackend = $injector.get('$httpBackend');
            $rootScope.currentUser = {username:'fakeUser'};
            $controller = $injector.get('$controller');
            $controller('OverviewController', { $scope: $scope, $rootScope:$rootScope, $nodeServices: $nodeServices, $stateParams: $stateParams});
            // var mockPayload = [{"name": "README.md"}];
            // $httpBackend.expectGET('/api/rating/' + fakeSnippetId + '/' + $rootScope.currentUser.username).respond(200, {rating:5});
            // $httpBackend.expectGET('/api/rating/' + fakeSnippetId).respond(200, {rating:5});
            // $httpBackend.expectGET('/api/snippet-overview/' + fakeSnippetId).respond(200, mockPayload);
            // $httpBackend.flush();
        }));

        afterEach(function() {
           // $httpBackend.verifyNoOutstandingExpectation();
           // $httpBackend.verifyNoOutstandingRequest();
        });

        it('should be defined', function() {
            $controller.should.be.defined;
        });

        it('should have default $scope variables defined', function() {
            expect($scope.snippetId).to.be.eql(fakeSnippetId);
            expect($scope.fileContent).to.be.eql("");
            expect($scope.confirmDelete).to.be.eql(false);
            expect($scope.avgRatingOptions).to.be.eql({
                ratedFill: '#337ab7',
                readOnly: true,
                halfStar: true,
                starWidth: "20px"
            });
        });

        xit('should be able to delete a snippet', function() {
            //Code in the controller
            //$scope.deleteSnippet = function(snippetId) {
            //    $nodeServices.deleteSnippet(snippetId).then (
            //        function() {
            //            // redirect to the search page
            //            $state.go('search', {});
            //        }
            //    )
            //};

        });
        xit('should be able to update a snippet', function() {
            // update the display name and description
            //$scope.updateSnippet = function() {
            //    $scope.snippetOverview.owner = $rootScope.currentUser.username;
            //    //TODO update my rating here.
            //    $nodeServices.updateSnippet($scope.snippetOverview).then (
            //        function() {}
            //    )
            //};
        });

        xit('should be able to add a file to a snippet', function() {
            //$scope.addFile = function(fileName) {
            //    var content = "";
            //    $nodeServices.addFile($scope.snippetId, fileName, content).then (
            //        function() {
            //            // refresh the overview page
            //            $state.reload();
            //        }
            //    )
            //};

        });

        xit('should be able to delete a file from a snippet', function() {
            //
            //$scope.deleteFile = function(fileName) {
            //    // display modal to confim delete
            //    $scope.confirmDelete = false;
            //    $("#fileDeleteModal").modal();
            //    $("#fileDeleteModal").on('hidden.bs.modal', function() {
            //        if ($scope.confirmDelete) {
            //            $nodeServices.deleteFile($scope.snippetId, fileName).then (
            //                function() {
            //                    // refresh the overview page
            //                    $state.reload();
            //                }
            //            )
            //            $scope.confirmDelete = false;
            //        }
            //    });
            //};
        });

        it('File uploader should be defined with a url', function() {
            $scope.uploader.should.be.defined;
            $scope.uploader.url.should.equal("/api/snippet-detail/" + fakeSnippetId);
        });

        xit('fileNameModal should be get focus', function() {
            // focus the input field when the new file dialog is shown
            //$("#fileNameModal").on('shown.bs.modal', function () {
            //    $("#newFileName").focus();
            //})
        });

        it('upload complete should be defined', function() {
             $scope.uploadComplete.should.be.defined;
        });
    });
});