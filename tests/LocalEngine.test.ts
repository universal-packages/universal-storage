import fs from 'fs'
import sharp from 'sharp'

import { LocalEngine, Storage } from '../src'

describe(LocalEngine, (): void => {
  it('stores files', async (): Promise<void> => {
    const storage = new Storage({ engine: 'local', engineOptions: { location: './tmp' } })

    expect(storage).toMatchObject({ engine: expect.any(LocalEngine) })

    const subject = Buffer.from('Hola')
    const key = await storage.store({ data: subject })

    expect(await storage.retrieve(key)).toEqual(subject)
    expect(await storage.retrieveUri(key)).toMatch(new RegExp(`.*${key.substring(4)}`))

    const stream = await storage.retrieveStream<fs.ReadStream>(key)

    await new Promise((resolve): void => stream.close(resolve))

    await storage.dispose(key)

    let error: Error

    try {
      await storage.retrieveUri(key)
    } catch (err) {
      error = err
    }

    expect(error.message).toMatch(/".*" does not exist/)
  })

  it('stores images versions', async (): Promise<void> => {
    const storage = new Storage({ engine: 'local', engineOptions: { location: './tmp' } })

    const subject = fs.readFileSync('./tests/__fixtures__/test.128.png')

    const key = await storage.store({ data: subject })

    await storage.storeVersion(key, { width: 64, fit: 'cover' })
    await storage.storeVersion(key, { width: 32 })

    const versionUri = await storage.retrieveVersionUri(key, { width: 64, fit: 'cover' })

    expect(versionUri).toMatch(/.*\/v-64x~-cover/)

    let versionMetadata = await sharp(versionUri).metadata()

    expect(versionMetadata.width).toEqual(64)
    expect(versionMetadata.height).toEqual(64)

    const versionBlob = await storage.retrieveVersion(key, { width: 64, fit: 'cover' })
    versionMetadata = await sharp(versionBlob).metadata()

    expect(versionMetadata.width).toEqual(64)
    expect(versionMetadata.height).toEqual(64)

    const versionStream = await storage.retrieveVersionStream(key, { width: 64, fit: 'cover' })
    const versionStreamBlob = await new Promise((resolve): void => {
      const chunks: any[] = []

      versionStream.on('data', (chunk: any): any => chunks.push(chunk))
      versionStream.on('end', (): void => resolve(Buffer.concat(chunks)))
    })
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
