import _ from 'lodash'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import { Request } from '../Request'
import {
  IObject,
  IRequestConfig,
  IRequestGetConfigOption,
  IRequestSetConfigOption
} from '../../../typings'

import { any } from 'prop-types'
axios.defaults.headers.common['Content-Type'] = 'application/json'
type RequestInterceptor = (
  value: AxiosRequestConfig
) => AxiosRequestConfig | Promise<AxiosRequestConfig>
type ResponseInterceptor = (
  value: AxiosResponse
) => AxiosResponse | Promise<AxiosResponse>
const RequestObj: IObject = {
  injectInterceptor: any,
  ejectInterceptor: any,
  setConfig: any,
  getConfig: any,
  get: any,
  delete: any,
  put: any,
  post: any
}

RequestObj.injectInterceptor = (
  type: 'request' | 'response',
  onFulfilled?: RequestInterceptor | ResponseInterceptor,
  onRejected?: (error: any) => any,
  devMode?: boolean
) => {
  return Request.getInstance().injectInterceptor(
    type,
    onFulfilled,
    onRejected,
    devMode
  )
}

RequestObj.ejectInterceptor = (
  type: 'request' | 'response',
  number: number,
  devMode?: boolean
) => {
  return Request.getInstance().ejectInterceptor(type, number, devMode)
}

RequestObj.setConfig = (
  config: IRequestConfig,
  options?: IRequestSetConfigOption
) => {
  return Request.getInstance().setConfig(config, options)
}
RequestObj.getConfig = (options?: IRequestGetConfigOption) => {
  return Request.getInstance().getConfig(options)
}

RequestObj.get = (url: string, config?: IRequestConfig, id?: string) => {
  return Request.getInstance().get(url, config, id)
}
RequestObj.delete = (url: string, config?: IRequestConfig, id?: string) => {
  return Request.getInstance().delete(url, config, id)
}
RequestObj.put = (
  url: string,
  data?: any,
  config?: IRequestConfig,
  id?: string
) => {
  return Request.getInstance().put(url, data, config, id)
}
RequestObj.post = (
  url: string,
  data?: any,
  config?: IRequestConfig,
  id?: string
) => {
  return Request.getInstance().post(url, data, config, id)
}
export default RequestObj
