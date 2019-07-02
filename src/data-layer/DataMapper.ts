import _ from "lodash";

import {
  IDataMapper,
  IDataSchema,
  IRequest,
  IErrorInfo,
  IPluginManager
} from "../../typings";
import { PluginManager, Cache } from ".";

export default class DataMapper implements IDataMapper {
  private request: IRequest;
  errorInfo?: IErrorInfo;
  source: string = "";
  rootSchema?: IDataSchema;
  pluginManager: IPluginManager = new PluginManager(this);
  cacheID: string = "";

  constructor(request: IRequest) {
    this.request = request;
  }

  getDataEntryPoint(method: string): string {
    let schema: any = this.rootSchema;
    const defaultEndPoint = _.get(schema, `endpoint.default.path`, "");
    const withoutPath = _.get(schema, `endpoint.${method}`, defaultEndPoint);
    const endpoint = _.get(schema, `endpoint.${method}.path`, withoutPath);
    const dataURLPrefix = this.request.getConfig("dataPathPrefix");
    return `${dataURLPrefix}${endpoint}`;
  }

  async loadSchema(source: string) {
    let result: any = null;
    this.source = source;
    this.cacheID = _.snakeCase(source);

    try {
      let schema: any = Cache.getDataSchema(this.cacheID);
      if (_.isEmpty(schema)) {
        const dataSchemaPrefix = this.request.getConfig("dataSchemaPrefix");
        let path = source;
        if (!_.isEmpty(dataSchemaPrefix)) {
          path = `${dataSchemaPrefix}${source}`;
        }
        schema = await this.request.get(path);
        if (schema.data) {
          Cache.setDataSchema(this.cacheID, schema.data);
          schema = schema.data;
        }
      }

      this.rootSchema = schema;
      result = schema;
    } catch (e) {
      // console.log(e.message);
      this.errorInfo = {
        code: e.message
      };
    }

    return result;
  }
}
