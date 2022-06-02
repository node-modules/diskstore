# diskstore
a basic local cache implementation

[![NPM version][npm-image]][npm-url]
[![Node.js CI](https://github.com/node-modules/diskstore/actions/workflows/nodejs.yml/badge.svg)](https://github.com/node-modules/diskstore/actions/workflows/nodejs.yml)
[![Test coverage][codecov-image]][codecov-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/diskstore.svg?style=flat-square
[npm-url]: https://npmjs.org/package/diskstore
[codecov-image]: https://codecov.io/gh/node-modules/diskstore/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/node-modules/diskstore
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
- `async get(relativePath)` read data from relativePath if the file exists.
  - {String} relativePath - file path relative to root cache dir
- `async set(relativePath, data)` write data to relativePath
  - {String} relativePath - file path relative to root cache dir
  - {Buffer|String} data - the data
- `async delete(relativePath)` delete the file
  - {String} relativePath - file path relative to root cache dir

## Usage

```js
const diskStore = new DiskStore({
  cacheDir: '/path/cache',
});

await diskStore.set('a/b/c', 'c');
let data = await diskStore.get('a/b/c');
assert.deepEqual(data, Buffer.from('c'));

await diskStore.delete('a/b/c');
data = await diskStore.get('a/b/c');
assert(data === null);
```

## License

[MIT](LICENSE)
<!-- GITCONTRIBUTOR_START -->

## Contributors

|[<img src="https://avatars.githubusercontent.com/u/546535?v=4" width="100px;"/><br/><sub><b>leoner</b></sub>](https://github.com/leoner)<br/>|[<img src="https://avatars.githubusercontent.com/u/1207064?v=4" width="100px;"/><br/><sub><b>gxcsoccer</b></sub>](https://github.com/gxcsoccer)<br/>|
| :---: | :---: |


This project follows the git-contributor [spec](https://github.com/xudafeng/git-contributor), auto updated at `Thu Jun 02 2022 15:11:24 GMT+0800`.

<!-- GITCONTRIBUTOR_END -->