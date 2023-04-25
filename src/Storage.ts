import { resolveAdapter } from '@universal-packages/adapter-resolver'
import { generateToken } from '@universal-packages/crypto-utils'
import { startMeasurement } from '@universal-packages/time-measurer'
import EventEmitter from 'events'
import LocalEngine from './LocalEngine'
import { BlobDescriptor, EngineInterface, EngineInterfaceClass, StorageOptions } from './Storage.types'

export default class Storage extends EventEmitter {
  public readonly options: StorageOptions
  public readonly engine: EngineInterface

  public constructor(options?: StorageOptions) {
    super()
    this.options = { engine: 'local', ...options }
    this.engine = this.generateEngine()
  }

  public async initialize(): Promise<void> {
    if (this.engine.initialize) await this.engine.initialize()
  }

  public async release(): Promise<void> {
    if (this.engine.release) await this.engine.release()
  }

  public async store<O = Record<string, any>>(descriptor: BlobDescriptor, engineOptions?: O): Promise<string> {
    const measurer = startMeasurement()
    const key = generateToken({ seed: descriptor.md5, format: 'base64url' })

    this.emit('store:start', { key, descriptor, engine: this.engine.constructor.name })
    this.emit('*', { event: 'store:start', key, descriptor, engine: this.engine.constructor.name })

    await this.engine.store(key, descriptor, engineOptions)

    this.emit('store:finish', { key, descriptor, engine: this.engine.constructor.name, measurement: measurer.finish() })
    this.emit('*', { event: 'store:finish', key, descriptor, engine: this.engine.constructor.name, measurement: measurer.finish() })

    return key
  }

  public async retrieve(key: string): Promise<Buffer> {
    const measurer = startMeasurement()

    this.emit('retrieve:start', { key, engine: this.engine.constructor.name })
    this.emit('*', { event: 'retrieve:start', key, engine: this.engine.constructor.name })

    const buffer = await this.engine.retrieve(key)

    this.emit('retrieve:finish', { key, engine: this.engine.constructor.name, measurement: measurer.finish() })
    this.emit('*', { event: 'retrieve:finish', key, engine: this.engine.constructor.name, measurement: measurer.finish() })

    return buffer
  }

  public async retrieveStream<S = any>(key: string): Promise<S> {
    const measurer = startMeasurement()

    this.emit('retrieve-stream:start', { key, engine: this.engine.constructor.name })
    this.emit('*', { event: 'retrieve-stream:start', key, engine: this.engine.constructor.name })

    const stream = await this.engine.retrieveStream(key)

    this.emit('retrieve-stream:finish', { key, engine: this.engine.constructor.name, measurement: measurer.finish() })
    this.emit('*', { event: 'retrieve-stream:finish', key, engine: this.engine.constructor.name, measurement: measurer.finish() })

    return stream
  }

  public async retrieveUri<O = Record<string, any>>(key: string, engineOptions?: O): Promise<string> {
    const measurer = startMeasurement()

    this.emit('retrieve-uri:start', { key, engine: this.engine.constructor.name })
    this.emit('*', { event: 'retrieve-uri:start', key, engine: this.engine.constructor.name })

    const uri = await this.engine.retrieveUri(key, engineOptions)

    this.emit('retrieve-uri:finish', { key, engine: this.engine.constructor.name, measurement: measurer.finish() })
    this.emit('*', { event: 'retrieve-uri:finish', key, engine: this.engine.constructor.name, measurement: measurer.finish() })

    return uri
  }

  public async dispose(key: string): Promise<void> {
    const measurer = startMeasurement()

    this.emit('dispose:start', { key, engine: this.engine.constructor.name })
    this.emit('*', { event: 'dispose:start', key, engine: this.engine.constructor.name })

    await this.engine.dispose(key)

    this.emit('dispose:finish', { key, engine: this.engine.constructor.name, measurement: measurer.finish() })
    this.emit('*', { event: 'dispose:finish', key, engine: this.engine.constructor.name, measurement: measurer.finish() })
  }

  private generateEngine(): EngineInterface {
    if (typeof this.options.engine === 'string') {
      const AdapterModule = resolveAdapter<EngineInterfaceClass>(this.options.engine, {
        domain: 'storage',
        type: 'engine',
        internal: { local: LocalEngine }
      })
      return new AdapterModule(this.options.engineOptions)
    } else {
      return this.options.engine
    }
  }
}
