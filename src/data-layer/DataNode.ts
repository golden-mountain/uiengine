import _ from "lodash";
import { PluginManager, DataPool, formatSource } from "../";
import {
  IDataNode,
  IRequest,
  IPluginManager,
  IUINode,
  IPluginExecutionConfig,
  IDataEngine,
  IDataPool,
  IDataSource,
  IErrorInfo
} from "../../typings";
import { DataEngine } from "../helpers";

export default class DataNode implements IDataNode {
  private request: IRequest = {} as IRequest;
  pluginManager: IPluginManager = new PluginManager(this);
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
      await this.uiNode.pluginManager.executePlugins("ui.parser");
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

    const exeConfig: IPluginExecutionConfig = {
      returnLastValue: true
    };

    let result = await this.pluginManager.executePlugins(
      "data.data.parser",
      exeConfig
    );

    if (result === undefined) {
      const mode = _.get(this.uiNode.workingMode, "mode");
      if (mode === "new" || !this.source.autoload) {
        await this.dataEngine.loadSchema(this.source);
        result = null;
      } else {
        let data = await this.dataEngine.loadData(this.source);
        let formattedSource = formatSource(this.source.source);
        result = _.get(data, formattedSource);
        this.data = result;
      }
    }

    // assign root schema if not $dummy data
    this.rootSchema = await this.dataEngine.mapper.getSchema(this.source);
    // load this node schema
    this.schema = await this.pluginManager.executePlugins(
      "data.schema.parser",
      exeConfig
    );
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
    // check data from update plugins
    const exeConfig: IPluginExecutionConfig = {
      stopWhenEmpty: true,
      returnLastValue: true
    };
    this.errorInfo = await this.pluginManager.executePlugins(
      "data.update.could",
      // when one validation got false value, break; the rest plugins execution
      exeConfig
    );

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

      if (insertHead) {
        currentValue.unshift(value);
      } else {
        currentValue.push(value);
      }
      status = await this.updateData(currentValue, "");
    }
    return status;
  }

  async deleteData(path?: any) {
    const exeConfig: IPluginExecutionConfig = {
      stopWhenEmpty: true,
      returnLastValue: true
    };
    this.errorInfo = await this.pluginManager.executePlugins(
      "data.delete.could",
      exeConfig
    );
    let noUpdateLayout = true;

    const status = _.get(this.errorInfo, "status", true);
    let data = this.data;
    if (status) {
      if (path !== undefined) {
        if ((_.isArray(path) || _.isNumber(path)) && _.isArray(this.data)) {
          if (this.uiNode.schema.$children) {
            noUpdateLayout = false;
          }

          _.remove(data, (e: any, index: number) => {
            return _.isArray(path) ? path.indexOf(index) > -1 : index === path;
          });
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
