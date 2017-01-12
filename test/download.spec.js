import test from 'ava';
import chai from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const assert = chai.assert;
const proxy = proxyquire.noCallThru();

let download;
let ns;
test.beforeEach(() => {
  ns = {
    request() {
      return {
        pipe() {
          return {
            on() {
              return {
                on() {},
              };
            },
          };
        },
      };
    },
    fs: {
      createReadStream() {
        return {
          pipe() {
            return {
              on() {
                return {
                  on() {},
                };
              },
            };
          },
        };
      },
      createWriteStream() {},
    },
    unzip: {
      Extract() {},
    },
  };
  download = proxy('../src/download', ns);
});

test('Get: should fail if path is invalid', () => {
  download().get().catch(data =>
    assert.equal(data.message, 'Invalid download path'),
  );
});

test('Get: should fail if path is invalid', () => {
  download().get('path').catch(data =>
    assert.equal(data.message, 'Invalid download link'),
  );
});

test('Get: should call request.pipe and fs.createWriteStream', () => {
  const requestSpy = sinon.stub(ns.request(), 'pipe');
  const fsSpy = sinon.stub(ns.fs, 'createWriteStream');

  download().get('path', 'link').then(() => {
    assert.equal(requestSpy.callCount, 1);
    assert.isOk(requestSpy.calledWith('link'));

    assert.equal(fsSpy.callCount, 1);
    assert.isOk(fsSpy.calledWith('path'));
  });
});

test('Unzip: should fail if zip file path is invalid', () => {
  download().unzip().catch(data =>
    assert.equal(data.message, 'Invalid zip file path'),
  );
});

test('Unzip: should fail if destination path is invalid', () => {
  download().unzip('file').catch(data =>
    assert.equal(data.message, 'Invalid destination file path'),
  );
});

test('Unzip: should fail if destination path is invalid', () => {
  download().unzip('file', 'destination').catch(data =>
    assert.equal(data.message, 'To unzip file must be a .zip file not file'),
  );
});

test('Unzip: should call fs.createReadStream', () => {
  const fsSpy = sinon.stub(ns.fs.createReadStream(), 'pipe');
  const unzipSpy = sinon.stub(ns.unzip, 'Extract');

  download().unzip('file.zip', 'destination').then(() => {
    assert.equal(fsSpy.callCount, 1);
    assert.isOk(fsSpy.calledWith('file.zip'));

    assert.equal(unzipSpy.callCount, 1);
    assert.isOk(unzipSpy.calledWith('destination'));
  });
});
