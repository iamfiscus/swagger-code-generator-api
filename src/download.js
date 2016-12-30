'use strict';

const fs = require('fs');
const request = require('request');
const unzip = require('unzip');

const download = function download(downloadPath, downloadResponse) {
  return new Promise((resolve, reject) => {
    request(downloadResponse.link).pipe(fs.createWriteStream(downloadPath)).on('finish', resolve).on('error', reject);
  });
};

const unzipDownload = function unzipDownload(zipPath, toPath) {
  if (zipPath.indexOf('.zip') === -1) throw new Error(`To unzip file must be a .zip file not ${zipPath}`);
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath).pipe(unzip.Extract({
      path: toPath,
    })).on('error', reject).on('close', resolve);
  });
};

module.exports = function file() {
  return {
    get: download,
    unzip: unzipDownload,
  };
};
