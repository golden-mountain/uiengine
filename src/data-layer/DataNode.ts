import _ from "lodash";
import { PluginManager } from "./";
import * as dataPlugins from "../plugins/data";
import {
  IDataNode,
  IDataSourceInfo,
  IRequest,
  IPluginManager,
  IUINode
} from "../../typings";
import { Request, Cache } from ".";

export default class DataNode implements IDataNode {
  private errorInfo: any = {};
  private request: IRequest = new Request({});
  private source: IDataSourceInfo;
  private pluginManager: IPluginManager = new PluginManager(this);
  private uiNode: IUINode;
  private rootData?: any;
  schema?: any;
  data: any;
  updatingData?: any;

  constructor(
    source: any,
    uiNode: IUINode,
    request?: IRequest,
    loadDefaultPlugins: boolean = true
  ) {
    this.uiNode = uiNode;

    if (request) {
      this.request = request;
    }

    if (typeof source === "object") {
      this.data = source;
      this.rootData = source;
      this.source = {};
    } else {
      this.source = this.getSchemaInfo(source);
    }

    if (loadDefaultPlugins) {
      this.pluginManager.loadPlugins(dataPlugins);
    }
  }

  getSchemaInfo(source: string) {
    let [schemaPath, name] = source.split(":");
    // no  ":"
    if (!name) {
      name = schemaPath;
      const firstDotPos = schemaPath.indexOf(".");
      schemaPath = schemaPath.substr(
        0,
        firstDotPos !== -1 ? firstDotPos : schemaPath.length
      );
    }

    if (name.indexOf(schemaPath) === -1) {
      name = source.replace(":", ".");
    }
    return { name, schemaPath: `${schemaPath}.json` };
  }

  getSource() {
    return this.source;
  }

  getErrorInfo(type?: string) {
    if (type) {
      return this.errorInfo[type];
    }
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

  // getRootSchema() {
  //   return this.rootSchema;
  // }

  // getRootData() {
  //   return this.rootData;
  // }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  getDataEntryPoint(method: string): string {
    const { schemaPath = "" } = this.source;
    let schema: any = Cache.getDataSchema(schemaPath);
    const defaultEndPoint = _.get(schema, `endpoint.default.path`, "");
    const endpoint = _.get(schema, `endpoint.${method}.path`, defaultEndPoint);
    const dataURLPrefix = this.request.getConfig("dataPathPrefix");
    return `${dataURLPrefix}${endpoint}`;
  }

  async loadData() {
    const { schemaPath } = this.source;
    if (schemaPath) {
      this.schema = await this.loadSchema();
      const endpoint = this.getDataEntryPoint("get");
      this.data = await this.loadRemoteData(endpoint);
    }

    return this.data;
  }

  async loadRemoteData(source: string) {
    let result: any = null;
    try {
      const { schemaPath = "", name = "" } = this.source;
      let data: any = Cache.getData(schemaPath);
      if (!data) {
        data = await this.request.get(source);
        if (data.data) {
          Cache.setData(schemaPath, data.data);
          data = data.data;
        }
      }

      // get parent data to assign new data
      const nameSegs = name.split(".");
      nameSegs.pop();
      this.rootData = _.get(data, nameSegs.join("."));
      result = _.get(data, name, null);
    } catch (e) {
      this.errorInfo.data = {
        code: e.message
      };
    }
    this.data = result;
    return result;
  }

  async loadSchema() {
    let result: any = null;
    try {
      const { name = "", schemaPath = "" } = this.source;
      let schema: any = Cache.getDataSchema(schemaPath);
      if (!schema) {
        const dataSchemaPath = this.request.getConfig("dataSchemaPrefix");
        const path = `${dataSchemaPath}${this.source.schemaPath}`;
        schema = await this.request.get(path);
        if (schema.data) {
          Cache.setDataSchema(schemaPath, schema.data);
          schema = schema.data;
        }
      }
      // this.rootSchema = schema;
      result = _.get(schema, `definition.${name}`);
    } catch (e) {
      this.errorInfo.schema = {
        code: e.message
      };
    }
    this.schema = result;
    return result;
  }

  async updateData(value: any, path?: string) {
    // check data from update plugins
    this.updatingData = value;
    const couldUpdate = await this.pluginManager.executePlugins(
      "data.update.could"
    );
    // update this data
    if (couldUpdate) {
      if (path) {
        _.set(this.data, path, value);
      } else {
        const { name = "" } = this.source;
        this.data = value;
        const nameSegs = name.split(".");
        const lastName = nameSegs.pop();
        if (lastName) _.set(this.rootData, lastName, value);
        // console.log(lastName, value, this.rootData);
      }

      await this.uiNode.updateLayout();
      this.updatingData = undefined;
    }
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
