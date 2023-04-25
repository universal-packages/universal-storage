import { Measurement } from '@universal-packages/time-measurer'
import fs from 'fs'
import { Storage, LocalEngine, EngineInterface } from '../src'

describe(Storage, (): void => {
  it('calls the set engine right methods', async (): Promise<void> => {
    const mockEngine: EngineInterface = {
      initialize: jest.fn(),
      release: jest.fn(),
      store: jest.fn(),
      retrieve: jest.fn(),
      retrieveStream: jest.fn(),
      retrieveUri: jest.fn(),
      dispose: jest.fn()
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

  it('uses the memory engine by default', async (): Promise<void> => {
    const storage = new Storage({ engineOptions: { storePath: './tmp' } })

    expect(storage).toMatchObject({ engine: expect.any(LocalEngine) })

    const subject = Buffer.from('Hola')
    const key = await storage.store({ data: subject })

    expect(await storage.retrieve(key)).toEqual(subject)
    expect(await storage.retrieveUri(key)).toMatch(new RegExp(`.*${key.substring(4)}`))

    const stream = await storage.retrieveStream<fs.ReadStream>(key)

    await new Promise((resolve): void => stream.close(resolve))

    await storage.dispose(key)

    expect(await storage.retrieveUri(key)).toBeUndefined()
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
