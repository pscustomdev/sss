'use strict';
console.log("**** (Backend Unit Testing [MOCHA]: 'azure-storage-dao-spec') ****");

var azureStorage = require('../../db/azure-storage-dao');
var uuid = require('node-uuid');
var fs = require('fs');
var expect = require("chai").expect;

describe("Azure Storage Dao", function() {
    var folderName = "MochaTestFolder";
    var fakeFileName = "MochaTestFile";
    var fakeFileName2 = "MochaTestFile2";

    //Create the default container if it doesn't exist.
    var DEFAULT_CONTAINER = "sss-snippet-container";
    azureStorage.createContainer(DEFAULT_CONTAINER, function(err, result, response){});

    beforeEach(function(done) {
        //cleanup fake repo
        azureStorage.deleteFile(folderName, fakeFileName , function (err, result) {
            azureStorage.deleteFile(folderName, fakeFileName2 , function (err, result) {
                done();
            });
        });
    }, 5000);

    afterEach(function(done) {
        azureStorage.deleteFile(folderName, fakeFileName , function (err, result) {
            azureStorage.deleteFile(folderName, fakeFileName2 , function (err, result) {
                done();
            });
        });
    }, 5000);


    it('should add a text file to a virtual folder', function (done) {
        var content = "Mocha file content";
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            done();
        })
    });

    it('should be able to read a blobs text from a blob', function (done) {
        var content = "Mocha file content";
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            azureStorage.getBlobToText(folderName, fakeFileName, function(err, result) {
                expect(result).to.be.eql(content);
                done();
            });
        })
    });

    it('should update a text file in a container', function (done) {
        var content = "Mocha file content";
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            content += "New Content";
            azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                azureStorage.getBlobToText(folderName, fakeFileName, function(err, result) {
                    expect(result).to.be.eql(content);
                    done();
                });
            });
        })
    });

    it('should add a streamed file to a container', function (done) {
        var content = "Mocha file content";
        var fileName = "readme";
        var path = "tests/backend-unit-tests/" + fileName;
        var stream = fs.createReadStream(path);
        var stats = fs.statSync(path)
        var fileSize = stats['size'];
        azureStorage.addUpdateFileByStream(folderName, fileName, stream, fileSize, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            done();
        })
    });

    it('should update a streamed file in a container', function (done) {
        var content = "Mocha file content";
        var fileName = "readme";
        var path = "tests/backend-unit-tests/" + fileName;
        var stream = fs.createReadStream(path);
        var stats = fs.statSync(path);
        var fileSize = stats['size'];
        azureStorage.addUpdateFileByStream(folderName, fileName, stream, fileSize, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            var updatedFileName = "testDataFile";
            var path = "tests/backend-unit-tests/" + updatedFileName;
            var stream = fs.createReadStream(path);
            var stats = fs.statSync(path);
            var fileSize = stats['size'];
            //we need to pass in the same fileName because we are wanting to update the original file with the updated file
            azureStorage.addUpdateFileByStream(folderName, fileName, stream, fileSize, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                azureStorage.getBlobToText(folderName, fileName, function(err, result){
                    expect(result).to.contain("file test");
                    done();
                });
            });
        });
    });

    it('should get a list of files in a virtual folder', function (done) {
        //create the container
        var fakeFileName = "MochaTestFile";
        var fakeFileName2 = "MochaTestFile2";
        var content = "Mocha file content";
        var content2 = "Mocha file content2";
        //add two files so we can read them
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function (err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            azureStorage.addUpdateFileByText(folderName, fakeFileName2, content2, function (err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                azureStorage.getListOfFilesInFolder(folderName, function (err, result, response) {
                    expect(response.isSuccessful).to.be.eql(true);
                    expect(result.entries).isArray;
                    expect(result.entries[0].name).to.be.eql(fakeFileName);
                    expect(result.entries[1].name).to.be.eql(fakeFileName2);
                    done();
                });
            });
        })
    });

    it('should delete a folder', function (done) {
        var content = "Mocha file content";
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            content += "New Content";
            azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                azureStorage.getBlobToText(folderName, fakeFileName, function(err, result) {
                    expect(result).to.be.eql(content);
                    azureStorage.deleteFolder(folderName, function(err, result, response){
                        expect(response.isSuccessful).to.be.eql(true);
                        //Get folder and make sure it's empty
                        azureStorage.getListOfFilesInFolder(folderName, function (err, result, response) {
                            expect(response.isSuccessful).to.be.eql(true);
                            expect(result.entries[0]).to.be.undefined;
                            done();
                        });
                    });
                });
            });
        })
    });

    it('should delete a file from a folder', function (done) {
        var content = "Mocha file content";
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            azureStorage.deleteFile(folderName, fakeFileName, function(err, result){
                expect(result.isSuccessful).to.be.eql(true);
                azureStorage.getListOfFilesInFolder(folderName, function (err, result, response) {
                    expect(response.isSuccessful).to.be.eql(true);
                    expect(result.entries[0]).to.be.undefined;
                    done();
                });
            });
        })
    });

    it('should cleanup (delete) all marked files from a folder', function (done) {
        var content = "Mocha file content";
        azureStorage.addUpdateFileByText(folderName, fakeFileName, content, function(err, result, response) {
            expect(response.isSuccessful).to.be.eql(true);
            azureStorage.getListOfFilesInFolder(folderName, function (err, result, response) {
                expect(response.isSuccessful).to.be.eql(true);
                expect(result.entries[0]).to.not.be.undefined;
                // mark file for deletion
                azureStorage.addUpdateFileByText(folderName, fakeFileName, "deleted=true", function(err, result, response) {
                    expect(response.isSuccessful).to.be.eql(true);
                    azureStorage.getListOfFilesInFolder(folderName, function (err, result, response) {
                        expect(response.isSuccessful).to.be.eql(true);
                        expect(result.entries[0]).to.be.undefined;
                        azureStorage.cleanupFiles(function(err, result) {
                            azureStorage.getListOfFilesInFolder(folderName, function (err, result, response) {
                                expect(response.isSuccessful).to.be.eql(true);
                                expect(result.entries[0]).to.be.undefined;
                                done();
                            });
                        });
                    });
                });
            })
        })
    });

});
