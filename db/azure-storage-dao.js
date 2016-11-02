var azure = require('azure-storage');
var auth_config = require('../auth/auth-conf');

var blobSvc = azure.createBlobService(auth_config.azure.blobStorage.name, auth_config.azure.blobStorage.key);

var DEFAULT_CONTAINER = "sss-snippet-files";

exports.createContainer = function (container, next) {
    //create the container/snippet if needed then add the file to the container
    //container names have to be lowercase
    blobSvc.createContainerIfNotExists(DEFAULT_CONTAINER, {publicAccessLevel: 'blob'}, function (err, result, response) {
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};

exports.deleteFolders = function (folders, next) {
    if(folders){
        folders.forEach(function(folder){
            exports.deleteFolder(folder, function(err, result) {
                if (err) {
                    console.warn(err.message);
                }
                next(err, "");
            })
        })
    } else {
        var err = null; //no errors so return null.
        next(err, "");
    }
};


// delete all files for a snippet (folder name is the snippet id)
exports.deleteFolder = function (folder, next) {
    //container names have to be lowercase
    blobSvc.listBlobsSegmentedWithPrefix(DEFAULT_CONTAINER, folder, null, function (err, blobs, response) {
        if (err) {
            return next(err);
        }
        if(blobs.entries.length > 0) {
            var itemsDeleted = 0;
            blobs.entries.forEach(function (blob) {
                blobSvc.deleteBlobIfExists(DEFAULT_CONTAINER, blob.name, function (err, result, response) {
                    if (err) {
                        return next(err);
                    }
                    itemsDeleted++;
                    if (itemsDeleted === blobs.entries.length) {
                        next(err, result, response);
                    }
                });
            });
        } else {
            next(err, response);
        }

    });
};

exports.deleteFile = function (folder, fileName, next) {
    //Delete a blob from a container
    blobSvc.deleteBlob(DEFAULT_CONTAINER, folder + "/" + fileName, function(err, result){
        if (err) {
            return next(err);
        }
        next(err, result);
    });
};

// delete all marked files with metadata "deleted" = "true"
exports.cleanupFiles = function (next) {
    var err = null;
    blobSvc.listBlobsSegmented(DEFAULT_CONTAINER, null, {include: "metadata"}, function(err, result) {
        if (err) {
            next(err, "");
        }

        var files = [];
        result.entries.forEach(function(entry){
            // only delete files that have been marked
            if (entry.metadata && entry.metadata.deleted == "true") {
                files.push(entry.name);
            }
        });

        if (files.length > 0) {
            files.forEach(function(file) {
                var nameComp = file.split("/");
                exports.deleteFile(nameComp[0], nameComp[1], function (err, result) {
                    if (err) {
                        console.warn(err.message);
                    }
                    next(err, "");
                });
            })
        } else {
            next(null, "");
        }

        //TODO if there is a continuation token keep getting them.
        // result.entries contains the entries
        // If not all blobs were returned, result.continuationToken has the continuation token.
    });
};

//It is the same call to add/update a file
exports.addUpdateFileByText = function (folder, fileName, content, metaData, next) {
    //The result returned by these methods contains information on the operation, such as the ETag of the blob.
    blobSvc.createBlockBlobFromText(DEFAULT_CONTAINER, folder + "/" + fileName, content, { metadata: metaData }, function (err, result, response) {
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};


//It is the same call to add/update a file
exports.addUpdateFileByStream = function (folder, fileName, stream, len, metaData, next) {
    //The result returned by these methods contains information on the operation, such as the ETag of the blob.
    blobSvc.createBlockBlobFromStream(DEFAULT_CONTAINER, folder + "/" + fileName, stream, len, { metadata: metaData }, function (err, result, response){
        if (err) {
            return next(err);
        }
        next(err, result, response);
    });
};

//list blobs in a folder in the default container
exports.getListOfFilesInFolder = function (folder, next) {
    blobSvc.listBlobsSegmentedWithPrefix(DEFAULT_CONTAINER, folder, null, {include: "metadata"}, function (err, result, response) {
        var fileList = [];
        if (err) {
            return next(err);
        }
        result.entries.forEach(function(entry){
            // only include files that have not been deleted
            if (!entry.metadata || entry.metadata.deleted != "true") {
                var fileObj = {};
                fileObj.name = entry.name.replace(folder + "/",'');
                fileObj.editable = entry.metadata.editable == 'true';
                fileObj.viewable = entry.metadata.viewable == 'true';
                fileList.push(fileObj);
            }
        });
        //TODO if there is a continuation token keep getting them.
        // result.entries contains the entries
        // If not all blobs were returned, result.continuationToken has the continuation token.
        next(err, fileList, response);
    });
};

//get blob text in a container/snippet
// or return a url for binary files
exports.getBlobToText = function (folder, blobName, next) {
    blobSvc.getBlobMetadata(DEFAULT_CONTAINER, folder + "/" + blobName, function (err, response) {
        if (err) {
            return next(err);
        }
        if (response.metadata &&
            response.metadata.editable == "false" &&
            response.metadata.viewable == "true") {
            next(null, auth_config.azure.blobStorage.url + "/" + folder + "/" + blobName);
            return;
        }
        else {
            blobSvc.getBlobToText(DEFAULT_CONTAINER, folder + "/" + blobName, function (err, response) {
                if (err) {
                    return next(err);
                }
                next(err, response);
            });
        }
    });
};

