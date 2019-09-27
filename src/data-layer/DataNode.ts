import _ from "lodash";
import { PluginManager, DataPool, formatSource } from "../";
import {
  IDataNode,
  IRequest,
  IPluginManager,
  IUINode,
  IPluginExecuteOption,
  IDataEngine,
  IDataPool,
  IDataSource,
  IErrorInfo
} from "../../typings";
import { DataEngine } from "../helpers";

export default class DataNode implements IDataNode {
  id: string;
  pluginManager: IPluginManager;
  private request: IRequest = {} as IRequest;
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: IDataSource;
  schema?: any;
  rootSchema?: any;
  dataPool: IDataPool;

  constructor(
    source: IDataSource | string,
    uiNode: IUINode,
    request?: IRequest
  ) {
    this.id = _.uniqueId("DataNode-");
    this.pluginManager = PluginManager.getInstance();
    this.pluginManager.register(this.id, {
      categories: [
        "data.data.parser",
        "data.schema.parser",
        "data.update.could",
        "data.delete.could"
      ]
    });

    // get instance of data pool
    this.dataPool = DataPool.getInstance();

    this.uiNode = uiNode;
    this.source = this.setDataSource(source);

    // initial data engine
    if (request) {
      this.request = request;
    }

    // get id
    this.dataEngine = DataEngine.getInstance();
    this.dataEngine.setRequest(this.request);
  }

  private async refreshLayout(noUpdateLayout: boolean) {
    // update state without sending message
    if (noUpdateLayout) {
      await this.uiNode.pluginManager.executePlugins(
        this.uiNode.id,
        "ui.parser",
        { uiNode: this.uiNode }
      );
      await this.uiNode.stateNode.renewStates();
    } else {
      await this.uiNode.updateLayout();
    }
  }

  set data(value: any) {
    if (this.dataPool instanceof DataPool) {
      this.dataPool.set(value, this.source.source);
    }
  }

  get data() {
    if (this.dataPool instanceof DataPool) {
      return this.dataPool.get(this.source.source, false);
    }
  }

  set errorInfo(error: IErrorInfo) {
    if (this.dataPool instanceof DataPool) {
      this.dataPool.setError(this.source.source, error);
    }
  }

  get errorInfo() {
    if (this.dataPool instanceof DataPool) {
      return this.dataPool.getError(this.source.source);
    }
    return {};
  }

  setDataSource(source: IDataSource | string) {
    if (_.isObject(source)) {
      this.source = source;
      if (source.schema === undefined) this.source.schema = source.source;
      if (source.autoload === undefined) this.source.autoload = true;
      if (source.defaultValue !== undefined) this.data = source.defaultValue;
    } else {
      // give default data
      this.source = {
        source: source,
        schema: source,
        autoload: true
      };
    }
    return this.source;
  }

  getData(path?: string) {
    return path ? _.get(this.data, path, this.data) : this.data;
  }

  getSchema(path?: string) {
    if (path) {
      return _.get(this.schema, path);
    }
    return this.schema;
  }

  async loadData(source?: IDataSource | string) {
    if (source) {
      this.setDataSource(source);
    }

    const exeResult = await this.pluginManager.executePlugins(
      this.id,
      "data.data.parser",
      { dataNode: this }
    );
    let result = exeResult.results[0].result;

    if (result === undefined) {
      const mode = _.get(this.uiNode.workingMode, "mode");
      if (mode === "new" || !this.source.autoload) {
        await this.dataEngine.loadSchema(this.source);
        result = null;
      } else {
        let data = await this.dataEngine.loadData(this.source);
        let formattedSource = formatSource(this.source.source);
        result = _.get(data, formattedSource);
        if (result !== undefined) {
          this.data = result
        }
        if (_.isObject(data) && this.source.source.includes(':')) {
          const slices = this.source.source.split(':')
          if (_.isString(slices[1]) && slices[1].includes('[') && slices[1].includes(']')) {
            const i = slices[1].indexOf('[')
            const j = slices[1].indexOf(']')
            slices[1] = slices[1].slice(0, i) + '.' + slices[1].slice(i + 1, j) + slices[1].slice(j + 1)
          }
          let objLineage = slices[0] + ':' + slices[1].split('.').slice(0, -1).join('.')
          if (this.dataPool.getStatus(objLineage) === undefined) {
            this.dataPool.setStatus(objLineage, 'view')
          }
        }
      }
    }

    // assign root schema if not $dummy data
    this.rootSchema = await this.dataEngine.mapper.getSchema(this.source);
    // load this node schema
    const schemaResult = await this.pluginManager.executePlugins(
      this.id,
      "data.schema.parser",
      { dataNode: this }
    );
    if (schemaResult) {
      let schema = schemaResult.results[schemaResult.results.length - 1].result;
      if (schema) {
        this.schema = schema;
      }
    }
    return result;
  }

  async updateData(value: any, path?: string) {
    let noUpdateLayout = true;
    if (_.isArray(value) && this.uiNode.schema.$children) {
      noUpdateLayout = false;
    }

    // update this data
    if (path) {
      // let data = this.data;
      _.set(this.data, path, value);
    } else {
      this.data = value;
    }

    const slices = this.source.source.split(':')
    if (_.isString(slices[1]) && slices[1].includes('[') && slices[1].includes(']')) {
      const i = slices[1].indexOf('[')
      const j = slices[1].indexOf(']')
      slices[1] = slices[1].slice(0, i) + '.' + slices[1].slice(i + 1, j) + slices[1].slice(j + 1)
    }
    if (slices.length > 2) {
      let objLineage = slices[0] + ':' + slices[1].split('.').slice(0, -1).join('.')
      if (this.dataPool.getStatus(objLineage) === 'view') {
        this.dataPool.setStatus(objLineage, 'update')
      }
    }

    // check data from update plugins
    const exeConfig: IPluginExecuteOption = {
      afterExecute: (plugin, param, result) => {
        if (!_.get(result, "status")) {
          return { stop: true };
        }
        return {};
      }
    };
    const exeResult = await this.pluginManager.executePlugins(
      this.id,
      "data.update.could",
      { dataNode: this },
      exeConfig
    );
    if (exeResult) {
      exeResult.results.forEach(result => {
        if (!_.get(result.result, "status")) {
          this.errorInfo = result.result;
        }
      });
    }

    const status = _.get(this.errorInfo, "status", true);
    if (status) {
      // this.dataPool.set(this.data, this.source.source);
      this.dataPool.clearError(this.source.source);
    }

    await this.refreshLayout(noUpdateLayout);
    return status;
  }

  async createRow(value: any = {}, insertHead?: boolean) {
    let status: any = false;
    if (this.uiNode.schema.$children) {
      const currentValue = this.data || [];

      let index = currentValue.length
      if (insertHead) {
        index = 0
        currentValue.unshift(value);
      } else {
        currentValue.push(value);
      }
      status = await this.updateData(currentValue, "");

      if (index === currentValue.length - 1) {
        let lineage = this.source.source + '.' + index
        this.dataPool.setStatus(lineage, 'create')
      } else if (index === 0) {
        for (let i = currentValue.length - 1; i > 0; i--) {
          let oldLineage = this.source.source + '.' + (i - 1)
          const status = this.dataPool.getStatus(oldLineage)
          if (status !== undefined) {
            let newLineage = this.source.source + '.' + i
            this.dataPool.setStatus(newLineage, status)
          }
        }
        let lineage = this.source.source + '.0'
        this.dataPool.setStatus(lineage, 'create')
      }
    }
    return status;
  }

  async deleteData(path?: any) {
    const exeConfig: IPluginExecuteOption = {
      afterExecute: (plugin, param, result) => {
        if (!_.get(result, "status")) {
          return { stop: true };
        }
        return {};
      }
    };
    const exeResult = await this.pluginManager.executePlugins(
      this.id,
      "data.delete.could",
      { dataNode: this },
      exeConfig
    );
    if (exeResult) {
      exeResult.results.forEach(result => {
        if (!_.get(result.result, "status")) {
          this.errorInfo = result.result;
        }
      });
    }
    let noUpdateLayout = true;

    const status = _.get(this.errorInfo, "status", true);
    let data = this.data;
    if (status) {
      if (path !== undefined) {
        if ((_.isArray(path) || _.isNumber(path)) && _.isArray(this.data)) {
          if (this.uiNode.schema.$children) {
            noUpdateLayout = false;
          }

          let objLineage = this.source.source + '.' + path
          if (this.dataPool.getStatus(objLineage) !== 'delete') {
            this.dataPool.setStatus(objLineage, 'delete')
          }

          // _.remove(data, (e: any, index: number) => {
          //   return _.isArray(path) ? path.indexOf(index) > -1 : index === path;
          // });

        } else {
          _.unset(data, path);
        }
      } else {
        this.data = null;
      }

      // not array, can't delete directly
      if (typeof this.data !== "object") {
        // this.dataPool.set(this.data, this.source.source);
        this.dataPool.clearError(this.source.source);
      }
      // update state without sending message
      await this.refreshLayout(noUpdateLayout);
    }
    return status;
  }
}
