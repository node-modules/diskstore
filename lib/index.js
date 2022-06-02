'use strict';

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
      throw err;
    }
  }

  async delete(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    await fs.unlink(filepath);
  }
}

module.exports = DiskStore;
