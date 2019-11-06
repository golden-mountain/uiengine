import axios, { AxiosInstance } from 'axios'
import MockAdapter from 'axios-mock-adapter'
import _ from 'lodash'

import {
  IRequest,
  IRequestConfig,
  IRequestSetConfigOption,
  IRequestGetConfigOption,
} from '../../typings'

// Add a request interceptor
// axios.interceptors.request.use(
//   function(config) {
//     // Do something before request is sent
//     return config
//   },
//   function(error) {
//     // Do something with request error
//     return Promise.reject(error)
//   }
// )

// // Add a response interceptor
// axios.interceptors.response.use(
//   function(response) {
//     // Do something with response data
//     return response
//   },
//   function(error) {
//     // Do something with response error
//     return Promise.reject(error)
//   }
// )

axios.defaults.headers.common['Content-Type'] = 'application/json'

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
}

class RequestDevelop extends AbstractRequest {
  private mocker: MockAdapter

  constructor(config?: IRequestConfig) {
    super(config)

    this.mocker = new MockAdapter(this.axios)
  }

  private getConfigInfo(config?: IRequestConfig, configKey?: string) {
    const requestConfig = _.assign({}, this.defaultConfig, config)

    if (_.isString(configKey) && configKey) {
      return _.cloneDeep(requestConfig[configKey])
    } else {
      return _.cloneDeep(requestConfig)
    }
  }
  private mockResponse(method: string, url: string, data?: any, config?: IRequestConfig) {
    const pathPrefix: string = this.getConfigInfo(config, 'pathPrefix')

    let mockDataPath: string = url
    if (_.isString(pathPrefix) && pathPrefix) {
      if (_.startsWith(mockDataPath, '/')) {
        mockDataPath = `${pathPrefix}${mockDataPath}`
      } else {
        mockDataPath = `${pathPrefix}/${mockDataPath}`
      }
    }

    const mockData = require(mockDataPath)
    const mockMatcher = this.mocker[`on${_.upperFirst(method)}`]
    if (_.isFunction(mockMatcher)) {
      const mockHandler = mockMatcher(url, data)
      mockHandler.reply(200, mockData)
    } else {
      console.warn(`Can\'t mock the response for a ${_.upperCase(method)} request`)
    }
  }

  get(url: string, config?: IRequestConfig) {
    this.mockResponse('get', url, undefined, config)
    const realConfig: IRequestConfig = this.getConfigInfo(config)
    return this.axios.get(url, realConfig)
  }

  put(url: string, data?: any, config?: IRequestConfig) {
    this.mockResponse('put', url, data, config)
    const realConfig: IRequestConfig = this.getConfigInfo(config)
    return this.axios.put(url, data, realConfig)
  }

  post(url: string, data?: any, config?: IRequestConfig) {
    this.mockResponse('post', url, data, config)
    const realConfig: IRequestConfig = this.getConfigInfo(config)
    return this.axios.post(url, data, realConfig)
  }

  delete(url: string, config?: IRequestConfig) {
    this.mockResponse('delete', url, undefined, config)
    const realConfig: IRequestConfig = this.getConfigInfo(config)
    return this.axios.delete(url, realConfig)
  }
}

class RequestProduct extends AbstractRequest {
  get(url: string, config?: IRequestConfig) {
    const realConfig: IRequestConfig = _.assign({}, this.defaultConfig, config)
    return this.axios.get(url, realConfig)
  }

  put(url: string, data?: any, config?: IRequestConfig) {
    const realConfig: IRequestConfig = _.assign({}, this.defaultConfig, config)
    return this.axios.put(url, data, realConfig)
  }

  post(url: string, data?: any, config?: IRequestConfig) {
    const realConfig: IRequestConfig = _.assign({}, this.defaultConfig, config)
    return this.axios.post(url, data, realConfig)
  }

  delete(url: string, config?: IRequestConfig) {
    const realConfig: IRequestConfig = _.assign({}, this.defaultConfig, config)
    return this.axios.delete(url, realConfig)
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
