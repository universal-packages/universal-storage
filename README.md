# Storage

[![npm version](https://badge.fury.io/js/@universal-packages%2Fstorage.svg)](https://www.npmjs.com/package/@universal-packages/storage)
[![Testing](https://github.com/universal-packages/universal-storage/actions/workflows/testing.yml/badge.svg)](https://github.com/universal-packages/universal-storage/actions/workflows/testing.yml)
[![codecov](https://codecov.io/gh/universal-packages/universal-storage/branch/main/graph/badge.svg?key=CXPJSN8IGL)](https://codecov.io/gh/universal-packages/universal-storage)

Simple storage organizer.

## Install

```shell
npm install @universal-packages/storage
```

## Storage

`Storage` is the main class interface to start storing blobs of data under a key.

```js
import { Storage } from '@universal-packages/storage'

const storage = new Storage()

const key = await storage.storage({ data: new Buffer('example') })

const myBlob = await storage.retrieve(key)

console.log(myData)

// > <Buffer example>
```

> By default a registry uses a local engine to store blobs, this is suitable for most cases but you can also use a custom engine to store the data in a database or any other storage system.

### Options

- **`engine`** `Engine` `default: local`
  Instance of the engine to be used to store the blobs.
- **`engineOptions`** `Object`
  Options to pass to the engine if resolved as adapter.

### Instance methods

#### **`store(descriptor: BlobDescriptor, engineOptions?: Object)`**

- **`descriptor`** `BlobDescriptor`
  - **`data`** `Buffer`
  - **`filename`** `String`
  - **`mimetype`** `String`
  - **`md5`** `String`
  - **`size`** `Number`

Stores a blob under a newly generated key and returns that new key, engine options can optionally be passed in case the engine needs configuration per blob.

#### **`initialize()`** **`async`**

Initialize the internal engine in case it needs preparation.

#### **`release()`** **`async`**

Releases the engine resources in case they need to be disposed before finishing the process.

#### **`retrieve(key: String)`**

Returns the blob stored under the provided key.

#### **`retrieveStream(key: String)`**

Returns a stream of the blob stored under the provided key.

#### **`retrieveUri(key: String, engineOptions?: Object)`**

Returns the uri of the blob stored under the provided key without retrieving the blob, engine options can optionally be passed in case the engine can generate a special uri.

#### **`dispose(key: String)`**

Removes the blob stored under the provided key so it's no longer retrievable.

### Events

`Storage` will emit events regarding blob tasks

```js
storage.on('*', ({ event, key, engine, descriptor }) => console.log(event, key, engine, descriptor))
storage.on('store:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('store:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve:start', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve:finish', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-stream:start', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-stream:finish', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-uri:start', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-uri:finish', ({ key, engine }) => console.log(key, engine))
```

## Engine

To create an engine that suits your requirements you just need to implement a new class as the following:

```js
import MyEngine from './MyEngine'

const storage = new Storage({ engine: new MyEngine() })
```

```js
export default class MyEngine implements EngineInterface {
  constructor(options) {
    // Options passed through the adapters sub system
  }

  initialize() {
    // Initialize any connection using options
  }

  release() {
    // Release any resources or close any connection
  }

  store(key, data) {
    // Store the blob using the key as key
  }

  retrieve(key) {
    return // retrieve the subject from your engine using the key
  }

  dispose(key) {
    // dispose the blob from your engine using the key
  }
}
```

### Engine Interface

If you are using TypeScript just can implement the `EngineInterface` to ensure the right implementation.

```ts
import { EngineInterface } from '@universal-packages/storage'

export default class MyEngine implements EngineInterface {}
```

## Typescript

This library is developed in TypeScript and shipped fully typed.

## Contributing

The development of this library happens in the open on GitHub, and we are grateful to the community for contributing bugfixes and improvements. Read below to learn how you can take part in improving this library.

- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Contributing Guide](./CONTRIBUTING.md)

### License

[MIT licensed](./LICENSE).
