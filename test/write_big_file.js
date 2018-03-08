'use strict';

const path = require('path');
const DiskStore = require('../');
const cacheDir = path.join(__dirname, 'tmp');

const store = new DiskStore({ cacheDir });

const write = async function() {
  console.time('write');
  await store.set('big.bin', new Buffer(50 * 1024 * 1024));
  console.timeEnd('write');
};

write().catch(err => {
  console.error(err);
});

setTimeout(() => {
  process.exit(1);
}, 5);
