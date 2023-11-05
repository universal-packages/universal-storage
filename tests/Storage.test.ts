import { Measurement } from '@universal-packages/time-measurer'
import fs from 'fs'
import sharp from 'sharp'

import { EngineInterface, LocalEngine, Storage } from '../src'

describe(Storage, (): void => {
  it('calls the set engine right methods', async (): Promise<void> => {
    const mockEngine: EngineInterface = {
      prepare: jest.fn(),
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
    await storage.prepare()
    await storage.retrieve(key)
    await storage.retrieveStream(key)
    await storage.retrieveUri(key)
    await storage.release()

    expect(key).toEqual(expect.any(String))

    expect(mockEngine.prepare).toHaveBeenCalled()
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
