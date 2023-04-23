import { checkFile, ensureDirectory } from '@universal-packages/fs-utils'
import fs from 'fs'
import { LocalEngineOptions } from './LocalEngine.types'
import { EngineInterface } from './Storage.types'

export default class LocalEngine implements EngineInterface {
  public readonly options: LocalEngineOptions

  public constructor(options?: LocalEngineOptions) {
    this.options = { storePath: './storage', ...options }
  }

  public store(token: string, data: Buffer): void {
    ensureDirectory(this.getDirectoryPath(token))
    fs.writeFileSync(this.getFilePath(token), data)
  }

  public retrieve(token: string): Buffer {
    let filePath = this.getFilePath(token)

    try {
      filePath = checkFile(filePath)
    } catch {
      return undefined
    }

    return fs.readFileSync(filePath)
  }

  public retrieveUri(token: string): string {
    try {
      return checkFile(this.getFilePath(token))
    } catch {
      return undefined
    }
  }

  public dispose(token: string): void {
    let filePath = this.getFilePath(token)

    try {
      filePath = checkFile(filePath)
    } catch {
      return
    }

    fs.unlinkSync(filePath)
  }

  private getDirectoryPath(token: string): string {
    const firstTwoChars = token.substring(0, 2)
    const nextTwoChars = token.substring(2, 4)
    return `${this.options.storePath}/${firstTwoChars}/${nextTwoChars}`
  }

  private getFilePath(token: string): string {
    const fileName = token.substring(4)
    return `${this.getDirectoryPath(token)}/${fileName}`
  }
}
