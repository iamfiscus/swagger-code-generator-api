'use strict';

const fs = require('fs');
const request = require('request');
const unzip = require('unzip');

const download = function download(downloadPath, downloadResponse) {
  return new Promise((resolve, reject) => {
    if (!downloadPath) reject({ message: 'Invalid download path' });
    if (!downloadResponse) reject({ message: 'Invalid download link' });

    request(downloadResponse).pipe(fs.createWriteStream(downloadPath)).on('finish', resolve).on('error', reject);
  });
};

const unzipDownload = function unzipDownload(zipPath, toPath) {
  return new Promise((resolve, reject) => {
    if (!zipPath) reject({ message: 'Invalid zip file path' });
    if (!toPath) reject({ message: 'Invalid destination file path' });
    if (zipPath.indexOf('.zip') === -1) reject({ message: `To unzip file must be a .zip file not ${zipPath}` });

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
