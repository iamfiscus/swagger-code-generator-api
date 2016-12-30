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

test('Create: should have a body of "stuff"', () => {
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

test('Create: is request.post called', () => {
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


test.afterEach(() => {

});
