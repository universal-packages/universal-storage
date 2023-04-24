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

    const token = await storage.store({ data: Buffer.from('Hola') })
    storage.initialize()
    storage.retrieve(token)
    storage.retrieveStream(token)
    storage.retrieveUri(token)
    storage.release()

    expect(token).toEqual(expect.any(String))

    expect(mockEngine.initialize).toHaveBeenCalled()
    expect(mockEngine.store).toHaveBeenCalledWith(token, { data: Buffer.from('Hola') }, undefined)
    expect(mockEngine.retrieve).toHaveBeenCalledWith(token)
    expect(mockEngine.retrieveStream).toHaveBeenCalledWith(token)
    expect(mockEngine.retrieveUri).toHaveBeenCalledWith(token)
    expect(mockEngine.release).toHaveBeenCalled()
  })

  it('uses the memory engine by default', async (): Promise<void> => {
    const storage = new Storage({ engineOptions: { storePath: './tmp' } })

    expect(storage).toMatchObject({ engine: expect.any(LocalEngine) })

    const subject = Buffer.from('Hola')
    const token = await storage.store({ data: subject })

    expect(await storage.retrieve(token)).toEqual(subject)
    expect(storage.retrieveUri(token)).toMatch(new RegExp(`.*${token.substring(4)}`))

    const stream = await storage.retrieveStream<fs.ReadStream>(token)

    await new Promise((resolve): void => stream.close(resolve))

    await storage.dispose(token)

    expect(storage.retrieveUri(token)).toBeUndefined()
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
