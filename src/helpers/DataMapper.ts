import _ from 'lodash'

import { PluginManager } from './PluginManager'
import { getDomainName } from './utils'

import {
  IDataMapper,
  IDataMap,
  IDataSchema,
  IDataNodeSchema,
  IDataSource,
  IErrorInfo,
  IPluginManager,
  IRequest,
} from '../../typings'

export class DataMapper implements IDataMapper {
  private static instance: DataMapper
  static getInstance = () => {
    if (_.isNil(DataMapper.instance)) {
      DataMapper.instance = new DataMapper()
    }
    return DataMapper.instance
  }

  // the plugin types which can be used in DataMapper
  private static pluginTypes: string[] = [
    'dataMapper.dataSchema.searchFromRoot'
  ]
  static setPluginTypes = (types: string[]) => {
    if (_.isArray(types)) {
      DataMapper.pluginTypes = types.map((type: string) => {
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

  readonly id: string = _.uniqueId('DataMapper-')
  pluginManager: IPluginManager = PluginManager.getInstance()

  dataMap: IDataMap = {
    dataSchema: {}
  }
  errorInfo?: IErrorInfo

  constructor(id?: string) {

    if (_.isString(id) && id) {
      this.id = id
    }

    this.pluginManager.register(
      this.id,
      { categories: DataMapper.pluginTypes }
    )
  }

  private getSchemaDomain(dataSource: IDataSource|string) {
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

    return getDomainName(lineage, false)
  }
  private getSchemaLineage(dataSource: IDataSource|string) {
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

    lineage = lineage
      .replace('#:', '.')
      .replace(':#', '.')
      .replace('#', '.')
      .replace(':', '.')

    return _.trim(lineage, '.')
  }

  setDataSchema(
    source: IDataSource,
    schema: IDataSchema | IDataNodeSchema,
  ) {
    const schemaLineage = this.getSchemaLineage(source)
    if (_.isString(schemaLineage) && schemaLineage) {
      this.dataMap.dataSchema[schemaLineage] = schema
    } else {
      console.warn(`Can't get valid schema lineage to store the data schema.`)
    }
  }

  getDataSchema(
    source: IDataSource,
    fromRoot?: boolean,
  ) {
    const dataSchemaMap = this.dataMap.dataSchema

    let schema
    const schemaLineage = this.getSchemaLineage(source)
    if (_.isString(schemaLineage) && schemaLineage) {
      schema = dataSchemaMap[schemaLineage]
    }

    if (_.isNil(schema) && fromRoot === true) {
      const domainLineage = this.getSchemaDomain(source)
      if (_.isString(domainLineage) && domainLineage) {
        const domainSchema = dataSchemaMap[domainLineage]

        const { results } = this.pluginManager.syncExecutePlugins(
          this.id,
          'dataMapper.dataSchema.searchFromRoot',
          { schema: domainSchema, lineage: schemaLineage }
        )
        if (_.isArray(results) && results.length) {
          const lastResult = results[results.length - 1]
          if (!_.isNil(lastResult.result)) {
            schema = lastResult.result
            dataSchemaMap[schemaLineage] = schema
          }
        }
      }
    }

    return schema
  }

  clearDataSchema(
    source?: IDataSource,
  ) {
    if (_.isNil(source)) {
      this.dataMap.dataSchema = {}
    } else {
      const dataSchemaMap = this.dataMap.dataSchema

      const schemaLineage = this.getSchemaLineage(source)
      delete dataSchemaMap[schemaLineage]
    }

  }

  getEntryPoint(
    source: IDataSource,
    method?: string,
  ) {
    const dataSchemaMap = this.dataMap.dataSchema

    let schema
    const schemaLineage = this.getSchemaLineage(source)
    if (_.isString(schemaLineage) && schemaLineage) {
      schema = dataSchemaMap[schemaLineage]
    }

    let endPoint
    if (_.isObject(schema) && _.has(schema, 'endpoints')) {
      const { endpoints } = schema as IDataSchema

      let defaultEndPoint: string | undefined
      const defaultConfig = _.get(endpoints, ['default'])
      if (_.isObject(defaultEndPoint)) {
        const { path } = defaultEndPoint
        if (_.isString(path) && path) {
          defaultEndPoint = path
        }
      } else if (_.isString(defaultConfig) && defaultConfig) {
        defaultEndPoint = defaultConfig
      }

      let methodEndPoint: string | undefined
      if (_.isString(method) && method) {
        const methodConfig = _.get(endpoints, [method])
        if (_.isObject(methodConfig)) {
          const { path } = methodConfig
          if (_.isString(path) && path) {
            methodEndPoint = path
          }
        } else if (_.isString(methodConfig) && methodConfig) {
          methodEndPoint = methodConfig
        }
      }

      endPoint = methodEndPoint || defaultEndPoint
    }
    return endPoint
  }
}

export default DataMapper
