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

  * get(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    const isExists = yield fs.exists(filepath);
    if (!isExists) {
      return null;
    }
    return yield fs.readFile(filepath);
  }

  * set(relativePath, data) {
    const filepath = path.join(this.cacheDir, relativePath);
    // make sure following operations are atomic
    const dir = path.dirname(filepath);
    const tmpfile = path.join(this.tmpdir, uuid());
    yield [
      mkdirp(dir),
      mkdirp(this.tmpdir),
    ];

    yield fs.writeFile(tmpfile, data);
    try {
      yield fs.rename(tmpfile, filepath);
    } catch (err) {
      yield rimraf(tmpfile);
      throw err;
    }
  }

  * delete(relativePath) {
    const filepath = path.join(this.cacheDir, relativePath);
    yield fs.unlink(filepath);
  }
}

module.exports = DiskStore;
