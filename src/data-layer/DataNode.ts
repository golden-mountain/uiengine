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

  private errorInfo: IErrorInfo = {};
  private request: IRequest = new Request({});
  private schema?: any;
  private data: any;
  private source: IDataSourceInfo;

  constructor(source: any, request?: IRequest) {
    if (request) this.request = request;

    if (typeof source === "object") {
      this.source = source;
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
      schemaPath = "";
    }

    if (name.indexOf(schemaPath) === -1) {
      name = source.replace(":", ".");
    }
    return { name, schemaPath: `${schemaPath}.json` };
  }

  getData(path?: string) {
    return path ? _.get(this.data, path, this.data) : this.data;
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
    const { name, schemaPath } = this.source;
    if (schemaPath) {
      if (DataNode.cache[schemaPath]) {
        // console.log(">>>> get schema from cache");
        this.data = _.get(DataNode.cache[schemaPath], name);
      } else {
        // console.log(">>>> loading schema");
        this.schema = this.loadSchema().then((response: any) => {
          // console.log("schema data:", response.data);
          if (response.data) {
            // const { definition, endpoint } = response.data;
            this.schema = response.data;
            const endpoint = this.getDataEntryPoint("get");
            // console.log(">>>>>>>>data endpoint", endpoint);
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
    try {
      let response: any = await this.request.get(source);

      if (response.data) {
        this.data = response.data;
      } else {
        this.errorInfo = {
          code: `Error loading from ${source}`
        };
      }
      // this.data = response;
      // console.log("l....................");
      return response;
    } catch (e) {
      return e;
    }
  }

  getSchema() {
    return this.schema;
  }

  async loadSchema() {
    if (_.get(this.schema, "definition")) {
      // console.log("schema loaded>>>>");
      return this.schema;
    }
    // const { schemaPath } = this.source;
    try {
      const dataSchemaPath = this.request.getConfig("dataSchemaPrefix");
      // console.log(this.source, "<<<<<<<<<<<<<<<<<");
      const path = `${dataSchemaPath}${this.source.schemaPath}`;
      // console.log(">>>>>>>>>>>>>>>>>>>>>>>", path);
      return await this.request.get(path);
    } catch (e) {
      return e;
    }
  }
}
