'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'github-dao-spec') ****");

var azureStorage = require('../../db/azure-storage-dao');
var uuid = require('node-uuid');
var fs = require('fs');
var expect = require("chai").expect;

describe("Azure Storage Dao", function() {
    var fakeSnippetId = "MochaTestRepo";
    var fakeSnippetDesc = "Mocha Description";
    var fakeSnippetDisplayName = "Mocha Display Name";
    var fakeSnippetReadme = "Mocha Readme";
    var fakeSnippet = {
        _id: fakeSnippetId,
        description: fakeSnippetDesc,
        displayName: fakeSnippetDisplayName,
        readme: fakeSnippetReadme
    };
    var fakeFileName = "MochaTestFile";


    beforeEach(function(done) {
        //cleanup fake repo
       azureStorage.deleteContainer(fakeSnippetId, function (err, result) {
           //create a new snippetId since the old one is deleting and takes some time
           fakeSnippetId = uuid.v1();
           done();
        });
    }, 5000);

    afterEach(function(done) {
        azureStorage.deleteContainer(fakeSnippetId, function (err, result) {
            done();
        });
    }, 5000);

    it('should create a container with the snippetId', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response){
            expect(response.isSuccessful).to.be.eql(true);
            // expect(result.created).to.be.eql(true);
            done();
        });

    });


    it('should add a text file to a container', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var content = "Mocha file content";
            azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName, content, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                done();
            })
        });
    });

    it('should be able to read a blobs text from a file', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var content = "Mocha file content";
            azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName, content, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                azureStorage.getBlobToText(fakeSnippetId, fakeFileName, function(err, result) {
                    expect(result).to.be.eql(content);
                    done();
                });
            })
        });
    });

    it('should update a text file in a container', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var content = "Mocha file content";
            azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName, content, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                content += "New Content";
                azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName, content, function(err, result, response) {
                    expect(response.isSuccessful).to.be.eql(true);
                    azureStorage.getBlobToText(fakeSnippetId, fakeFileName, function(err, result) {
                        expect(result).to.be.eql(content);
                    });
                    done();
                });
            })
        });
    });

    it('should add a streamed file to a container', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var content = "Mocha file content";
            var fileName = "readme";
            var path = "tests/backend-unit-tests/" + fileName;
            var stream = fs.createReadStream(path);
            var stats = fs.statSync(path)
            var fileSize = stats['size'];
            azureStorage.addUpdateFileByStream(fakeSnippetId, fileName, stream, fileSize, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                done();
            })
        });
    });

    it('should update a streamed file in a container', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var content = "Mocha file content";
            var fileName = "readme";
            var path = "tests/backend-unit-tests/" + fileName;
            var stream = fs.createReadStream(path);
            var stats = fs.statSync(path);
            var fileSize = stats['size'];
            azureStorage.addUpdateFileByStream(fakeSnippetId, fileName, stream, fileSize, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                var updatedFileName = "testDataFile";
                var path = "tests/backend-unit-tests/" + updatedFileName;
                var stream = fs.createReadStream(path);
                var stats = fs.statSync(path);
                var fileSize = stats['size'];
                //we need to pass in the same fileName because we are wanting to update the original file with the updated file
                azureStorage.addUpdateFileByStream(fakeSnippetId, fileName, stream, fileSize, function(err, result, response) {
                    expect(response.isSuccessful).to.be.eql(true);
                    //TODO we should get the file and verify the new contents.

                    done();
                });
            });
        });
    });

    it('should get a container contents', function (done) {
        //create the container
        var fakeFileName2 = "MochaTestFile2";
        var content = "Mocha file content";
        var content2 = "Mocha file content2";
        azureStorage.createContainer(fakeSnippetId, function(err, result, response){
            expect(response.isSuccessful).to.be.eql(true);
            //add two files so we can read them
            azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName, content, function(err, result, response) {
                azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName2, content2, function(err, result, response) {
                    expect(response.isSuccessful).to.be.eql(true);
                    azureStorage.getListOfContainerContents(fakeSnippetId, function (err, result, response) {
                        expect(response.isSuccessful).to.be.eql(true);
                        expect(result.entries).isArray;
                        expect(result.entries[0].name).to.be.eql(fakeFileName);
                        expect(result.entries[1].name).to.be.eql(fakeFileName2);
                        done();
                    });
                });
            })
        });
    });

    it('should delete a container with the snippetId', function (done) {
        azureStorage.deleteContainer(fakeSnippetId, function(err, result, response){
            expect(response.isSuccessful).to.be.eql(true);
            done();
        });

    });

    it('should delete a file from a container', function (done) {
        azureStorage.createContainer(fakeSnippetId, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var content = "Mocha file content";
            azureStorage.addUpdateFileByText(fakeSnippetId, fakeFileName, content, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                azureStorage.deleteFile(fakeSnippetId, fakeFileName, function(err, result){
                    expect(result.isSuccessful).to.be.eql(true);
                    done();
                });
            })
        });
    });
});
