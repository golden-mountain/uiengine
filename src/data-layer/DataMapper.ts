import _ from "lodash";

import {
  IDataSourceInfo,
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
  source: IDataSourceInfo;
  rootSchema?: IDataSchema;
  pluginManager: IPluginManager = new PluginManager(this);

  constructor(source: IDataSourceInfo, request: IRequest) {
    this.source = source;
    this.request = request;
  }

  getDataEntryPoint(method: string): string {
    const { schemaPath = "" } = this.source;
    let schema: any = Cache.getDataSchema(schemaPath);
    const defaultEndPoint = _.get(schema, `endpoint.default.path`, "");
    const endpoint = _.get(schema, `endpoint.${method}.path`, defaultEndPoint);
    const dataURLPrefix = this.request.getConfig("dataPathPrefix");
    return `${dataURLPrefix}${endpoint}`;
  }

  async loadSchema(source?: IDataSourceInfo) {
    let sourceInfo = source || this.source;
    let result: any = null;
    try {
      const { name = "", schemaPath = "" } = sourceInfo;
      let schema: any = Cache.getDataSchema(schemaPath);
      if (!schema) {
        const dataSchemaPath = this.request.getConfig("dataSchemaPrefix");
        const path = `${dataSchemaPath}${schemaPath}`;
        schema = await this.request.get(path);
        if (schema.data) {
          Cache.setDataSchema(schemaPath, schema.data);
          schema = schema.data;
        }
      }

      this.rootSchema = schema;
      result = schema;
    } catch (e) {
      this.errorInfo = {
        code: e.message
      };
    }

    return result;
  }
}
