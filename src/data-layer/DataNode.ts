import _ from "lodash";
// import { Request } from ".";
// import { AxiosPromise } from "axios";
import { IDataNode, IDataSourceInfo } from "../../typings/DataNode";
import { Request, Cache } from ".";

export default class DataNode implements IDataNode {
  private errorInfo: any = {};
  private request: IRequest = new Request({});
  private schema?: any;
  private data: any;
  private source: IDataSourceInfo;

  constructor(source: any, request?: IRequest) {
    if (request) this.request = request;

    if (typeof source === "object") {
      this.data = source;
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

  getDataEntryPoint(method: string): string {
    const { name = "" } = this.source;
    let schema: any = Cache.getDataSchema(name);
    const defaultEndPoint = _.get(schema, `endpoint.default.path`, "");
    const endpoint = _.get(schema, `endpoint.${method}.path`, defaultEndPoint);
    const dataURLPrefix = this.request.getConfig("dataPathPrefix");
    return `${dataURLPrefix}${endpoint}`;
  }

  async loadData() {
    const { schemaPath } = this.source;
    if (schemaPath) {
      // if (DataNode.cache[schemaPath]) {
      //   this.data = _.get(DataNode.cache[schemaPath], name);
      // } else {
      this.schema = await this.loadSchema();
      // console.log(this.schema, "97");
      const endpoint = this.getDataEntryPoint("get");
      this.data = await this.loadRemoteData(endpoint);
      // }
    } else {
      this.schema = null;
      this.data = null;
    }
    return this.data;
  }

  async loadRemoteData(source: string) {
    let result: any = null;
    try {
      const { name = "" } = this.source;
      let data: any = Cache.getData(name);
      if (!data) {
        data = await this.request.get(source);
        if (data.data) {
          Cache.setData(name, data.data);
        }
      }

      result = _.get(data, `data.${name}`, null);
    } catch (e) {
      // console.error(e.message);
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
      const { name = "" } = this.source;
      let schema: any = Cache.getDataSchema(name);
      if (!schema) {
        const dataSchemaPath = this.request.getConfig("dataSchemaPrefix");
        const path = `${dataSchemaPath}${this.source.schemaPath}`;
        schema = await this.request.get(path);
        if (schema.data) {
          Cache.setDataSchema(name, schema.data);
        }
      }
      this.schema = _.get(schema, `data.definition.${name}`);
      return this.schema;
    } catch (e) {
      this.errorInfo.schema = {
        code: e.message
      };
    }
    this.data = result;
    return result;
  }
}
