import fs from 'fs'
import sharp from 'sharp'
import { Readable } from 'stream'

import { Storage, TestEngine } from '../src'

beforeAll((): void => {
  const storageKeys = Object.keys(TestEngine.storage)

  for (const key of storageKeys) {
    delete TestEngine.storage[key]
  }
})

describe(TestEngine, (): void => {
  it('stores files', async (): Promise<void> => {
    const storage = new Storage()

    expect(storage).toMatchObject({ engine: expect.any(TestEngine) })

    const subject = Buffer.from('Hola')
    const key = await storage.store({ data: subject })

    expect(await storage.retrieve(key)).toEqual(subject)
    expect(await storage.retrieveUri(key)).toMatch(key)
    expect(TestEngine.storage[key]).toEqual({
      descriptor: {
        md5: 'f688ae26e9cfa3ba6235477831d5122e',
        data: subject
      },
      instance: storage
    })

    const stream = await storage.retrieveStream<Readable>(key)

    expect(stream.read()).toEqual(subject)

    await storage.dispose(key)

    expect(TestEngine.storage[key]).toBeUndefined()
    expect(TestEngine.disposedKeys).toEqual([key])

    let error: Error

    try {
      await storage.retrieveUri(key)
    } catch (err) {
      error = err
    }

    expect(error.message).toMatch(/".*" does not exist/)
  })

  it('stores images versions', async (): Promise<void> => {
    const storage = new Storage()

    const subject = fs.readFileSync('./tests/__fixtures__/test.128.png')

    const key = await storage.store({ data: subject })

    await storage.storeVersion(key, { width: 64, fit: 'cover' })
    await storage.storeVersion(key, { width: 32 })

    const versionUri = await storage.retrieveVersionUri(key, { width: 64, fit: 'cover' })

    expect(versionUri).toMatch(/.*\/v-64x~-cover/)

    const versionBlob = await storage.retrieveVersion(key, { width: 64, fit: 'cover' })
    let versionMetadata = await sharp(versionBlob).metadata()

    expect(versionMetadata.width).toEqual(64)
    expect(versionMetadata.height).toEqual(64)

    const versionStream = await storage.retrieveVersionStream(key, { width: 64, fit: 'cover' })
    const versionStreamBlob = versionStream.read()
    versionMetadata = await sharp(versionStreamBlob).metadata()

    expect(versionMetadata.width).toEqual(64)
    expect(versionMetadata.height).toEqual(64)

    await storage.disposeVersion(key, { width: 64, fit: 'cover' })

    let error: Error

    try {
      await storage.retrieveVersionUri(key, { width: 64, fit: 'cover' })
    } catch (err) {
      error = err
    }

    expect(error.message).toMatch(/".*" does not exist/)

    await storage.dispose(key)

    try {
      await storage.retrieveVersion(key, { width: 32 })
    } catch (err) {
      error = err
    }

    expect(error.message).toMatch(/".*" does not exist/)
  })
})
