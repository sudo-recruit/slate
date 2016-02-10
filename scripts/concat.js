#!/usr/bin/env node

var fs = require('fs');
var _ = require('lodash');
var cofs = require('co-fs');
var co = require('co');


function write(fileName, content) {
  var fs = require('fs');
  fs.writeFile(fileName, content, function(err) {
    if (err) {
      console.log(err);
    } else {
      console.log("The file was saved!");
    }
  });
}

var dirPath = 'doc';

function isDir(file) {
  return new Promise(function(resolve, reject) {
    fs.stat(file, function(err, stat) {
      if (!!err) {
        return reject(err);
      }
      return resolve(stat.isDirectory());
    })
  })
}

function* buildOneAPI(dirName) {
  var fileNames = yield cofs.readdir(dirName);
  fileNames = _.filter(fileNames, function(file) {
    return file !== 'index.md';
  });
  fileNames = ['index.md'].concat(fileNames);

  var fileBuffers = yield _.map(fileNames, function(fileName) {
    return cofs.readFile(dirName + "/" + fileName);
  });

  var content = _.map(fileBuffers, function(buffer) {
    return buffer.toString();
  }).join('\n');

  return content;
}



function onerror(err) {
  // log any uncaught errors
  // co will not throw any errors you do not handle!!!
  // HANDLE ALL YOUR ERRORS!!!
  console.error(err.stack);
}


co(function*() {
  var files = yield cofs.readdir(dirPath);
  var dirs = yield _.map(files, function(file) {
    return isDir('doc/' + file).then(function(result) {
      return result ? file : '';
    });
  });
  var apiDirs = _.chain(dirs).filter(function(dir) {
    return dir !== '';
  }).map(function(dir) {
    return 'doc/' + dir;
  }).value();

  var apiContents = yield _.map(apiDirs, function(apiDir) {
    return buildOneAPI(apiDir);
  });

  var apiContent = apiContents.join('\n');
  var introductionBuffer = yield cofs.readFile(dirPath + '/index.md');
  var result = introductionBuffer.toString() + apiContent;
  write('source/index.md', result);
}).catch(onerror);
