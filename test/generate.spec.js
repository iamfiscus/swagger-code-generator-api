import test from 'ava';
import codegen from '../src/index';

test('my passing test', (t) => {
  t.true(codegen.greet() === 'hello friend');
});
