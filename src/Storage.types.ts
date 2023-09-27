import { FitEnum } from 'sharp'

export interface StorageOptions {
  engine?: string | EngineInterface
  engineOptions?: Record<string, any>
  localHost?: string
}

export interface EngineInterface {
  prepare?: () => void | Promise<void>
  release?: () => void | Promise<void>
  store: <O = Record<string, any>>(key: string, descriptor: BlobDescriptor, engineOptions?: O) => void | Promise<void>
  retrieve: (key: string) => Buffer | Promise<Buffer>
  retrieveStream: <S = any>(key: string) => S | Promise<S>
  retrieveUri: <O = Record<string, any>>(key: string, engineOptions?: O) => string | Promise<string>
  dispose: (key: string) => void | Promise<void>
  disposeDirectory: (key: string) => void | Promise<void>
}

export interface EngineInterfaceClass {
  new (...args: any[]): EngineInterface
}

export interface BlobDescriptor {
  name?: string
  mimetype?: string
  md5?: string
  size?: number
  data: Buffer
}

export interface VersionDescriptor {
  width?: number
  height?: number
  fit?: keyof FitEnum
}
export interface VersionBlobDescriptor extends VersionDescriptor {
  name?: string
  mimetype?: string
}
