# diskstore
a basic local cache implementation

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/diskstore.svg?style=flat-square
[npm-url]: https://npmjs.org/package/diskstore
[travis-image]: https://img.shields.io/travis/node-modules/diskstore.svg?style=flat-square
[travis-url]: https://travis-ci.org/node-modules/diskstore
[codecov-image]: https://codecov.io/gh/node-modules/diskstore/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/diskstore
[david-image]: https://img.shields.io/david/node-modules/diskstore.svg?style=flat-square
[david-url]: https://david-dm.org/node-modules/diskstore
[snyk-image]: https://snyk.io/test/npm/diskstore/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/diskstore
[download-image]: https://img.shields.io/npm/dm/diskstore.svg?style=flat-square
[download-url]: https://npmjs.org/package/diskstore

## Introduction

A basic file cache implementation. It just providers low-level APIs (get, set, delete) to allow you read & atomic write from file cache.  You can also create your implementation by inheriting or wrapping it.

## Install

```bash
$ npm install diskstore --save
```

## APIs

- `new DiskStore(options)`
  - {String} cacheDir - root cache dir
- `* get(relativePath)` read data from relativePath if the file exists.
  - {String} relativePath - file path relative to root cache dir
- `* set(relativePath, data)` write data to relativePath
  - {String} relativePath - file path relative to root cache dir
  - {Buffer|String} data - the data
- `* delete(relativePath)` delete the file
  - {String} relativePath - file path relative to root cache dir

## Usage

```js
const diskStore = new DiskStore({
  cacheDir: '/path/cache',
});

yield diskStore.set('a/b/c', 'c');
let data = yield diskStore.get('a/b/c');
assert.deepEqual(data, new Buffer('c'));

yield diskStore.delete('a/b/c');
data = yield diskStore.get('a/b/c');
assert(data === null);
```

## License

[MIT](LICENSE)
