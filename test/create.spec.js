import test from 'ava';
import chai from 'chai';
import sinon from 'sinon';
import proxyquire from 'proxyquire';

const assert = chai.assert;
const proxy = proxyquire.noCallThru();

let create;
let ns;
test.beforeEach(() => {
  ns = {
    request: {
      post() {},
    },
  };
  create = proxy('../src/create', ns);
});

test('should fail if endpoint is invalid', () => {
  sinon.stub(ns.request, 'post', (conf, cb) =>
    cb(false, true, {
      code: 'not a number',
      stuff: 'yeah i am the body',
    }),
  );

  return create({}).catch(data =>
    assert.equal(data.message, 'The endpoint provided is invalid'),
  );
});

test('is request.post called', () => {
  const spy = sinon.stub(ns.request, 'post');
  create({
    endpoint: 'love',
    language: 'js',
  },
  'swagger spec',
  );

  assert.equal(spy.callCount, 1);
  assert.isOk(spy.calledWith({
    url: 'lovejs',
    json: true,
    body: 'swagger spec',
  }));
});

test('should have a body of "stuff"', () => {
  sinon.stub(ns.request, 'post', (conf, cb) =>
    cb(false, true, {
      code: 'not a number',
      stuff: 'yeah i am the body',
    }),
  );

  return create({
    endpoint: 'love',
    language: 'js',
  }).then(data =>
    assert.equal(data.stuff, 'yeah i am the body'),
  );
});

test('should fail when response code is a number', () => {
  sinon.stub(ns.request, 'post', (conf, cb) =>
    cb(false, true, {
      code: 500,
    }),
  );

  return create({
    endpoint: 'love',
    language: 'js',
  }).catch(data =>
    assert.equal(data.code, 500),
  );
});

test('should fail when error object passed', () => {
  sinon.stub(ns.request, 'post', (conf, cb) =>
    cb({
      message: 'This should fail',
    }),
  );

  return create({
    endpoint: 'love',
    language: 'js',
  }).catch(data =>
    assert.equal(data.message, 'This should fail'),
  );
});

test.afterEach(() => {

});
