import _ from "lodash";
// import { Request } from ".";
import { AxiosPromise } from "axios";
import {
  IDataNode,
  IDataSource,
  IDataSchema,
  IDataSourceInfo
} from "../../typings/DataNode";
import { Request } from ".";

export default class DataNode implements IDataNode {
  static cache: IDataSource = {};
  static clearCache = () => {
    DataNode.cache = {};
  };

  private errorInfo: IErrorInfo = {};
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
      try {
        this.loadData();
      } catch (e) {
        console.log(e);
      }
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

  getErrorInfo() {
    return this.errorInfo;
  }

  getData(path?: string) {
    return path ? _.get(this.data, path, this.data) : this.data;
  }

  getSchema() {
    return this.schema;
  }

  getDataEntryPoint(method: string): string {
    const defaultEndPoint = _.get(this.schema, `endpoint.default.path`, "");
    const endpoint = _.get(
      this.schema,
      `endpoint.${method}.path`,
      defaultEndPoint
    );
    const dataURLPrefix = this.request.getConfig("dataPathPrefix");
    return `${dataURLPrefix}${endpoint}`;
  }

  loadData() {
    const { name = "", schemaPath } = this.source;
    if (schemaPath) {
      if (DataNode.cache[schemaPath]) {
        this.data = _.get(DataNode.cache[schemaPath], name);
      } else {
        this.schema = this.loadSchema().then((response: any) => {
          if (response.data) {
            const endpoint = this.getDataEntryPoint("get");
            this.data = this.loadRemoteData(endpoint);
          }
          return response;
        });
      }
    } else {
      this.data = null;
    }
    return this;
  }

  async loadRemoteData(source: string) {
    const { name = "", schemaPath = "deault" } = this.source;
    try {
      let response: any = await this.request.get(source);

      if (response.data) {
        this.data = _.get(response.data, name);
        DataNode.cache[schemaPath] = this.data;
      }

      return response;
    } catch (e) {
      this.errorInfo = {
        code: `Error loading from ${source}`
      };
      return null;
    }
  }

  async loadSchema() {
    if (this.schema) {
      return this.schema;
    }
    // const { schemaPath } = this.source;
    try {
      const dataSchemaPath = this.request.getConfig("dataSchemaPrefix");
      // console.log(this.source, "<<<<<<<<<<<<<<<<<");
      const path = `${dataSchemaPath}${this.source.schemaPath}`;
      // console.log(">>>>>>>>>>>>>>>>>>>>>>>", path);
      let response = await this.request.get(path);
      if (response.data) {
        this.schema = response.data;
      }
      return response;
    } catch (e) {
      return e;
    }
  }
}
