'use strict';

const mm = require('mm');
const fs = require('mz/fs');
const path = require('path');
const assert = require('assert');
const coffee = require('coffee');
const rimraf = require('mz-modules/rimraf');
const DiskStore = require('../lib');

const cacheDir = path.join(__dirname, 'tmp');

describe('test/index.test.js', () => {
  let diskStore;
  before(function* () {
    yield rimraf(cacheDir);
    diskStore = new DiskStore({
      cacheDir,
    });
    yield diskStore.ready();
  });
  afterEach(mm.restore);
  after(function* () {
    yield rimraf(cacheDir);
  });

  it('should provide cacheDir', () => {
    assert.throws(() => {
      new DiskStore();
    }, '[DiskStore] options.cacheDir is required');
  });

  it('should set & get & delete ok', function* () {
    yield diskStore.set('a', 'a');
    let data = yield diskStore.get('a');
    assert.deepEqual(data, new Buffer('a'));

    yield diskStore.delete('a');
    data = yield diskStore.get('a');
    assert(data === null);
  });

  it('should support multi-level folder', function* () {
    const buf = new Buffer('hello world');
    yield diskStore.set('a/b/c', buf);
    let data = yield diskStore.get('a/b/c');
    assert.deepEqual(data, buf);

    yield diskStore.delete('a/b/c');
    data = yield diskStore.get('a/b/c');
    assert(data === null);
  });

  it('should rm tmpfile anyway', function* () {
    yield diskStore.set('abc', 'a');
    let data = yield diskStore.get('abc');
    assert.deepEqual(data, new Buffer('a'));
    mm(fs, 'rename', () => {
      return Promise.reject(new Error('mock error'));
    });
    try {
      yield diskStore.set('abc', 'b');
      assert(false, 'should not run here');
    } catch (err) {
      assert(err.message === 'mock error');
    }
    data = yield diskStore.get('abc');
    assert.deepEqual(data, new Buffer('a'));
    const files = yield fs.readdir(path.join(cacheDir, '.tmp'));
    assert(files.length === 0);
  });

  describe('write atomic', () => {
    it('should write be atomic', function* () {
      yield coffee.fork('write_big_file.js', [])
        .expect('code', 1)
        .end();

      const isExists = yield fs.exists(path.join(cacheDir, 'big.bin'));
      assert(!isExists);
    });
  });
});
