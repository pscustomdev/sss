'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'github-dao-spec') ****");

var gh = require('../../db/github-dao');
var expect = require("chai").expect;

describe("GitHub Dao", function() {
    it('should get all repos for user', function (done) {
        gh.getRepos(function(err, repos){
            expect(repos).isArray;
            //expect(repos).toBeTruthy();
            done();
        });
    });
    
    it('should get search results from code', function (done) {
        gh.searchCode("This is a new file for testing", function(err, repos){
            expect(repos).isArray;
            //expect(repos).toBeTruthy();
            done();
        });
    });
});
