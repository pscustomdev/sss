'use strict';

describe('SSS', function() {
    beforeEach(module('app'));
    
    describe('Main Page', function(){
        it('should have a SSSController defined', inject(function($controller) {
            //spec body
            var controller = $controller('SSSController', { $scope : '$scope' });
            expect(controller).toBeDefined();
        }));
        it('should have a DetailController defined', inject(function($controller) {
            //spec body
            var controller = $controller('DetailController');
            expect(controller).toBeDefined();
        }));
        it('should have a OverviewController defined', inject(function($controller) {
            //spec body
            var controller = $controller('OverviewController');
            expect(controller).toBeDefined();
        }));
    });
    
});

/*
describe("Main Controller", function() {
    beforeEach(module("app"));
    var createController,
        vm;

    beforeEach(inject(function ($injector) {
        var $controller = $injector.get('$controller');

        createController = function() {
            return $controller('MainController', {
            });
        };
        vm = createController();
    }));
    it('should have scope variables set to defaults', function () {
        expect(vm.users).toEqual([]);
        expect(vm.places).toEqual([]);
        expect(vm.vote_max).toEqual(10);
        expect(vm.voted).toEqual(false);
        expect(vm.showMainApp).toEqual(false);
        expect(vm.groupName).toEqual("");
        expect(vm.voteBtnActive).toEqual(0);
        expect(vm.businessData).toEqual([]);
        expect(vm.location).toEqual("");
        expect(vm.suggestionTitle).toEqual("Suggestions");
        expect(vm.currentSuggestionGroup).toEqual("yelp");
        expect(vm.showSetUserName).toEqual(false);
        expect(vm.dealsOnly).toEqual(false);
        expect(vm.yelpOffset).toEqual(0);
        expect(vm.yelpSearchType).toEqual("cll");
        expect(vm.yelpSortType).toEqual(0);
        expect(vm.yelpNextDisabled).toEqual(false);
        expect(vm.googleSortType).toEqual(0);
        expect(vm.showLoading).toEqual(true);
    });

    it('should be able to add a place to places with the input box', function () {
        vm.placeName = "CoolPlace";
        vm.userName = "Kent";
        vm.addPlace();
        expect(vm.places).toContain({ name: 'CoolPlace', addedBy:"Kent", url: undefined, address: undefined, fromType: undefined, rating: undefined, rating_img_url: undefined, deal: undefined, voters: [  ] });
    });

    it('should be able to vote for a place and add to TotalVotes then change your vote', function () {
        vm.placeName = "CoolPlace";
        var numVotes = 5;

        vm.addPlace();
        var p = {name:"CoolPlace"};
        vm.voteForPlace(p, numVotes);
        var currentPlace = vm.places[0];
        expect(currentPlace.totalVotes).toEqual(numVotes);

        var changeVote = 2;
        vm.voteForPlace(p, changeVote);
        expect(currentPlace.totalVotes).toEqual(changeVote);
    });

    it('should set the suggestionGroup', function () {
        vm.setSuggestionsGroup("blah");
        expect(vm.currentSuggestionGroup).toEqual("blah");
    });

    it('should be able to add a business of type yelp', function () {
        vm.setSuggestionsGroup("yelp");


        var business = {
            id: "CoolPlace",
            name: "CoolPlace",
            fromType: "yelp",
            rating: 5,
            url: "cool_url",
            location: {"display_address":["CoolAddress"]},
            rating_img_url: "cool_rating_url"
        };
        var type = "yelp";

        vm.addBusiness(business, type);
        expect(vm.places).toContain({ name: 'CoolPlace', addedBy:"", url: "cool_url", address: "CoolAddress", fromType: "yelp", rating: 5, rating_img_url: "cool_rating_url", deal: undefined, voters: [  ] });
    });

    it('should be able to add a business of type google', function () {

        vm.setSuggestionsGroup("google");

        var business = {
            id: "CoolPlace",
            name: "CoolPlace",
            fromType: "google",
            vicinity: "CoolAddress"
        };
        var type = "google";

        vm.addBusiness(business, type);
        expect(vm.places).toContain({ name: 'CoolPlace', addedBy:"", url: undefined, address: "CoolAddress", fromType: "google", rating: undefined, rating_img_url: "", deal: undefined, voters: [  ] });
    });

});

describe("Main Page Controller Server Calls", function() {
    beforeEach(module("app"));
    var createController,
        $httpBackend,
        $scope,
        vm;

    beforeEach(inject(function ($injector) {
        $httpBackend = $injector.get('$httpBackend');
        var $controller = $injector.get('$controller');
        $scope = $injector.get('$rootScope');


        createController = function() {
            return $controller('MainController', {
            });
        };
        vm = createController();
    }));

    afterEach(function() {
        $httpBackend.verifyNoOutstandingExpectation();
        $httpBackend.verifyNoOutstandingRequest();
    });

    it('should get the userName from the server and assign it.', function() {
        vm = createController();

        $httpBackend.expect('GET', '/rest/user/')
            .respond({
                firstName: "Kent",
                lastName: "Blah"
            });

        // have to use $apply to trigger the $digest which will
        // take care of the HTTP request
        $scope.$apply(function() {
            vm.getAuthenticatedUser();
        });
        $httpBackend.flush(); //This is when it actually makes the call.

        expect(vm.userName).toEqual('Kent');
    });

    //xit('should put the group into the DB', function() {
    //    $httpBackend.expect('PUT', '/rest/group/')
    //        .respond({
    //        });
    //
    //    scope.$apply(function() {
    //        scope.createGroup();
    //    });
    //
    //    $httpBackend.flush();
    //    //TODO make sure it was created in the DB
    //    //expect(scope.groupName).toEqual();
    //});
    //
    it('should get Yelp business data from the passed in city.', function() {
        vm.location = "orem";
        $httpBackend.expect('GET', '/yelp/city/orem?deals=false&offset=0&yelpSortType=0')
            .respond({
                businesses: ['Business1']
            });

        $scope.$apply(function() {
            vm.getYelpData('city', 0);
        });

        $httpBackend.flush();

        expect(vm.businessData).toEqual(['Business1']);
    });


});

//********************NOTES***********************
//skip me
//xdescribe('Main Page', function() {
//    xit('should skipme', inject(function($controller) {
//    }));
//});
//********************NOTES***********************
*/