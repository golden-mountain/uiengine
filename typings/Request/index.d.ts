import { AxiosRequestConfig, AxiosResponse } from 'axios'

export interface IErrorInfo {
  status?: number
  code?: any
}

export interface IRequestConfig extends AxiosRequestConfig {
  devMode?: boolean
  pathPrefix?: string
  dataSchemaPrefix?: string
  mockDataPrefix?: string
  layoutSchemaPrefix?: string
  headers?: object
}

export interface IRequestSetConfigOption {
  id?: string
  clearIdBeforeSet?: boolean
}

export interface IRequestGetConfigOption {
  id?: string
  clearIdAfterGet?: boolean
  devMode?: boolean
}

export interface IRequest {
  setConfig: (config: IRequestConfig, options?: IRequestSetConfigOption) => void
  getConfig: (options?: IRequestGetConfigOption) => IRequestConfig
  get: (url: string, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
  delete: (url: string, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
  put: (url: string, data?: any, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
  post: (url: string, data?: any, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
}
