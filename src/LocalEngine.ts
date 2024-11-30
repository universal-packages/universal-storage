import { checkFile, ensureDirectory, expandPath } from '@universal-packages/fs-utils'
import fs from 'fs'
import path from 'path'

import { LocalEngineOptions } from './LocalEngine.types'
import { BlobDescriptor, EngineInterface } from './Storage.types'

export default class LocalEngine implements EngineInterface {
  public readonly options: LocalEngineOptions

  public constructor(options?: LocalEngineOptions) {
    this.options = { location: './storage', ...options }
  }

  public store<O = Record<string, any>>(key: string, descriptor: BlobDescriptor, _options?: O): void {
    ensureDirectory(this.getDirectoryPath(key))
    fs.writeFileSync(this.getFilePath(key), new Uint8Array(descriptor.data))
  }

  public retrieve(key: string): Buffer {
    return fs.readFileSync(checkFile(this.getFilePath(key)))
  }

  public retrieveUri(key: string): string {
    return checkFile(this.getFilePath(key))
  }

  public retrieveStream<S = any>(key: string): S {
    return fs.createReadStream(this.getFilePath(key)) as any
  }

  public dispose(key: string): void {
    fs.unlinkSync(checkFile(this.getFilePath(key)))
  }

  public disposeDirectory(key: string): void {
    try {
      fs.rmSync(this.getFilePath(key), { recursive: true })
    } catch (e) {}
  }

  private getDirectoryPath(key: string): string {
    const firstTwoChars = key.substring(0, 2)
    const nextTwoChars = key.substring(2, 4)
    const firstSections = key.substring(4).split('/').slice(0, -1).join('/')
    return expandPath(`${this.options.location}/${firstTwoChars}/${nextTwoChars}/${firstSections}`)
  }

  private getFilePath(key: string): string {
    const filename = key.substring(4).split('/').slice(-1)[0]
    return path.join(this.getDirectoryPath(key), filename)
  }
}
