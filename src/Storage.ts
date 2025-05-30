import { resolveAdapter } from '@universal-packages/adapter-resolver'
import { generateToken } from '@universal-packages/crypto-utils'
import { EventEmitter } from '@universal-packages/event-emitter'
import { startMeasurement } from '@universal-packages/time-measurer'
import sharp, { FitEnum } from 'sharp'

import LocalEngine from './LocalEngine'
import { BlobDescriptor, EngineInterface, EngineInterfaceClass, StorageOptions, VersionBlobDescriptor } from './Storage.types'
import TestEngine from './TestEngine'

export default class Storage extends EventEmitter {
  public readonly options: StorageOptions
  public readonly engine: EngineInterface

  public constructor(options?: StorageOptions) {
    super()
    this.options = { engine: process.env.NODE_ENV === 'test' ? 'test' : 'local', ...options }
    this.engine = this.generateEngine()
  }

  public static generateKey(md5?: string): string {
    return generateToken({ seed: md5, format: 'base64url' })
  }

  public static generateVersionKey(key: string, descriptor: VersionBlobDescriptor): string {
    return `${this.getVersionsKey(key)}/${this.serializeVersionBlobDescriptor(descriptor)}`
  }

  public static parseVersionSlug(versionSlug: string): VersionBlobDescriptor {
    const slugParts = versionSlug.split('-')
    const width = slugParts[1].split('x')[0]
    const height = slugParts[1].split('x')[1]
    const fit = slugParts[2]

    return {
      width: width === '~' ? undefined : parseInt(width, 10),
      height: height === '~' ? undefined : parseInt(height, 10),
      fit: fit ? (fit as keyof FitEnum) : undefined
    }
  }

  public static serializeVersionBlobDescriptor(descriptor: VersionBlobDescriptor): string {
    const width = descriptor.width ? descriptor.width : '~'
    const height = descriptor.height ? descriptor.height : '~'
    const fit = descriptor.fit ? `-${descriptor.fit}` : ''

    return `v-${width}x${height}${fit}`
  }

  private static getVersionsKey(key: string): string {
    return `${key}-V`
  }

  public async prepare(): Promise<void> {
    if (this.engine.prepare) await this.engine.prepare()
  }

  public async release(): Promise<void> {
    if (this.engine.release) await this.engine.release()
  }

  public async store<O = Record<string, any>>(descriptor: BlobDescriptor, engineOptions?: O): Promise<string>
  public async store<O = Record<string, any>>(key: string, descriptor: BlobDescriptor, engineOptions?: O): Promise<string>
  public async store<O = Record<string, any>>(descriptorOrKey: BlobDescriptor | string, engineOptionsOrDescriptor?: O | BlobDescriptor, engineOptions?: O): Promise<string> {
    const measurer = startMeasurement()
    const finalKey = typeof descriptorOrKey === 'string' ? descriptorOrKey : Storage.generateKey(descriptorOrKey.md5)
    const finalDescriptor = typeof descriptorOrKey === 'string' ? (engineOptionsOrDescriptor as BlobDescriptor) : descriptorOrKey
    const finalEngineOptions = typeof descriptorOrKey === 'string' ? engineOptions : (engineOptionsOrDescriptor as O)

    this.emit('store:start', { payload: { key: finalKey, descriptor: finalDescriptor, engine: this.engine.constructor.name } })

    await this.engine.store(finalKey, finalDescriptor, finalEngineOptions)

    this.emit('store:finish', { measurement: measurer.finish(), payload: { key: finalKey, descriptor: finalDescriptor, engine: this.engine.constructor.name } })

    return finalKey
  }

  public async storeVersion<O = Record<string, any>>(key: string, descriptor: VersionBlobDescriptor, engineOptions?: O): Promise<void> {
    const measurer = startMeasurement()

    this.emit('store-version:start', { payload: { key, engine: this.engine.constructor.name, descriptor } })

    const originalBuffer = await this.engine.retrieve(key)
    const resized = await sharp(originalBuffer).rotate().resize(descriptor).toBuffer()
    const versionKey = Storage.generateVersionKey(key, descriptor)

    await this.engine.store(versionKey, { ...descriptor, data: resized }, engineOptions)

    this.emit('store-version:finish', { measurement: measurer.finish(), payload: { key, engine: this.engine.constructor.name, descriptor } })
  }

  public async retrieve(key: string): Promise<Buffer> {
    const measurer = startMeasurement()

    this.emit('retrieve:start', { payload: { key, engine: this.engine.constructor.name } })

    const buffer = await this.engine.retrieve(key)

    this.emit('retrieve:finish', { measurement: measurer.finish(), payload: { key, engine: this.engine.constructor.name } })

    return buffer
  }

  public async retrieveVersion(key: string, descriptor: VersionBlobDescriptor): Promise<Buffer> {
    const measurer = startMeasurement()

    this.emit('retrieve-version:start', { payload: { key, descriptor, engine: this.engine.constructor.name } })

    const versionKey = Storage.generateVersionKey(key, descriptor)
    const buffer = await this.engine.retrieve(versionKey)

    this.emit('retrieve-version:finish', { measurement: measurer.finish(), payload: { key, descriptor, engine: this.engine.constructor.name } })

    return buffer
  }

  public async retrieveStream<S = any>(key: string): Promise<S> {
    const measurer = startMeasurement()

    this.emit('retrieve-stream:start', { payload: { key, engine: this.engine.constructor.name } })

    const stream = await this.engine.retrieveStream(key)

    this.emit('retrieve-stream:finish', { measurement: measurer.finish(), payload: { key, engine: this.engine.constructor.name } })

    return stream
  }

  public async retrieveVersionStream<S = any>(key: string, descriptor: VersionBlobDescriptor): Promise<S> {
    const measurer = startMeasurement()

    this.emit('retrieve-version-stream:start', { payload: { key, descriptor, engine: this.engine.constructor.name } })

    const versionKey = Storage.generateVersionKey(key, descriptor)
    const stream = await this.engine.retrieveStream(versionKey)

    this.emit('retrieve-version-stream:finish', { measurement: measurer.finish(), payload: { key, descriptor, engine: this.engine.constructor.name } })

    return stream
  }

  public async retrieveUri<O = Record<string, any>>(key: string, engineOptions?: O): Promise<string> {
    const measurer = startMeasurement()

    this.emit('retrieve-uri:start', { payload: { key, engine: this.engine.constructor.name } })

    const uri = await this.engine.retrieveUri(key, engineOptions)

    this.emit('retrieve-uri:finish', { measurement: measurer.finish(), payload: { key, engine: this.engine.constructor.name } })

    return uri
  }

  public async retrieveVersionUri<O = Record<string, any>>(key: string, descriptor: VersionBlobDescriptor, engineOptions?: O): Promise<string> {
    const measurer = startMeasurement()

    this.emit('retrieve-version-uri:start', { payload: { key, descriptor, engine: this.engine.constructor.name } })

    const versionKey = Storage.generateVersionKey(key, descriptor)
    const uri = await this.engine.retrieveUri(versionKey, engineOptions)

    this.emit('retrieve-version-uri:finish', { measurement: measurer.finish(), payload: { key, descriptor, engine: this.engine.constructor.name } })

    return uri
  }

  public async dispose(key: string): Promise<void> {
    const measurer = startMeasurement()

    this.emit('dispose:start', { payload: { key, engine: this.engine.constructor.name } })

    const versionsKey = Storage.getVersionsKey(key)

    await this.engine.disposeDirectory(versionsKey)
    await this.engine.dispose(key)

    this.emit('dispose:finish', { measurement: measurer.finish(), payload: { key, engine: this.engine.constructor.name } })
  }

  public async disposeVersion(key: string, descriptor: VersionBlobDescriptor): Promise<void> {
    const measurer = startMeasurement()

    this.emit('dispose-version:start', { payload: { key, descriptor, engine: this.engine.constructor.name } })

    const versionKey = Storage.generateVersionKey(key, descriptor)
    await this.engine.dispose(versionKey)

    this.emit('dispose-version:finish', { measurement: measurer.finish(), payload: { key, descriptor, engine: this.engine.constructor.name } })
  }

  private generateEngine(): EngineInterface {
    if (typeof this.options.engine === 'string') {
      const AdapterModule = resolveAdapter<EngineInterfaceClass>({
        name: this.options.engine,
        domain: 'storage',
        type: 'engine',
        internal: { local: LocalEngine, test: TestEngine }
      })
      return new AdapterModule({ instance: this, ...this.options.engineOptions })
    } else {
      return this.options.engine
    }
  }
}
