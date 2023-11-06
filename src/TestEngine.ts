import crypto from 'crypto'
import { Readable } from 'stream'

import Storage from './Storage'
import { BlobDescriptor, EngineInterface } from './Storage.types'

interface TestEngineStorage {
  [key: string]: {
    descriptor: BlobDescriptor
    instance: Storage
    options?: any
  }
}

interface TestEngineOptions {
  instance: Storage
}
export default class TestEngine implements EngineInterface {
  public static readonly storage: TestEngineStorage = {}
  public static readonly disposedKeys: string[] = []

  public readonly instance: Storage

  public constructor(options: TestEngineOptions) {
    this.instance = options.instance
  }

  public store<O = Record<string, any>>(key: string, descriptor: BlobDescriptor, options?: O): void {
    const finalDescriptor = { ...descriptor }
    if (!descriptor.md5) finalDescriptor.md5 = crypto.createHash('md5').update(descriptor.data).digest('hex')
    TestEngine.storage[key] = { descriptor: finalDescriptor, instance: this.instance, options }
  }

  public retrieve(key: string): Buffer {
    return this.getData(key)
  }

  public retrieveUri(key: string): string {
    this.getData(key)
    return key
  }

  public retrieveStream<S = any>(key: string): S {
    return Readable.from(this.getData(key)) as S
  }

  public dispose(key: string): void {
    if (TestEngine.storage[key]) TestEngine.disposedKeys.push(key)
    delete TestEngine.storage[key]
  }

  public disposeDirectory(key: string): void {
    const keys = Object.keys(TestEngine.storage).filter((k) => k.startsWith(key))
    keys.forEach((k) => this.dispose(k))
  }

  private getData(key: string): Buffer {
    if (!TestEngine.storage[key]) throw new Error(`"${key}" does not exist`)

    return TestEngine.storage[key].descriptor.data
  }
}
