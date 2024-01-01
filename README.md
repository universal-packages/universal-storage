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
> In testing environments the registry will use a memory engine to store blobs.

### Options

- **`engine`** `Engine` `default: local`
  Instance of the engine to be used to store the blobs.
- **`engineOptions`** `Object`
  Options to pass to the engine if resolved as adapter.

### Instance methods

#### **`prepare()`** **`async`**

Initialize the internal engine in case it needs preparation.

#### **`release()`** **`async`**

Releases the engine resources in case they need to be disposed before finishing the process.

#### **`generateKey(md5?: string)`**

Generates a new key using the provided md5 or a random one if not provided.

#### **`generateVersionKey(key: string, descriptor: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Generates the version key of a key using the provided descriptor.

#### **`parseVersionSlug(slug: string)`**

Gets the version descriptor from a version slug.

#### **`serializeVersionBlobDescriptor(descriptor: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Serializes a version blob descriptor into a version slug.

#### **`store(descriptor: Object, engineOptions?: Object)`**

#### **`store(key: string, descriptor: Object, engineOptions?: Object)`**

- **`descriptor`** `BlobDescriptor`
  - **`data`** `Buffer`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`md5`** `String`
  - **`size`** `Number`

Stores a blob under a newly generated key or by using a provided one, engine options can optionally be passed in case the engine needs configuration per blob.

#### **`storeVersion(key: string, descriptor: Object, engineOptions?: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Stores a new version of a, image blob by using a provided key, engine options can optionally be passed in case the engine needs configuration per blob.

#### **`retrieve(key: String)`**

Returns the blob stored under the provided key.

#### **`retrieveVersion(key: string, descriptor: Object, engineOptions?: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Retrieves a version blob if the version was stored previously for the given key and descriptor.

#### **`retrieveStream(key: String)`**

Returns a stream of the blob stored under the provided key.

#### **`retrieveVersionStream(key: string, descriptor: Object, engineOptions?: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Retrieves a version stream if the version was stored previously for the given key and descriptor.

#### **`retrieveUri(key: String, engineOptions?: Object)`**

Returns the uri of the blob stored under the provided key without retrieving the blob, engine options can optionally be passed in case the engine can generate a special uri.

#### **`retrieveVersionUri(key: string, descriptor: Object, engineOptions?: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Returns the uri of the version blob stored under the provided key and descriptor, without retrieving the blob, engine options can optionally be passed in case the engine can generate a special uri.

#### **`dispose(key: String)`**

Removes the blob stored under the provided key so it's no longer retrievable.

#### **`disposeVersion(key: string, descriptor: Object)`**

- **`descriptor`** `VersionBlobDescriptor`
  - **`name`** `String`
  - **`mimetype`** `String`
  - **`width`** `Number`
  - **`height`** `Number`
  - **`fit`** `contain | cover | fill | inside | outside`

Removes the version blob stored under the provided key and descriptor so it's no longer retrievable.

### Events

`Storage` will emit events regarding blob tasks

```js
storage.on('*', ({ event, key, engine, descriptor }) => console.log(event, key, engine, descriptor))
storage.on('store:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('store:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('store-version:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('store-version:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve:start', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve:finish', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-version:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve-version:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve-stream:start', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-stream:finish', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-version-stream:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve-version-stream:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve-uri:start', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-uri:finish', ({ key, engine }) => console.log(key, engine))
storage.on('retrieve-version-uri:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('retrieve-version-uri:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('dispose:start', ({ key, engine }) => console.log(key, engine))
storage.on('dispose:finish', ({ key, engine }) => console.log(key, engine))
storage.on('dispose-version:start', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
storage.on('dispose-version:finish', ({ key, engine, descriptor }) => console.log(key, engine, descriptor))
```

## Engine

To create an engine that suits your requirements you just need to implement a new class as the following:

```js
import MyEngine from './MyEngine'

const storage = new Storage({ engine: new MyEngine() })
```

```js
export default class MyEngine {
  constructor(options) {
    // Options passed through the adapters sub system
  }

  prepare() {
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

  disposeDirectory(key) {
    // dispose a directory of blobs (usually the versions directory)
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

#### Sharp

This project uses the Sharp library, which is licensed under the Apache License 2.0. Copyright 2013 Lovell Fuller and others.

The source code for the Sharp library can be found at https://github.com/lovell/sharp.
