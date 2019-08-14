import _ from "lodash";

import {
  IDataMapper,
  IDataSchema,
  IRequest,
  IErrorInfo,
  IPluginManager,
  IDataSource
} from "../../typings";
import { PluginManager, Cache, parseCacheID, parseSchemaPath } from ".";

export default class DataMapper implements IDataMapper {
  static instance: IDataMapper;
  static getInstance = () => {
    if (!DataMapper.instance) {
      DataMapper.instance = new DataMapper();
    }
    return DataMapper.instance as DataMapper;
  };

  request: IRequest = {} as IRequest;
  errorInfo?: IErrorInfo;
  source: IDataSource = { source: "", schema: "" };
  rootSchema?: IDataSchema;
  pluginManager: IPluginManager = new PluginManager(this);
  cacheID: string = "";

  setRequest(request: IRequest) {
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

  private getSchemaSource(source: IDataSource) {
    let schemaSource = source.schema;
    if (!schemaSource) schemaSource = source.source;
    return schemaSource;
  }

  async getSchema(source: IDataSource) {
    const schemaSource = this.getSchemaSource(source);
    this.cacheID = parseCacheID(schemaSource);
    let schema: any = Cache.getDataSchema(this.cacheID);
    if (!schema) {
      schema = await this.loadSchema(source);
    }
    this.rootSchema = schema;
    return schema;
  }

  async loadSchema(source: IDataSource) {
    let result: any = null;
    this.source = source;
    const schemaSource = this.getSchemaSource(source);
    let path = parseSchemaPath(schemaSource);
    this.cacheID = parseCacheID(schemaSource);
    try {
      let schema: any = Cache.getDataSchema(this.cacheID);
      if (!schema) {
        const dataSchemaPrefix = this.request.getConfig("dataSchemaPrefix");
        if (!_.isEmpty(dataSchemaPrefix)) {
          path = `${dataSchemaPrefix}${path}`;
        }
        schema = await this.request.get(path);
        schema = schema.data;
        Cache.setDataSchema(this.cacheID, schema);
      }

      this.rootSchema = schema;
      result = schema;
    } catch (e) {
      // prevent load and load again
      Cache.setDataSchema(this.cacheID, {});
      this.errorInfo = {
        code: e.message
      };
    }

    return result;
  }
}
