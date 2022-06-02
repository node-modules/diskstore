'use strict';

const mm = require('mm');
const fs = require('fs/promises');
const path = require('path');
const assert = require('assert');
const coffee = require('coffee');
const DiskStore = require('..');

const cacheDir = path.join(__dirname, 'tmp');

describe('test/index.test.js', () => {
  let diskStore;
  before(async function() {
    await fs.rm(cacheDir, { force: true, recursive: true });
    diskStore = new DiskStore({
      cacheDir,
    });
    await diskStore.ready();
  });
  afterEach(mm.restore);
  after(async function() {
    await fs.rm(cacheDir, { force: true, recursive: true });
  });

  it('should provide cacheDir', () => {
    assert.throws(() => {
      new DiskStore();
    }, /\[DiskStore] options\.cacheDir is required/);
  });

  it('should set & get & delete ok', async function() {
    await diskStore.set('a', 'a');
    let data = await diskStore.get('a');
    assert.deepEqual(data, Buffer.from('a'));

    await diskStore.delete('a');
    data = await diskStore.get('a');
    assert(data === null);
  });

  it('should support multi-level folder', async function() {
    const buf = Buffer.from('hello world');
    await diskStore.set('a/b/c', buf);
    let data = await diskStore.get('a/b/c');
    assert.deepEqual(data, buf);

    await diskStore.delete('a/b/c');
    data = await diskStore.get('a/b/c');
    assert(data === null);
  });

  it('should rm tmpfile anyway', async function() {
    await diskStore.set('abc', 'a');
    let data = await diskStore.get('abc');
    assert.deepEqual(data, Buffer.from('a'));
    mm(fs, 'rename', () => {
      return Promise.reject(new Error('mock error'));
    });
    try {
      await diskStore.set('abc', 'b');
      assert(false, 'should not run here');
    } catch (err) {
      assert(err.message === 'mock error');
    }
    data = await diskStore.get('abc');
    assert.deepEqual(data, Buffer.from('a'));
    const files = await fs.readdir(path.join(cacheDir, '.tmp'));
    assert(files.length === 0);
  });

  it('should make sure tmpdir exists on every set', async function() {
    await diskStore.set('a-foo', 'a foo');
    let data = await diskStore.get('a-foo');
    assert.deepEqual(data, Buffer.from('a foo'));

    await fs.rm(diskStore.tmpdir, { recursive: true });
    await diskStore.set('a-foo', 'a foo bar');
    data = await diskStore.get('a-foo');
    assert.deepEqual(data, Buffer.from('a foo bar'));
  });

  describe('write atomic', () => {
    it('should write be atomic', async function() {
      await coffee.fork('write_big_file.js', [])
        .expect('code', 1)
        .end();

      try {
        await fs.stat(path.join(cacheDir, 'big.bin'));
        throw new Error('should not run this');
      } catch (err) {
        assert(err.code === 'ENOENT');
      }
    });
  });
});
