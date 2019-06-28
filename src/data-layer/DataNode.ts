import _ from "lodash";
import { PluginManager } from "./";
import {
  IDataNode,
  IRequest,
  IPluginManager,
  IUINode,
  IPluginExecutionConfig,
  IDataEngine
} from "../../typings";
import { Request, DataEngine } from ".";

export default class DataNode implements IDataNode {
  private request: IRequest = new Request({});
  errorInfo: any = {};
  pluginManager: IPluginManager = new PluginManager(this);
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: string;
  rootData?: any;
  schema?: any;
  rootSchema?: any;
  data: any;
  updatingData?: any;

  constructor(source: any, uiNode: IUINode, request?: IRequest) {
    this.uiNode = uiNode;

    if (typeof source === "object") {
      this.data = source;
      this.rootData = source;
      this.source = "";
    } else {
      this.source = source;
    }

    // initial data engine
    if (request) {
      this.request = request;
    }
    this.dataEngine = new DataEngine(this.source, this.request);
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
    return this.dataEngine.mapper.rootSchema;
  }

  getRootData() {
    return this.rootData;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  async loadData(source?: string) {
    // const { schemaPath = "", name = "" } = this.source;
    if (!source && this.source) source = this.source;
    let result;
    if (source) {
      const data = await this.dataEngine.loadData(source);
      if (data === null) {
        this.errorInfo = this.dataEngine.errorInfo;
        return;
      }
      const exeConfig: IPluginExecutionConfig = {
        returnLastValue: true
      };
      this.schema = await this.pluginManager.executePlugins(
        "data.schema.parser",
        exeConfig
      );
      // get parent data to assign new data
      const nameSegs = source.split(".");
      nameSegs.pop();
      this.rootData = _.get(data, nameSegs.join("."));
      result = _.get(data, source.replace(":", "."), null);
      this.data = result;
    }

    return result;
  }

  async updateData(value: any, path?: string) {
    // check data from update plugins
    this.updatingData = value;
    const exeConfig: IPluginExecutionConfig = {
      stopWhenEmpty: true,
      returnLastValue: true
    };
    const couldUpdate = await this.pluginManager.executePlugins(
      "data.update.could",
      // when one validation got false value, break; the rest plugins execution
      exeConfig
    );

    if (couldUpdate.status === false) {
      this.errorInfo = couldUpdate;
      return false;
    }
    // update this data
    if (path) {
      _.set(this.data, path, value);
    } else {
      // const { name = "" } = this.source;
      this.data = value;
      const nameSegs = this.source.replace(":", ".").split(".");
      const lastName = nameSegs.pop();
      if (lastName) _.set(this.rootData, lastName, value);
      // console.log(lastName, value, this.rootData);
    }

    // console.log("Data Node:", this.uiNode.id, ":", this.data, "\n");
    await this.uiNode.updateLayout();
    this.updatingData = undefined;
    return true;
  }

  async deleteData(path?: any) {
    const couldDelete = await this.pluginManager.executePlugins(
      "data.delete.could"
    );
    if (couldDelete) {
      if (path !== undefined) {
        if ((_.isArray(path) || _.isNumber(path)) && _.isArray(this.data)) {
          _.remove(this.data, (e: any, index: number) => {
            return _.isArray(path) ? path.indexOf(index) > -1 : index === path;
          });
        } else {
          _.unset(this.data, path);
        }
      } else {
        this.data = null;
      }
      await this.uiNode.updateLayout();
    }
  }
}
