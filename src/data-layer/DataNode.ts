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
  IDataSource
} from "../../typings";
import { DataEngine } from "../helpers";

export default class DataNode implements IDataNode {
  private request: IRequest = {} as IRequest;
  errorInfo: any = {
    status: undefined,
    code: ""
  };
  pluginManager: IPluginManager = new PluginManager(this);
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: IDataSource;
  schema?: any;
  rootSchema?: any;
  data: any;
  // cacheID: string = "";
  dataPool: IDataPool;

  constructor(
    source: IDataSource | string,
    uiNode: IUINode,
    request?: IRequest
  ) {
    this.uiNode = uiNode;
    this.source = this.setDataSource(source);

    // initial data engine
    if (request) {
      this.request = request;
    }

    // get id
    this.dataEngine = DataEngine.getInstance();
    this.dataEngine.setRequest(this.request);

    // get instance of data pool
    this.dataPool = DataPool.getInstance();
  }

  setDataSource(source: IDataSource | string) {
    if (_.isObject(source)) {
      this.data = source.defaultValue;
      this.source = source;
    } else {
      // give default data
      this.source = {
        source: source,
        autoload: true
      };
    }
    return this.source;
  }

  getErrorInfo() {
    return this.errorInfo;
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

  getRootSchema() {
    return this.rootSchema;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  async loadData(source?: IDataSource | string, schemaOnly: boolean = false) {
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

    if (result === undefined && this.source.source.indexOf("$dummy") === -1) {
      if (schemaOnly || !this.source.autoload) {
        await this.dataEngine.loadSchema(this.source.source);
        this.data = null;
      } else {
        let data = await this.dataEngine.loadData(this.source.source);
        if (data === null) {
          this.errorInfo = this.dataEngine.errorInfo;
          return;
        }
        let formattedSource = formatSource(this.source.source);
        result = _.get(data, formattedSource, null);

        //assign data and dataPool
        this.data = result;
        this.dataPool.set(result, this.source.source);
        // assign root schema
        this.rootSchema = this.dataEngine.mapper.rootSchema;
      }
    }

    // load this node schema
    this.schema = await this.pluginManager.executePlugins(
      "data.schema.parser",
      exeConfig
    );
    return this.data;
  }

  async updateData(value: any, path?: string) {
    let noUpdateLayout = true;
    if (_.isArray(value) && this.uiNode.schema.$children) {
      noUpdateLayout = _.isEqual(value, this.data);
    }

    // update this data
    if (path) {
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

    // update state without sending message
    if (noUpdateLayout) {
      await this.uiNode.pluginManager.executePlugins("ui.parser");
      await this.uiNode.stateNode.renewStates();
    } else {
      await this.uiNode.updateLayout();
    }

    const status = _.get(this.errorInfo, "status", true);
    if (status) {
      this.dataPool.set(this.data, this.source.source);
      this.dataPool.clearError(this.source.source);
    } else {
      this.dataPool.setError(this.source.source, this.errorInfo);
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
    if (status) {
      if (path !== undefined) {
        if ((_.isArray(path) || _.isNumber(path)) && _.isArray(this.data)) {
          if (this.uiNode.schema.$children) {
            noUpdateLayout = false;
          }

          _.remove(this.data, (e: any, index: number) => {
            return _.isArray(path) ? path.indexOf(index) > -1 : index === path;
          });
        } else {
          _.unset(this.data, path);
        }
      } else {
        this.data = null;
      }

      // not array, can't delete directly
      if (typeof this.data !== "object") {
        this.dataPool.set(this.data, this.source.source);
        this.dataPool.clearError(this.source.source);
      }
      // update state without sending message
      if (noUpdateLayout) {
        // for update props purpose
        await this.uiNode.pluginManager.executePlugins("ui.parser");
        await this.uiNode.stateNode.renewStates();
      } else {
        await this.uiNode.updateLayout();
      }
    } else {
      this.dataPool.setError(this.source.source, this.errorInfo);
    }
    return status;
  }

  // async submit(dataSources: Array<string>, method: string = "post") {
  //   let result = {};
  //   let responses: any = [];
  //   dataSources.forEach((source: string) => {
  //     result = _.merge(result, this.dataPool.get(source, true));
  //     result = this.dataEngine.sendRequest(source, result, method, false);
  //     responses.push(result);
  //   });

  //   responses = await Promise.all(responses);
  //   return responses;
  // }
}
