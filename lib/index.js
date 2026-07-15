const assert = require('assert');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs/promises');
const Base = require('sdk-base');

class DiskStore extends Base {
  /**
   * disk store
   *
   * @param {Object} options
   *  - {String} cacheDir - cache dir
   *  - {Boolean} [fallback=true] - on cross-device rename (EXDEV), retry via the target's own dir
   *  - {String} [fallbackTmpfileName] - temp file name used by the fallback, defaults to a random
   *    one. A fixed name is only safe when concurrent writes to the same directory cannot happen.
   */
  constructor(options = {}) {
    assert(options.cacheDir, '[DiskStore] options.cacheDir is required');
    super(options);
    this.tmpdir = path.join(this.cacheDir, '.tmp');
    this.ready(true);
  }

  get cacheDir() {
    return this.options.cacheDir;
  }

  // on by default, only off when explicitly set to false
  get fallback() {
    return this.options.fallback !== false;
  }

  get fallbackTmpfileName() {
    return this.options.fallbackTmpfileName;
  }

  async get(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    try {
      await fs.access(filepath);
    } catch {
      return null;
    }
    return await fs.readFile(filepath);
  }

  async set(relativePath, data) {
    const filepath = path.join(this.cacheDir, relativePath);
    // make sure following operations are atomic
    const dir = path.dirname(filepath);
    const tmpfile = path.join(this.tmpdir, crypto.randomUUID());
    await Promise.all([
      fs.mkdir(dir, { recursive: true }),
      fs.mkdir(this.tmpdir, { recursive: true }),
    ]);

    await fs.writeFile(tmpfile, data);
    try {
      await fs.rename(tmpfile, filepath);
    } catch (err) {
      await fs.rm(tmpfile, { force: true });
      // rename across filesystems throws EXDEV, retry via the target's own dir
      if (err.code === 'EXDEV' && this.fallback) {
        await this._renameWithFallback(dir, filepath, data);
        return;
      }
      throw err;
    }
  }

  // write a temp file in the target's own dir then rename, so it stays on one
  // filesystem and keeps the atomic replace
  async _renameWithFallback(dir, filepath, data) {
    const fallbackTmpfile = path.join(
      dir,
      this.fallbackTmpfileName || `.${path.basename(filepath)}.${crypto.randomUUID()}.tmp`
    );
    try {
      await fs.writeFile(fallbackTmpfile, data);
      await fs.rename(fallbackTmpfile, filepath);
    } catch (err) {
      await fs.rm(fallbackTmpfile, { force: true });
      throw err;
    }
  }

  async delete(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    await fs.unlink(filepath);
  }
}

module.exports = DiskStore;
