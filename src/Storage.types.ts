export interface StorageOptions {
  engine?: string | EngineInterface
  engineOptions?: Record<string, any>
}

export interface EngineInterface {
  initialize?: () => void | Promise<void>
  release?: () => void | Promise<void>
  store: <O = Record<string, any>>(token: string, descriptor: BlobDescriptor, engineOptions?: O) => void | Promise<void>
  retrieve: (token: string) => Buffer | Promise<Buffer>
  retrieveUri: (token: string) => string | Promise<string>
  dispose: (token: string) => void | Promise<void>
}

export interface EngineInterfaceClass {
  new (...args: any[]): EngineInterface
}

export interface BlobDescriptor {
  filename?: string
  mimetype?: string
  md5?: string
  size?: number
  data: Buffer
}
