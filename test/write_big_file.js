'use strict';

const co = require('co');
const path = require('path');
const DiskStore = require('../');
const cacheDir = path.join(__dirname, 'tmp');

const store = new DiskStore({ cacheDir });

co(function* () {

  console.time('write');
  yield store.set('big.bin', new Buffer(50 * 1024 * 1024));
  console.timeEnd('write');

}).catch(err => {
  console.error(err);
});

setTimeout(() => {
  process.exit(1);
}, 5);
