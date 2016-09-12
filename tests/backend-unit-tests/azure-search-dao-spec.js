console.log("**** (Backend Unit Testing [MOCHA]: 'azure-search-dao-spec') ****");

var azureSearch = require("../../db/azure-search-dao");
var expect = require("chai").should();

describe("Azure Search Dao", function() {
    // beforeEach(function(done) {
    //     //cleanup fake repo
    // }, 5000);
    //
    // afterEach(function(done) {
    // }, 5000);


    it('should be able to search for snippet in the mongoDB', function (done) {
        var searchTerms = "taco";
        azureSearch.searchSnippets(searchTerms, function(err, results) {
            // results.should.contain("mocha");
            results.should.be.a('array');
            //Check if the @search.highlights exists
            done();
        })
    });

    xit('should be able to search for a file in the blob storage', function (done) {

    });

});
