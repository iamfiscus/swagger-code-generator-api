import test from 'ava';
import chai from 'chai';
import codegen from '../src/index';
const assert = chai.assert;

test('Client: Swagger file missing', () => {
  // const curry = function curry() {
  //   return codegen.generate.client({
  //     swagger: null,
  //   });
  // };

  // assert.throws(curry);
  // assert.equal(codegen.generate.client({
  //   swagger: null,
  // }), 'Initialization failed. [Error: The swagger file path is required.]');
});
