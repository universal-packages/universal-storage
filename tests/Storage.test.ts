import { Measurement } from '@universal-packages/time-measurer'
import fs from 'fs'
import { Storage, LocalEngine, EngineInterface } from '../src'
import sharp from 'sharp'

describe(Storage, (): void => {
  it('calls the set engine right methods', async (): Promise<void> => {
    const mockEngine: EngineInterface = {
      initialize: jest.fn(),
      release: jest.fn(),
      store: jest.fn(),
      retrieve: jest.fn(),
      retrieveStream: jest.fn(),
      retrieveUri: jest.fn(),
      dispose: jest.fn(),
      disposeDirectory: jest.fn()
    }

    const storage = new Storage({ engine: mockEngine })
    const listener = jest.fn()

    storage.on('*', listener)

    const key = await storage.store({ data: Buffer.from('Hola') })
    await storage.initialize()
    await storage.retrieve(key)
    await storage.retrieveStream(key)
    await storage.retrieveUri(key)
    await storage.release()

    expect(key).toEqual(expect.any(String))

    expect(mockEngine.initialize).toHaveBeenCalled()
    expect(mockEngine.store).toHaveBeenCalledWith(key, { data: Buffer.from('Hola') }, undefined)
    expect(mockEngine.retrieve).toHaveBeenCalledWith(key)
    expect(mockEngine.retrieveStream).toHaveBeenCalledWith(key)
    expect(mockEngine.retrieveUri).toHaveBeenCalledWith(key, undefined)
    expect(mockEngine.release).toHaveBeenCalled()
    expect(listener.mock.calls).toEqual([
      [{ event: 'store:start', key, descriptor: { data: Buffer.from('Hola') }, engine: 'Object' }],
      [{ event: 'store:finish', key, descriptor: { data: Buffer.from('Hola') }, engine: 'Object', measurement: expect.any(Measurement) }],
      [{ event: 'retrieve:start', key, engine: 'Object' }],
      [{ event: 'retrieve:finish', key, engine: 'Object', measurement: expect.any(Measurement) }],
      [{ event: 'retrieve-stream:start', key, engine: 'Object' }],
      [{ event: 'retrieve-stream:finish', key, engine: 'Object', measurement: expect.any(Measurement) }],
      [{ event: 'retrieve-uri:start', key, engine: 'Object' }],
      [{ event: 'retrieve-uri:finish', key, engine: 'Object', measurement: expect.any(Measurement) }]
    ])
  })

  it('uses the local engine by default', async (): Promise<void> => {
    const storage = new Storage({ engineOptions: { location: './tmp' } })

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

  it('creates versions of images by passing the key of an existing image', async (): Promise<void> => {
    const storage = new Storage({ engineOptions: { location: './tmp' } })

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

  it('Sets adapters from string', async (): Promise<void> => {
    const storage = new Storage({ engine: 'local' })

    expect(storage).toMatchObject({ engine: expect.any(LocalEngine) })
  })

  it('Sets adapters from objects', async (): Promise<void> => {
    const engine = new LocalEngine()
    const storage = new Storage({ engine })

    expect(storage).toMatchObject({ engine })
  })
})
