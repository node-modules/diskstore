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

  describe('EXDEV fallback', () => {
    // simulate .tmp being on a different device than the target: rename from .tmp
    // throws EXDEV, everything else falls through to the real rename
    function mockCrossDevice() {
      const originRename = fs.rename;
      mm(fs, 'rename', async (src, dest) => {
        if (src.includes(`${path.sep}.tmp${path.sep}`)) {
          const err = new Error('EXDEV: cross-device link not permitted');
          err.code = 'EXDEV';
          throw err;
        }
        return originRename(src, dest);
      });
    }

    it('should fallback to same-dir write when rename is cross-device', async function() {
      mockCrossDevice();
      await diskStore.set('exdev/a', 'exdev value');
      const data = await diskStore.get('exdev/a');
      assert.deepEqual(data, Buffer.from('exdev value'));
      // the fallback temp file should be cleaned up, nothing left in the dir
      const files = await fs.readdir(path.join(cacheDir, 'exdev'));
      assert.deepEqual(files, [ 'a' ]);
    });

    it('should use custom fallbackTmpfileName', async function() {
      const store = new DiskStore({
        cacheDir,
        fallbackTmpfileName: '.custom.fallback.tmp',
      });
      await store.ready();
      // record the source of the same-dir (fallback) rename to prove the custom name is used
      const renamed = [];
      const originRename = fs.rename;
      mm(fs, 'rename', async (src, dest) => {
        if (src.includes(`${path.sep}.tmp${path.sep}`)) {
          const err = new Error('EXDEV: cross-device link not permitted');
          err.code = 'EXDEV';
          throw err;
        }
        renamed.push(src);
        return originRename(src, dest);
      });
      await store.set('exdev-custom', 'v');
      const data = await store.get('exdev-custom');
      assert.deepEqual(data, Buffer.from('v'));
      assert.deepEqual(renamed, [ path.join(cacheDir, '.custom.fallback.tmp') ]);
      // the fallback temp file is removed once used
      assert(await store.get('.custom.fallback.tmp') === null);
    });

    it('should clean up and throw when the fallback rename also fails', async function() {
      mm(fs, 'rename', async src => {
        if (src.includes(`${path.sep}.tmp${path.sep}`)) {
          const err = new Error('EXDEV: cross-device link not permitted');
          err.code = 'EXDEV';
          throw err;
        }
        // the fallback (same-dir) rename fails too
        throw new Error('mock fallback rename error');
      });
      try {
        await diskStore.set('exdev-fail/a', 'v');
        assert(false, 'should not run here');
      } catch (err) {
        assert(err.message === 'mock fallback rename error');
      }
      // both the primary and the fallback temp files should be cleaned up
      const files = await fs.readdir(path.join(cacheDir, 'exdev-fail'));
      assert(files.length === 0);
      const tmpFiles = await fs.readdir(path.join(cacheDir, '.tmp'));
      assert(tmpFiles.length === 0);
    });

    it('should throw EXDEV when fallback disabled', async function() {
      const store = new DiskStore({
        cacheDir,
        fallback: false,
      });
      await store.ready();
      mockCrossDevice();
      try {
        await store.set('exdev-off', 'v');
        assert(false, 'should not run here');
      } catch (err) {
        assert(err.code === 'EXDEV');
      }
      // the primary temp file should still be cleaned up
      const files = await fs.readdir(path.join(cacheDir, '.tmp'));
      assert(files.length === 0);
    });
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
