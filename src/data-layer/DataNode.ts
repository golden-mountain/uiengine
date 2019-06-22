import _ from "lodash";
import { PluginManager } from "./";
// import { Request } from ".";
// import { AxiosPromise } from "axios";
import {
  IDataNode,
  IDataSourceInfo,
  IRequest,
  IRequestConfig,
  IPluginManager
} from "../../typings";
import { Request, Cache } from ".";

export default class DataNode implements IDataNode {
  private errorInfo: any = {};
  private request: IRequest = new Request({});
  private schema?: any;
  private data: any;
  private source: IDataSourceInfo;
  private rootSchema?: any;
  private rootData?: any;
  private pluginManager: IPluginManager = new PluginManager(this);

  constructor(source: any, request?: IRequest) {
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

  getSchema() {
    return this.schema;
  }

  getRootSchema() {
    return this.rootSchema;
  }

  getRootData() {
    return this.rootData;
  }

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
    } else {
      this.schema = null;
      this.data = null;
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
      this.rootData = data;
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
      this.rootSchema = schema;
      result = _.get(schema, `definition.${name}`);
    } catch (e) {
      this.errorInfo.schema = {
        code: e.message
      };
    }
    this.schema = result;
    return result;
  }
}
