import _ from "lodash";

import {
  IDataEngine,
  IDataSourceInfo,
  IPluginManager,
  IRequest,
  IDataMapper,
  IErrorInfo
} from "../../typings";
import { PluginManager, Cache, DataMapper } from ".";

export default class UIEngine implements IDataEngine {
  private request: IRequest;
  errorInfo?: any;
  source: string;
  schemaPath: string;
  mapper: IDataMapper;
  data?: any;
  pluginManager: IPluginManager = new PluginManager(this);

  constructor(
    source: string,
    request: IRequest,
    loadDefaultPlugins: boolean = true
  ) {
    this.request = request;
    this.source = source;
    if (loadDefaultPlugins) {
      this.pluginManager.loadPlugins({});
    }

    this.schemaPath = this.parseSchemaPath(source);
    this.mapper = new DataMapper(this.schemaPath, request);
  }

  parseSchemaPath(source: string) {
    const splitter = source.indexOf(":") > -1 ? ":" : ".";
    let [schemaPath] = source.split(splitter);
    return `${schemaPath}.json`;
  }

  async loadSchema() {
    return await this.mapper.loadSchema();
  }

  async loadData(source?: string) {
    let schemaPath = "";

    if (source) {
      schemaPath = this.parseSchemaPath(source);
    } else {
      schemaPath = this.schemaPath;
    }

    if (schemaPath) {
      await this.mapper.loadSchema();
      const endpoint = this.mapper.getDataEntryPoint("get");

      this.data = await this.loadRemoteData(endpoint);
    }
    return this.data;
  }

  async loadRemoteData(source: string) {
    let result: any = {};
    try {
      // get schema path
      let dataSource = "";
      if (source !== undefined) {
        dataSource = source;
      } else {
        dataSource = this.source;
      }

      // load data from cache/api
      let data: any = Cache.getData(dataSource);
      if (!data) {
        data = await this.request.get(dataSource);
        if (data.data) {
          Cache.setData(dataSource, data.data);
          data = data.data;
        }
      }
      result = data;
    } catch (e) {
      console.log(e.message);
      this.errorInfo = {
        code: e.message
      };
    }
    if (result) this.data = result;
    return result;
  }

  async updateData(source: string, data: any) {
    return {};
  }

  async replaceData(source: string, data: any) {
    return {};
  }

  async deleteData(source: string) {
    return {};
  }
}
