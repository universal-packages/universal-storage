export interface StorageOptions {
  engine?: string | EngineInterface
  engineOptions?: Record<string, any>
}

export interface EngineInterface {
  initialize?: () => void | Promise<void>
  release?: () => void | Promise<void>
  store: (token: string, data: Buffer) => void | Promise<void>
  retrieve: (token: string) => Buffer | Promise<Buffer>
  retrieveUri: (token: string) => string | Promise<string>
  dispose: (token: string) => void | Promise<void>
}

export interface EngineInterfaceClass {
  new (...args: any[]): EngineInterface
}
