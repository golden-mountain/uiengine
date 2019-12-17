import _ from 'lodash'

import { DataEngine } from '../helpers/DataEngine'
import { DataPool } from '../helpers/DataPool'
import { PluginManager} from '../helpers/PluginManager'
import { Request } from '../helpers/Request'
import { getAccessRoute } from '../helpers/utils'

import {
  IDataEngine,
  IDataNode,
  IDataNodeConfig,
  IDataGetOption,
  IDataLoadOption,
  IDataUpdateOption,
  IDataDeleteOption,
  IDataPool,
  IDataPoolHandle,
  IDataSchema,
  IDataNodeSchema,
  IDataSource,
  IErrorInfo,
  IRequest,
  IPluginManager,
  IPluginExecuteOption,
  IPluginResult,
  IStateNode,
  IUINode,
  IWorkingMode,
  IOperationMode,
} from '../../typings'

export default class DataNode implements IDataNode {
  private static pluginTypes: string[] = [
    'data.data.parser',
    'data.data.picker',
    'data.update.could',
    'data.delete.could',
  ]
  static setPluginTypes = (types: string[]) => {
    if (_.isArray(types)) {
      DataNode.pluginTypes = types.map((type: string) => {
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

  readonly id: string = _.uniqueId('DataNode-')
  dataEngine: IDataEngine = DataEngine.getInstance()
  dataPool: IDataPool = DataPool.getInstance()
  pluginManager: IPluginManager = PluginManager.getInstance()
  request: IRequest = Request.getInstance()

  uiNode: IUINode
  source: IDataSource

  schema?: IDataSchema | IDataNodeSchema
  rootSchema?: IDataSchema

  private initialConfig(config?: IDataNodeConfig) {
    if (_.isObject(config)) {
      const { dataEngine, dataPool, pluginManager, request } = config
      if (!_.isNil(dataEngine)) {
        this.dataEngine = dataEngine
      }
      if (!_.isNil(dataPool)) {
        this.dataPool = dataPool
      }
      if (!_.isNil(pluginManager)) {
        this.pluginManager = pluginManager
      }
      if (!_.isNil(request)) {
        this.request = request
      }
    }
  }
  private initialSource(dataSrc: string|IDataSource) {
    if (_.isObject(dataSrc)) {
      const { source, schema, autoload, defaultValue, loadOptions } = dataSrc
      const initialSrc: IDataSource = {
        source,
        schema: _.isString(schema) && schema ? schema : source,
        autoload: _.isBoolean(autoload) ? autoload : true,
      }
      if (defaultValue !== undefined) {
        initialSrc.defaultValue = _.cloneDeep(defaultValue)
      }
      if (_.isObject(loadOptions)) {
        initialSrc.loadOptions = _.cloneDeep(loadOptions)
      }
      return initialSrc
    } else if (_.isString(dataSrc)) {
      return {
        source: dataSrc,
        schema: dataSrc,
        autoload: true,
      }
    }

    return {
      source: `$dummy.${this.id}`,
      schema: `$dummy.${this.id}`,
      autoload: true,
    }
  }
  constructor(uiNode: IUINode, source: string|IDataSource, config?: IDataNodeConfig) {
    const id = _.get(config, 'id')
    if (_.isString(id) && id) {
      this.id = id
    }

    this.uiNode = uiNode
    this.source = this.initialSource(source)

    // set the helpers which the node depends on
    this.initialConfig(config)

    if (this.source.defaultValue !== undefined) {
      this.data = this.source.defaultValue
    }

    // register the plugin types supported
    this.pluginManager.register(
      this.id,
      { categories: DataNode.pluginTypes }
    )
  }

  set data(value: any) {
    if (this.dataPool instanceof DataPool) {
      this.dataPool.set(this.source.source, value)
    } else {
      console.warn(`Can't set data of '${this.source.source}' to the unknown data pool:`, this.dataPool)
    }
  }

  get data() {
    if (this.dataPool instanceof DataPool) {
      return this.dataPool.get(this.source.source)
    } else {
      console.warn(`Can't get data of '${this.source.source}' from the unknown data pool:`, this.dataPool)
      return undefined
    }
  }

  set errorInfo(error: IErrorInfo|undefined) {
    if (this.dataPool instanceof DataPool) {
      this.dataPool.setInfo(this.source.source, { key: 'error', value: error })
    } else {
      console.warn(`Can't set error info of '${this.source.source}' to the unknown data pool:`, this.dataPool)
    }
  }

  get errorInfo() {
    if (this.dataPool instanceof DataPool) {
      return this.dataPool.getInfo(this.source.source, 'error')
    } else {
      console.warn(`Can't get error info of '${this.source.source}' from the unknown data pool:`, this.dataPool)
    }
  }

  async loadSchema(source?: string|IDataSource) {
    if (!_.isNil(source)) {
      this.source= this.initialSource(source)
    }

    this.rootSchema = await this.dataEngine.loadSchema(
      this.source,
      { engineId: this.uiNode.engineId },
    )
    // assign schema from the root
    this.schema = await this.dataEngine.mapper.getDataSchema(
      this.source,
      true,
    )
  }
  getSchema(path?: string) {
    if (_.isString(path) && path) {
      return _.cloneDeep(_.get(this.schema, path))
    }
    return _.cloneDeep(this.schema)
  }

  private async loadAndPick(options?: IDataLoadOption) {
    const loadID = _.get(options, 'loadID')
    const wholeData = await this.dataEngine.loadData(
      this.source,
      {
        engineId: this.uiNode.engineId,
        layoutKey: this.uiNode.layoutKey,
        loadID: !_.isNil(loadID) ? `${this.uiNode.layoutKey}-${loadID}` : this.uiNode.layoutKey
      },
    )

    // exec the plugins to pick the value from the loaded data
    // if any plugin returns value that is not undefined, the return value will be return as the data of the node
    let pickedData: any
    const { results } = await this.pluginManager.executePlugins(
      this.id,
      'data.data.picker',
      { data: wholeData, source: this.source }
    )
    if (_.isArray(results) && results.length) {
      results.some((resultItem: IPluginResult) => {
        const { result } = resultItem
        if (result !== undefined) {
          pickedData = result
          return true
        }
        return false
      })
    }

    if (_.isNil(pickedData)) {
      const route = getAccessRoute(this.source.source)
      pickedData = _.get(wholeData, route)
    }

    if (pickedData !== undefined) {
      this.data = pickedData
    } else {
      this.data = undefined
    }
  }
  private async refreshUI(holdLayout: boolean) {
    const uiNode = this.uiNode

    if (!_.isNil(uiNode)) {
      if (holdLayout) {
        // update props of uiNode
        await uiNode.parse()

        const stateNode = uiNode.stateNode
        if (!_.isNil(stateNode)) {
          // update state of stateNode
          await stateNode.renewStates()
        } else {
          console.warn(`No associated StateNode with ${this.id}`)
        }
      } else {
        await uiNode.refreshLayout()
      }
    } else {
      console.warn(`No associated UINode with ${this.id}`)
    }

    // sync state to data pool
    const stateNode: IStateNode = _.get(this.uiNode, ['stateNode'])
    if (!_.isNil(stateNode)) {
      stateNode.syncStateWithDataPool()
    }

  }
  private updateInfo(infoKey: string, handle: IDataPoolHandle) {
    if (infoKey === 'status') {
      const infoValue = handle.getInfo(infoKey)

      if (infoValue === 'view') {
        handle.setInfo(infoKey, 'update')
      }

      let parentHandle = handle.getParent()
      while (!_.isNil(parentHandle)) {
        const upperValue = parentHandle.getInfo(infoKey)

        if (!_.isNil(upperValue)) {
          if (upperValue === 'view') {
            parentHandle.setInfo(infoKey, 'update')
          }
          break
        } else {
          parentHandle = parentHandle.getParent()
          continue
        }
      }

      const children = handle.getChildren()
      if (!_.isNil(children)) {
        if (_.isArray(children)) {
          children.forEach((childHandle: IDataPoolHandle) => {
            const downValue = childHandle.getInfo(infoKey)

            if (downValue === 'view') {
              childHandle.setInfo(infoKey, 'update')
            }
          })
        } else if (_.isObject(children)) {
          _.forIn(children, (childHandle: IDataPoolHandle) => {
            const downValue = childHandle.getInfo(infoKey)

            if (downValue === 'view') {
              childHandle.setInfo(infoKey, 'update')
            }
          })
        }
      }
    }
  }

  getData(options?: IDataGetOption) {
    if (_.isObject(options)) {
      const { path } = options
      if (_.isString(path) && path) {
        return _.get(this.data, path)
      }
    }
    return this.data
  }
  async loadData(source?: string|IDataSource, options?: IDataLoadOption) {
    // load the dataSchema of the root
    await this.loadSchema(source)

    // get the working mode of the layout
    let workingMode: IWorkingMode = { mode: 'new' }
    const controller = _.get(this.uiNode, ['controller'])
    if (!_.isNil(controller)) {
      const wMode = controller.getWorkingMode(this.uiNode.layoutKey)
      if (!_.isNil(wMode)) {
        workingMode = wMode
      }
    }

    // exec the plugins to parse the data of the node
    // if any plugin returns value that is not undefined, the return value will be loaded as the data of the node
    let parsedResult: any
    const { results } = await this.pluginManager.executePlugins(
      this.id,
      'data.data.parser',
      { dataNode: this, workingMode }
    )
    if (_.isArray(results) && results.length) {
      results.some((resultItem: IPluginResult) => {
        const { result } = resultItem
        if (result !== undefined) {
          parsedResult = result
          return true
        }
        return false
      })
    }

    // get the load mode of data
    let loadMode: string = _.get(workingMode, 'mode')
    if (loadMode === 'customize') {
      const { operationModes } = workingMode
      if (_.isArray(operationModes)) {
        let matchString = ''
        operationModes.forEach((modeConfig: IOperationMode) => {
          const { source: srcString, mode: srcMode } = modeConfig
          if (_.startsWith(this.source.source, srcString)) {
            if (_.startsWith(srcString, matchString)) {
              matchString = srcString
              loadMode = srcMode
            }
          }
        })
      } else if (_.isObject(operationModes)) {
        const { source: srcString, mode: srcMode } = operationModes
        if (_.startsWith(this.source.source, srcString)) {
          loadMode = srcMode
        }
      }
    }

    const createCondition =
      loadMode === 'new' ||
      loadMode === 'create' ||
      loadMode === 'customize' ||
      !this.source.autoload

    const updateCondition =
      loadMode === 'edit' ||
      loadMode === 'view' ||
      loadMode === 'update' ||
      loadMode === 'delete'

    if (parsedResult !== undefined) {
      this.data = parsedResult
    } else {
      if (createCondition) {
        // do not need to load data
        this.data = undefined
      } else if (updateCondition) {
        // load remote data and pick from it
        await this.loadAndPick(options)
      }
    }

    // Todo: use a plugin to solve the status
    // initial data status
    const currentData = this.data
    if (_.isArray(currentData)) {
      currentData.forEach((item: any, index: number) => {
        const downSource = this.source.source + `[${index}]`
        const downStatus = this.dataPool.getInfo(downSource, 'status')

        if (createCondition) {
          if (downStatus !== 'create') {
            this.dataPool.setInfo(downSource, { key: 'status', value: 'create' })
          }
        } else if (updateCondition) {
          if (downStatus === 'create' || downStatus === undefined) {
            this.dataPool.setInfo(downSource, { key: "status", value: "view" })
          }
        }
      })
    } else if (_.isObject(currentData)) {
      const status = this.dataPool.getInfo(this.source.source, 'status')
      if (createCondition) {
        if (status !== 'create') {
          this.dataPool.setInfo(this.source.source, { key: 'status', value: 'create' })
        }
      } else if (updateCondition) {
        if (status === 'create' || status === undefined) {
          this.dataPool.setInfo(this.source.source, { key: "status", value: "view" })
        }
      }
    } else {
      const setDataInfo = (infoKey: string, handle: IDataPoolHandle) => {
        const parentHandle = handle.getParent();
        if (!_.isNil(parentHandle)) {
          const parentStatus = parentHandle.getInfo('status')
          if (createCondition) {
            if (parentStatus !== 'create') {
              parentHandle.setInfo('status', 'create')
            }
          } else if (updateCondition) {
            if (parentStatus === 'create' || parentStatus === undefined) {
              parentHandle.setInfo('status', "view")
            }
          }
        }
      }
      const status = this.dataPool.getInfo(this.source.source, 'status')
      if (createCondition) {
        if (status !== 'create') {
          this.dataPool.setInfo(
            this.source.source,
            { key: 'status', value: 'create', setDataInfo }
          )
        }
      } else if (updateCondition) {
        if (status === 'create' || status === undefined) {
          this.dataPool.setInfo(
            this.source.source,
            { key: "status", value: "view", setDataInfo }
          )
        }
      }
    }

    // sync state to data pool
    const stateNode: IStateNode = _.get(this.uiNode, ['stateNode'])
    if (!_.isNil(stateNode)) {
      stateNode.syncStateWithDataPool()
    }

    return currentData
  }
  async updateData(value: any, options?: IDataUpdateOption) {
    // set the value
    this.data = value

    // Todo: use a plugin to solve the status
    // update the status
    this.dataPool.setInfo(
      this.source.source,
      {
        key: 'status',
        setDataInfo: this.updateInfo
      }
    )

    // exec plugins to check the new value
    // each plugin can return an error info
    const { results } = await this.pluginManager.executePlugins(
      this.id,
      'data.update.could',
      { dataNode: this },
      {
        afterExecute: (plugin, param, result) => {
          if (!_.get(result, 'status')) {
            return { stop: true }
          }
          return {}
        }
      }
    )
    if (_.isArray(results)) {
      let hasError: boolean = false
      results.forEach((resultItem: IPluginResult) => {
        const { result } = resultItem
        if (!_.get(result, 'status')) {
          hasError = true
          this.errorInfo = result
        }
      })
      if (hasError === false) {
        this.errorInfo = {
          status: true,
        } as any
      }
    }

    const status = _.get(this.errorInfo, 'status', true)
    if (status) {
      this.dataPool.clearInfo(this.source.source, 'error')
    }

    let holdLayout: boolean = true
    if (_.isArray(value) && _.get(this.uiNode, ['schema', '$children']) !== undefined) {
      holdLayout = false
    }
    await this.refreshUI(holdLayout)

    return status
  }
  async deleteData(options?: IDataDeleteOption) {
    if (_.isObject(options)) {
      const { clearPool } = options

      if (clearPool === true) {
        this.dataPool.clear(this.source.source)
        return
      }
    }

    this.data = undefined
  }

  getRow(index: number) {

  }
  async createRow(value: any, insertIndex?: number) {
    let status: any = false
    const liveChildren = _.get(this.uiNode, ['schema', '$children'])
    if (liveChildren !== undefined) {
      const currentValue = _.isArray(this.data) ? this.data : []

      if (!_.isNil(insertIndex) && _.isFinite(insertIndex)) {
        currentValue.splice(insertIndex, 0, value)
      } else {
        currentValue.push(value)
      }
      status = await this.updateData(currentValue)

      if (!_.isNil(insertIndex) && _.isFinite(insertIndex)) {
        for (let i = currentValue.length - 1; i >= insertIndex; i--) {
          let oldSource = `${this.source.source}[${i - 1}]`
          const status = this.dataPool.getInfo(oldSource, 'status')
          if (status !== undefined) {
            let newSource = `${this.source.source}[${i}]`
            this.dataPool.setInfo(newSource, { key: 'status', value: status })
          }
        }
        let targetSource = `${this.source.source}[${insertIndex}]`
        this.dataPool.setInfo(targetSource, { key: 'status', value: 'create' })
      } else {
        let targetSource = `${this.source.source}[${currentValue.length - 1}]`
        this.dataPool.setInfo(targetSource, { key: 'status', value: 'create' })
      }
    }
    return status
  }
  async updateRow(value: any, updateIndex?: number) {

  }
  async deleteRow(index: number|number[], logically?: boolean) {
    const data = this.data

    if (!_.isArray(data)) {
      // not array, can't delete directly
      this.errorInfo = {
        status: 1000,
        code: `Couldn't delete a row from DataNode ${this.id} whose data is not an array.`
      }
      return false
    }

    // exec plugins to check whether could delete
    const { results } = await this.pluginManager.executePlugins(
      this.id,
      'data.delete.could',
      { dataNode: this },
      {
        afterExecute: (plugin, param, result) => {
          if (!_.get(result, 'status')) {
            return { stop: true }
          }
          return {}
        }
      }
    )
    if (_.isArray(results)) {
      let hasError: boolean = false
      results.forEach((resultItem: IPluginResult) => {
        const { result } = resultItem
        if (!_.get(result, 'status')) {
          hasError = true
          this.errorInfo = result
        }
      })
      if (hasError === false) {
        delete this.errorInfo
      }
    }

    const currentStatus = _.get(this.errorInfo, 'status', true)
    if (currentStatus) {
      // delete the row(s) logically by setting its status to 'delete'
      if (logically === true) {
        if (_.isArray(index)) {
          index.forEach((item: number) => {
            const targetSource = `${this.source.source}[${item}]`
            if (this.dataPool.getInfo(targetSource, 'status') !== 'delete') {
              this.dataPool.setInfo(targetSource, { key: 'status', value: 'delete' })
            }
          })
        } else if (_.isFinite(index)) {
          const targetSource = `${this.source.source}[${index}]`
          if (this.dataPool.getInfo(targetSource, 'status') !== 'delete') {
            this.dataPool.setInfo(targetSource, { key: 'status', value: 'delete' })
          }
        }
      } else {
        // delete the row(s) really
        if (_.isArray(index)) {
          index.filter((item: number) => {
            return _.isFinite(item)
          }).forEach((item: number) => {
            const targetSource = `${this.source.source}[${item}]`
            this.dataPool.clear(targetSource)
          })
        } else if (_.isFinite(index)) {
          const targetSource = `${this.source.source}[${index}]`
          this.dataPool.clear(targetSource)
        }
      }

      let holdLayout: boolean = true
      if (_.isArray(this.data) && _.get(this.uiNode, ['schema', '$children']) !== undefined) {
        holdLayout = false
      }
      await this.refreshUI(holdLayout)
    }
    return status
  }
}
