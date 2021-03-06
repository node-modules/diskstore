'use strict';

const fs = require('mz/fs');
const path = require('path');
const uuid = require('uuid/v4');
const Base = require('sdk-base');
const assert = require('assert');
const mkdirp = require('mz-modules/mkdirp');
const rimraf = require('mz-modules/rimraf');

class DiskStore extends Base {
  /**
   * disk store
   *
   * @constructor
   * @param {Object} options
   *   - {String} cacheDir - cache dir
   */
  constructor(options = {}) {
    assert(options.cacheDir, '[DiskStore] options.cacheDir is required');
    super(options);

    this.tmpdir = path.join(this.cacheDir, '.tmp');
    // make sure cache dir to be created
    mkdirp.sync(this.tmpdir);
    this.ready(true);
  }

  get cacheDir() {
    return this.options.cacheDir;
  }

  async get(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    const isExists = await fs.exists(filepath);
    if (!isExists) {
      return null;
    }
    return await fs.readFile(filepath);
  }

  async set(relativePath, data) {
    const filepath = path.join(this.cacheDir, relativePath);
    // make sure following operations are atomic
    const dir = path.dirname(filepath);
    const tmpfile = path.join(this.tmpdir, uuid());
    await Promise.all([
      mkdirp(dir),
      mkdirp(this.tmpdir),
    ]);

    await fs.writeFile(tmpfile, data);
    try {
      await fs.rename(tmpfile, filepath);
    } catch (err) {
      await rimraf(tmpfile);
      throw err;
    }
  }

  async delete(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    await fs.unlink(filepath);
  }
}

module.exports = DiskStore;
