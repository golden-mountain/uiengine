import _ from 'lodash'

import { Cache } from './Cache'
import { DataMapper } from './DataMapper'
import { PluginManager } from './PluginManager'
import { Request } from './Request'
import { getDomainName, getSchemaName } from './utils'

import {
  IDataEngine,
  IDataEngineConfig,
  IDataMapper,
  IDataSchema,
  IDataSource,
  IErrorInfo,
  ILoadDataOption,
  IOtherOperOption,
  IPluginManager,
  IPluginExecuteOption,
  IPluginResult,
  IRequest,
  IRequestConfig,
  ISendRequestOption,
} from '../../typings'

export class DataEngine implements IDataEngine {
  private static instance: DataEngine
  static getInstance = () => {
    if (_.isNil(DataEngine.instance)) {
      DataEngine.instance = new DataEngine()
    }
    return DataEngine.instance
  }

  private static pluginTypes: string[] = [
    'data.request.before',
    'data.request.after',
  ]
  static setPluginTypes = (types: string[]) => {
    if (_.isArray(types)) {
      DataEngine.pluginTypes = types.map((type: string) => {
        if (_.isString(type) && type) {
          return type
        } else {
          return undefined
        }
      }).filter((type?: string) => {
        return _.isString(type)
      }) as string[]
    }
  }

  readonly id: string = _.uniqueId('DataEngine-')
  mapper: IDataMapper = DataMapper.getInstance()
  pluginManager: IPluginManager = PluginManager.getInstance()
  request: IRequest = Request.getInstance()

  errorInfo?: IErrorInfo

  constructor(id?: string, config?: IDataEngineConfig) {

    if (_.isString(id) && id) {
      this.id = id
    }

    this.initializeConfig(config)

    this.pluginManager.register(
      this.id,
      { categories: DataEngine.pluginTypes }
    )
  }

  initializeConfig(config?: IDataEngineConfig) {
    if (_.isObject(config)) {
      const { mapper, pluginManager, request } = config
      if (!_.isNil(mapper)) {
        this.mapper = mapper
      }
      if (!_.isNil(pluginManager)) {
        this.pluginManager = pluginManager
        this.pluginManager.register(
          this.id,
          { categories: DataEngine.pluginTypes}
        )
      }
      if (!_.isNil(request)) {
        this.request = request
      }
    }
  }

  private getSchemaName(dataSource: IDataSource|string) {
    let lineage: string = ''
    if (_.isObject(dataSource)) {
      const { schema, source } = dataSource
      if (_.isString(schema) && schema) {
        lineage = schema
      } else if (_.isString(source) && source) {
        lineage = source
      }
    } else if (_.isString(dataSource)) {
      lineage = dataSource
    }

    return getSchemaName(lineage)
  }
  private getDomainSource(dataSource: IDataSource|string) {
    let lineage: string = ''
    if (_.isObject(dataSource)) {
      const { schema, source } = dataSource
      if (_.isString(schema) && schema) {
        lineage = schema
      } else if (_.isString(source) && source) {
        lineage = source
      }
    } else if (_.isString(dataSource)) {
      lineage = dataSource
    }

    return {
      source: `${getDomainName(lineage, false)}:`,
      schema: `${getDomainName(lineage, false)}:`,
    } as IDataSource
  }
  async loadSchema(source: IDataSource, options?: IOtherOperOption) {
    const schemaName = this.getSchemaName(source)
    let currentEngine: string | undefined
    if (_.isObject(options)) {
      const { engineId } = options
      if (_.isString(engineId) && engineId) {
        currentEngine = engineId
      }
    }

    let schema: IDataSchema | undefined
    try {
      const schemaCache: IDataSchema = Cache.getDataSchema(schemaName)
      if (!_.isObject(schemaCache)) {
        const { data } = await this.request.get(schemaName, { prefixType: 'dataSchema' }, currentEngine)
        if (_.isObject(data)) {
          schema = data as IDataSchema
        }
      }
    } catch (e) {
      this.errorInfo = {
        status: 1008,
        code: _.get(e, 'message', `Error happens when load schema ${schemaName}`)
      }
    }

    const domainSource = this.getDomainSource(source)
    if (_.isObject(schema)) {
      Cache.setDataSchema(schemaName, schema)
      this.mapper.setDataSchema(domainSource, _.cloneDeep(schema))
    } else {
      // prevent load too many times
      Cache.setDataSchema(schemaName, {})
      this.mapper.setDataSchema(domainSource, {} as IDataSchema)
      this.mapper.setDataSchema(source, {} as any)
    }

    return schema
  }

  async sendRequest(
    source: IDataSource,
    method: string,
    options?: ISendRequestOption,
  ) {
    this.errorInfo = undefined
    // the running parameters
    const RP: any = {}

    RP.sendMethod = _.lowerCase(method)
    if (!_.isFunction(this.request[RP.sendMethod])) {
      this.errorInfo = {
        status: 1001,
        code: `Current DataEngine didn't support request method '${method}'.`
      }
      return null
    }

    if (_.isNil(source) || !_.isObject(source)) {
      this.errorInfo = {
        status: 1002,
        code: `Can't send the request without a valid data source.`
      }
      return null
    } else {
      RP.dataSchema = this.mapper.getDataSchema(source, true)
      if (_.isNil(RP.dataSchema)) {
        RP.loadedSchema = await this.loadSchema(source, { engineId: _.get(options, 'engineId') })
        if (_.isNil(RP.loadedSchema)) {
          this.errorInfo = {
            status: 1003,
            code: `Can't find data schema for ${source.source}`
          }
          return null
        }
        RP.dataSchema = this.mapper.getDataSchema(source, true)
        if (_.isNil(RP.dataSchema)) {
          this.errorInfo = {
            status: 1003,
            code: `Can't find data schema for ${source.source}`
          }
          return null
        }
      }

      RP.endpoint = this.mapper.getEntryPoint(source, RP.sendMethod)
      if (!_.isString(RP.endpoint) || _.isEmpty(RP.endpoint)) {
        this.errorInfo = {
          status: 1004,
          code: `Can't find the endpoint of ${RP.sendMethod} in the schema of ${source.source}.`
        }
        return null
      }

      if (_.isObject(options)) {
        const { data, config, cacheID, engineId } = options
        if (!_.isNil(data)) {
          RP.requestPayload = _.cloneDeep(data)
        }
        if (!_.isNil(config)) {
          RP.requestConfig = config
        }
        if (_.isString(cacheID) && cacheID) {
          RP.responseID = cacheID
        }
        if (_.isString(engineId) && engineId) {
          RP.engineId = engineId
        }
      }

      try {
        if (_.isString(RP.responseID) && RP.responseID) {
          // use the cache data as response
          // Pay attention: the API of the source should always response the same data
          RP.responseData = Cache.getData(
            RP.responseID,
            { cacheKey: `${RP.sendMethod}:${RP.endpoint}` },
          )
        }

        // execute plugins to prepare for the request and return the status
        // the results of these plugins decide whether should stop the send
        const { results: beforeResults } = await this.pluginManager.executePlugins(
          this.id,
          'data.request.before',
          {
            dataEngine: this,
            request: this.request,
            source,
            method,
            options,
            RP,
          },
          {
            afterExecute: (plugin, param, result) => {
              if (!!result === false) { return { stop: true } }
              return {}
            }
          },
        )
        const couldSend = beforeResults.every((resultItem: IPluginResult) => {
          const allowSend = !!(resultItem.result)
          if (allowSend === false) {
            this.errorInfo = {
              status: 1005,
              code: `Plugin '${resultItem.name}' blocked the request.`
            }
          }
          return allowSend
        })
        if (couldSend === false) {
          return null
        }

        if (_.isNil(RP.responseData)) {
          switch (RP.sendMethod) {
            case 'get':
              RP.response = await this.request.get(RP.endpoint, RP.requestConfig, RP.engineId)
              break
            case 'delete':
              RP.response = await this.request.delete(RP.endpoint, RP.requestConfig, RP.engineId)
              break
            case 'post':
              RP.response = await this.request.post(RP.endpoint, RP.requestPayload, RP.requestConfig, RP.engineId)
              break
            case 'put':
              RP.response = await this.request.put(RP.endpoint, RP.requestPayload, RP.requestConfig, RP.engineId)
              break
            default:
              this.errorInfo = {
                status: 1006,
                code: `Can't solve the parameters for request method ${RP.sendMethod}`
              }
              return
          }
          if (_.isObject(RP.response)) {
            const { data } = RP.response
            if (!_.isNil(data)) {
              if (_.isString(RP.responseID) && RP.responseID) {
                // cache the response data with the ID
                // Pay attention: the API of the source should always response the same data
                Cache.setData(
                  RP.responseID,
                  data,
                  { cacheKey: `${RP.sendMethod}:${RP.endpoint}` },
                )
              }
              RP.responseData = data
            }
          }
        }

        // execute plugins to check the response or modify the result
        await this.pluginManager.executePlugins(
          this.id,
          'data.request.after',
          {
            dataEngine: this,
            request: this.request,
            source,
            method,
            options,
            RP,
          }
        )

      } catch (e) {
        this.errorInfo = {
          status: 1007,
          code: _.get(e, 'message', `Error happens when send request to ${RP.endpoint}`)
        }
        return null
      }
    }

    return RP.responseData
  }

  async loadData(source: IDataSource, options?: ILoadDataOption) {
    const requestOption: ISendRequestOption = {
      config: { prefixType: 'data' }
    }
    if (_.isObject(options)) {
      const { engineId, loadID } = options
      if (_.isString(engineId) && engineId) {
        requestOption.engineId = engineId
      }
      if (_.isString(loadID) && loadID) {
        requestOption.cacheID = loadID
      }
    }

    return await this.sendRequest(
      source,
      'get',
      requestOption,
    )
  }

  async updateData(source: IDataSource, data: any, options?: IOtherOperOption) {
    const requestOption: ISendRequestOption = {
      data,
      config: { prefixType: 'data' }
    }
    if (_.isObject(options)) {
      const { engineId } = options
      if (_.isString(engineId) && engineId) {
        requestOption.engineId = engineId
      }
    }

    return await this.sendRequest(
      source,
      'post',
      requestOption,
    )
  }

  async replaceData(source: IDataSource, data: any, options?: IOtherOperOption) {
    const requestOption: ISendRequestOption = {
      data,
      config: { prefixType: 'data' }
    }
    if (_.isObject(options)) {
      const { engineId } = options
      if (_.isString(engineId) && engineId) {
        requestOption.engineId = engineId
      }
    }

    return await this.sendRequest(
      source,
      'put',
      requestOption,
    )
  }

  async deleteData(source: IDataSource, options?: IOtherOperOption) {
    const requestOption: ISendRequestOption = {
      config: { prefixType: 'data' }
    }
    if (_.isObject(options)) {
      const { engineId } = options
      if (_.isString(engineId) && engineId) {
        requestOption.engineId = engineId
      }
    }

    return await this.sendRequest(
      source,
      'delete',
      requestOption,
    )
  }
}

export default DataEngine
