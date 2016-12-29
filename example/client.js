'use strict';

let codegen = require('../index');
let version = require('../package.json').version;

codegen.generate.client({
  types: ['javascript'],
  swagger: './example/petstore.json', // required json or yaml
  endpoint: 'http://generator.swagger.io/api/gen/clients/',
  path: {
    archive: `./generated/archive/${version}/`,
    output: `./generated/client/${version}/`
  }
})
