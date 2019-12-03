import { AxiosRequestConfig, AxiosResponse } from 'axios'

import { IObject } from '../Common'

export interface IErrorInfo {
  status?: number
  code?: string
}

export interface IRequestConfig extends AxiosRequestConfig {
  devMode?: boolean
  prefixType?: 'dataSchema' | 'data' | 'uiSchema'
  dataSchemaPrefix?: string
  mockDataPrefix?: string
  realDataPrefix?: string
  uiSchemaPrefix?: string
  headers?: IObject
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
  injectInterceptor: (
    type: 'request' | 'response',
    onFulfilled?: RequestInterceptor | ResponseInterceptor,
    onRejected?: (error: any) => any,
    devMode?: boolean,
  ) => number | undefined
  ejectInterceptor: (
    type: 'request' | 'response',
    number: number,
    devMode?: boolean,
  ) => void

  setConfig: (config: IRequestConfig, options?: IRequestSetConfigOption) => void
  getConfig: (options?: IRequestGetConfigOption) => IRequestConfig
  get: (url: string, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
  delete: (url: string, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
  put: (url: string, data?: any, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
  post: (url: string, data?: any, config?: IRequestConfig, id?: string) => Promise<AxiosResponse<any>>
}
