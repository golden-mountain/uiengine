import _ from "lodash";
import { PluginManager, DataPool, formatSource } from "../";
import {
  IDataNode,
  IRequest,
  IPluginManager,
  IUINode,
  IPluginExecutionConfig,
  IDataEngine,
  IDataPool
} from "../../typings";
import { Request, DataEngine } from ".";

export default class DataNode implements IDataNode {
  private request: IRequest = new Request({});
  errorInfo: any = {
    status: undefined,
    code: ""
  };
  pluginManager: IPluginManager = new PluginManager(this);
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: string;
  schema?: any;
  rootSchema?: any;
  data: any;
  // cacheID: string = "";
  dataPool: IDataPool;

  constructor(source: any, uiNode: IUINode, request?: IRequest) {
    this.uiNode = uiNode;

    if (_.isObject(source)) {
      this.data = source;
      this.source = "";
    } else {
      // give default data
      this.data = _.get(uiNode.schema, "defaultvalue");
      this.source = source;
      // this.cacheID = this.formatCacheID(source);
    }

    // initial data engine
    if (request) {
      this.request = request;
    }

    // get id
    this.dataEngine = new DataEngine(this.request);

    // get instance of data pool
    this.dataPool = DataPool.getInstance();
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

  async loadData(source?: string, schemaOnly: boolean = false) {
    // const { schemaPath = "", name = "" } = this.source;
    if (source) {
      this.source = source;
      // this.cacheID = this.formatCacheID(source);
    } else {
      source = this.source;
    }

    // let s = this.formatSource(source);
    let result; // = this.dataPool.get(s, false);

    // if (!result) {
    // let result = this.dataPool.get(s, false);
    if (schemaOnly) {
      await this.dataEngine.loadSchema(source);
      this.data = null;
    } else {
      let data = await this.dataEngine.loadData(source);
      if (data === null) {
        this.errorInfo = this.dataEngine.errorInfo;
        return;
      }
      let formattedSource = formatSource(source);
      result = _.get(data, formattedSource, null);
      this.data = result;
      this.dataPool.set(result, source);
    }

    // assign root schema
    this.rootSchema = this.dataEngine.mapper.rootSchema;

    // load this node schema
    const exeConfig: IPluginExecutionConfig = {
      returnLastValue: true
    };
    this.schema = await this.pluginManager.executePlugins(
      "data.schema.parser",
      exeConfig
    );
    // }

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
      this.dataPool.set(this.data, this.source);
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
        this.dataPool.set(this.data, this.source);
      }
      // update state without sending message
      if (noUpdateLayout) {
        // for update props purpose
        await this.uiNode.pluginManager.executePlugins("ui.parser");
        await this.uiNode.stateNode.renewStates();
      } else {
        await this.uiNode.updateLayout();
      }
    }
    return status;
  }

  async submit(
    dataSources: Array<string>,
    method: string = "post",
    connectWith?: string
  ) {
    const exeConfig: IPluginExecutionConfig = {
      stopWhenEmpty: true,
      returnLastValue: true
    };
    const couldSubmit = await this.uiNode.pluginManager.executePlugins(
      "data.submit.could",
      exeConfig
    );
    if (couldSubmit !== undefined && !couldSubmit.status) {
      return couldSubmit;
    }
    let result = {};
    let responses: any = [];
    dataSources.forEach((source: string) => {
      // const cacheID = this.formatCacheID(source);
      result = _.merge(result, this.dataPool.get(source, true));
      // remote?
      if (connectWith === undefined) {
        responses.push(
          this.dataEngine.sendRequest(source, result, method, false)
        );
      } else {
        this.dataPool.set(result, connectWith);
      }
    });

    if (connectWith === undefined) {
      responses = await Promise.all(responses);
      return responses;
    }
    return result;
  }
}
