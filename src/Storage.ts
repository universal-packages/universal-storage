import { resolveAdapter } from '@universal-packages/adapter-resolver'
import { generateToken } from '@universal-packages/crypto-utils'
import LocalEngine from './LocalEngine'
import { BlobDescriptor, EngineInterface, EngineInterfaceClass, StorageOptions } from './Storage.types'

export default class Storage {
  public readonly options: StorageOptions
  public readonly engine: EngineInterface

  public constructor(options?: StorageOptions) {
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
    const token = generateToken({ seed: descriptor.md5, format: 'base64url' })

    await this.engine.store(token, descriptor, engineOptions)

    return token
  }

  public async retrieve(token: string): Promise<Buffer> {
    return await this.engine.retrieve(token)
  }

  public async retrieveUri(token: string): Promise<string> {
    return await this.engine.retrieveUri(token)
  }

  public async dispose(token: string): Promise<void> {
    await this.engine.dispose(token)
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
