'use strict';

var gh = require('../../db/github-dao');

console.log("**** (JASMINE/NODE/KARMA Back-End-Unit Testing: 'github-dao-spec') ****");
describe("GitHub Dao", function() {
    it('should get all repos for user', function (done) {
        gh.getRepos(function(err, repos){
            expect(repos).toBeTruthy();
            done();
        });
    });
    
    it('should get search results from code', function (done) {
        gh.searchCode("This is a new file for testing", function(err, repos){
            expect(repos).toBeTruthy();
            done();
        });
    });
});
//