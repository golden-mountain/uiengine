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
  source: IDataSourceInfo;
  mapper: IDataMapper;
  data?: any;
  pluginManager: IPluginManager = new PluginManager(this);

  constructor(
    source: IDataSourceInfo,
    request: IRequest,
    loadDefaultPlugins: boolean = true
  ) {
    this.request = request;
    this.source = source;
    if (loadDefaultPlugins) {
      this.pluginManager.loadPlugins({});
    }
    this.mapper = new DataMapper(source, request);
  }

  async loadSchema() {
    return await this.mapper.loadSchema();
  }

  async loadData(source?: IDataSourceInfo) {
    let dataSource = source || this.source;
    const { schemaPath } = dataSource;
    if (schemaPath) {
      await this.mapper.loadSchema();
      const endpoint = this.mapper.getDataEntryPoint("get");
      this.data = await this.loadRemoteData(endpoint);
    }
    return this.data;
  }

  async loadRemoteData(dataSource: string) {
    let result: any = null;
    try {
      const { schemaPath = "", name = "" } = this.source;
      let data: any = Cache.getData(schemaPath);
      if (!data) {
        data = await this.request.get(dataSource);
        if (data.data) {
          Cache.setData(schemaPath, data.data);
          data = data.data;
        }
      }
      result = data;
    } catch (e) {
      this.errorInfo.data = {
        code: e.message
      };
    }
    this.data = result;
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
