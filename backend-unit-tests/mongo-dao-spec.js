'use strict';

var db = require('../db/mongo-dao');

describe("Mongo Dao", function() {
    it('should be able to call our fake function', function () {
        expect(db.fakeFunction()).toEqual("taco");
    });
});