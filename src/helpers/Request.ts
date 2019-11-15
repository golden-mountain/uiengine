import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'
import MockAdapter from 'axios-mock-adapter'
import _ from 'lodash'

import {
  IRequest,
  IRequestConfig,
  IRequestSetConfigOption,
  IRequestGetConfigOption,
} from '../../typings'

axios.defaults.headers.common['Content-Type'] = 'application/json'

type RequestInterceptor = (
  value: AxiosRequestConfig,
) => AxiosRequestConfig | Promise<AxiosRequestConfig>
type ResponseInterceptor = (
  value: AxiosResponse,
) => AxiosResponse | Promise<AxiosResponse>

class AbstractRequest {
  protected axios: AxiosInstance
  defaultConfig: IRequestConfig

  constructor(config?: IRequestConfig) {
    this.axios = axios.create(config)

    if (!_.isNil(config)) {
      this.defaultConfig = _.assign({}, _.cloneDeep(config), this.axios.defaults)
    } else {
      this.defaultConfig = _.assign({}, this.axios.defaults)
    }
  }

  setDefaultConfig(config: IRequestConfig) {
    _.assign(this.defaultConfig, _.cloneDeep(config))
  }

  getDefaultConfig() {
    return _.cloneDeep(this.defaultConfig)
  }

  injectInterceptor(
    type: 'request' | 'response',
    onFulfilled?: RequestInterceptor | ResponseInterceptor,
    onRejected?: (error: any) => any,
  ) {
    if (type === 'request') {
      return this.axios.interceptors.request.use(
        onFulfilled as RequestInterceptor,
        onRejected,
      )
    } else if (type === 'response') {
      return this.axios.interceptors.response.use(
        onFulfilled as ResponseInterceptor,
        onRejected,
      )
    } else {
      console.warn(`Invalid interceptor type '${type}'`)
    }
  }
  ejectInterceptor(
    type: string,
    number: number,
  ) {
    if (type === 'request') {
      this.axios.interceptors.request.eject(number)
    } else if (type === 'response') {
      this.axios.interceptors.response.eject(number)
    } else {
      console.warn(`Invalid interceptor type '${type}'`)
    }
  }
}

class RequestDevelop extends AbstractRequest {
  private mocker: MockAdapter

  constructor(config?: IRequestConfig) {
    super(config)

    this.mocker = new MockAdapter(this.axios)
  }

  private addPrefix(url: string, prefix: string) {
    if (_.startsWith(url, '/')) {
      return `${_.trimEnd(prefix, '/')}${url}`
    } else {
      return `${_.trimEnd(prefix, '/')}/${url}`
    }
  }
  private customizePrefix(
    method: string,
    url: string,
    data: any,
    config: IRequestConfig,
  ) {
    const {
      prefixType,
      dataSchemaPrefix,
      mockDataPrefix,
      uiSchemaPrefix,
    } = config

    let prefix: string = ''
    switch (prefixType) {
      case 'dataSchema':
        if (_.isString(dataSchemaPrefix)) {
          prefix = dataSchemaPrefix
        }
        return this.addPrefix(url, prefix)
      case 'data':
        if (_.isString(mockDataPrefix)) {
          this.mockResponse(method, url, data, mockDataPrefix)
        }
        return url
      case 'uiSchema':
        if (_.isString(uiSchemaPrefix)) {
          prefix = uiSchemaPrefix
        }
        return this.addPrefix(url, prefix)
      default:
        return url
    }
  }
  private mockResponse(method: string, url: string, data: any, prefix: string) {
    const mockDataPath: string = this.addPrefix(url, prefix)
    const mockData = require(mockDataPath)

    const mockMatcher = this.mocker[`on${_.upperFirst(method)}`]
    if (_.isFunction(mockMatcher)) {
      const mockHandler = mockMatcher(url, data)
      mockHandler.reply(200, mockData)
    } else {
      console.warn(`Can\'t mock the response for a ${_.upperCase(method)} request`)
    }
  }
  private getRealConfig(config?: IRequestConfig) {
    return _.assign({}, this.defaultConfig, config)
  }

  get(url: string, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix('get', url, undefined, realConfig)
    return this.axios.get(realEndpoint, realConfig)
  }

  put(url: string, data?: any, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix('put', url, data, realConfig)
    return this.axios.put(realEndpoint, data, realConfig)
  }

  post(url: string, data?: any, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix('post', url, data, realConfig)
    return this.axios.post(realEndpoint, data, realConfig)
  }

  delete(url: string, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix('delelte', url, undefined, realConfig)
    return this.axios.delete(realEndpoint, realConfig)
  }
}

class RequestProduct extends AbstractRequest {
  private addPrefix(url: string, prefix: string) {
    if (_.startsWith(url, '/')) {
      return `${_.trimEnd(prefix, '/')}${url}`
    } else {
      return `${_.trimEnd(prefix, '/')}/${url}`
    }
  }
  private customizePrefix(url: string, config: IRequestConfig) {
    const {
      prefixType,
      dataSchemaPrefix,
      realDataPrefix,
      uiSchemaPrefix,
    } = config

    let prefix: string = ''
    switch (prefixType) {
      case 'dataSchema':
        if (_.isString(dataSchemaPrefix)) {
          prefix = dataSchemaPrefix
        }
        return this.addPrefix(url, prefix)
      case 'data':
        if (_.isString(realDataPrefix)) {
          prefix = realDataPrefix
        }
        return this.addPrefix(url, prefix)
      case 'uiSchema':
        if (_.isString(uiSchemaPrefix)) {
          prefix = uiSchemaPrefix
        }
        return this.addPrefix(url, prefix)
      default:
        return url
    }
  }
  private getRealConfig(config?: IRequestConfig) {
    return _.assign({}, this.defaultConfig, config)
  }
  get(url: string, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix(url, realConfig)
    return this.axios.get(realEndpoint, realConfig)
  }

  put(url: string, data?: any, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix(url, realConfig)
    return this.axios.put(realEndpoint, data, realConfig)
  }

  post(url: string, data?: any, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix(url, realConfig)
    return this.axios.post(realEndpoint, data, realConfig)
  }

  delete(url: string, config?: IRequestConfig) {
    const realConfig: IRequestConfig = this.getRealConfig(config)
    const realEndpoint: string = this.customizePrefix(url, realConfig)
    return this.axios.delete(realEndpoint, realConfig)
  }
}

export class Request implements IRequest {
  private static instance: Request
  static getInstance = () => {
    if (_.isNil(Request.instance)) {
      Request.instance = new Request()
    }
    return Request.instance
  }

  private requestDevelop: RequestDevelop = new RequestDevelop()
  private requestProduct: RequestProduct = new RequestProduct()
  developConfigs: {
    [id: string]: IRequestConfig
  } = {}
  productConfigs: {
    [id: string]: IRequestConfig
  } = {}

  setConfig(config: IRequestConfig, options?: IRequestSetConfigOption) {
    const isDevConfig: boolean = _.get(config, 'devMode', false)

    if (_.isObject(options)) {
      const { id, clearIdBeforeSet } = options

      if (_.isString(id) && id) {
        const configMap = isDevConfig ? this.developConfigs : this.productConfigs

        // if true, clear the prev config
        if (clearIdBeforeSet === true) {
          delete configMap[id]
        }

        // merge the new config
        configMap[id] = _.assign(
          {},
          configMap[id],
          _.cloneDeep(config),
        )

        // must return here
        return
      }
    }

    if (isDevConfig === true) {
      this.requestDevelop.setDefaultConfig(config)
    } else {
      this.requestProduct.setDefaultConfig(config)
    }
  }

  getConfig(options?: IRequestGetConfigOption) {
    let isDevMode: boolean = false

    if (_.isObject(options)) {
      const { id, clearIdAfterGet, devMode } = options
      if (_.isBoolean(devMode)) {
        isDevMode = devMode
      }

      if (_.isString(id) && id) {
        const configMap = isDevMode ? this.developConfigs : this.productConfigs

        // get the special config
        const config = configMap[id]

        // if true, clear the config
        if (clearIdAfterGet === true) {
          delete configMap[id]
          return config
        } else {
          return _.cloneDeep(config)
        }
      }
    }

    if (isDevMode) {
      return this.requestDevelop.getDefaultConfig()
    } else {
      return this.requestProduct.getDefaultConfig()
    }
  }

  get(url: string, config?: IRequestConfig, id?: string) {
    const isDevConfig: boolean = _.get(config, 'devMode', false)
    if (isDevConfig) {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.developConfigs[id] : undefined),
        config
      )

      return this.requestDevelop.get(url, realConfig)
    } else {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.productConfigs[id] : undefined),
        config
      )

      return this.requestProduct.get(url, realConfig)
    }
  }

  delete(url: string, config?: IRequestConfig, id?: string) {
    const isDevConfig: boolean = _.get(config, 'devMode', false)
    if (isDevConfig) {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.developConfigs[id] : undefined),
        config
      )

      return this.requestDevelop.delete(url, realConfig)
    } else {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.productConfigs[id] : undefined),
        config
      )

      return this.requestProduct.delete(url, realConfig)
    }
  }

  put(url: string, data?: any, config?: IRequestConfig, id?: string) {
    const isDevConfig: boolean = _.get(config, 'devMode', false)
    if (isDevConfig) {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.developConfigs[id] : undefined),
        config
      )

      return this.requestDevelop.put(url, data, realConfig)
    } else {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.productConfigs[id] : undefined),
        config
      )

      return this.requestProduct.put(url, data, realConfig)
    }
  }

  post(url: string, data?: any, config?: IRequestConfig, id?: string) {
    const isDevConfig: boolean = _.get(config, 'devMode', false)
    if (isDevConfig) {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.developConfigs[id] : undefined),
        config
      )

      return this.requestDevelop.post(url, data, realConfig)
    } else {
      const realConfig: IRequestConfig = _.assign(
        {},
        (_.isString(id) && id ? this.productConfigs[id] : undefined),
        config
      )

      return this.requestProduct.post(url, data, realConfig)
    }
  }
}

export default Request
