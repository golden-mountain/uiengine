import _ from "lodash";

import {
  IDataEngine,
  IPluginManager,
  IRequest,
  IRequestOptions,
  IDataMapper,
  IPluginExecutionConfig,
  IDataSource
} from "../../typings";

import { PluginManager, Cache, DataMapper, parseCacheID } from ".";

export default class DataEngine implements IDataEngine {
  static instance: IDataEngine;
  static getInstance = () => {
    if (!DataEngine.instance) {
      DataEngine.instance = new DataEngine();
    }
    return DataEngine.instance as DataEngine;
  };

  request: IRequest = {} as IRequest;
  errorInfo?: any;
  source?: IDataSource;
  schemaPath?: string;
  mapper: IDataMapper = {} as IDataMapper;
  data?: any;
  pluginManager: IPluginManager = new PluginManager(this);
  cacheID: string = "response";
  requestOptions: IRequestOptions = {};

  setRequest(request: IRequest) {
    this.request = request;
    this.mapper = DataMapper.getInstance();
    this.mapper.setRequest(request);
  }

  async loadSchema(source: IDataSource) {
    // this.schemaPath = parseSchemaPath(source);
    return await this.mapper.loadSchema(source);
  }

  async sendRequest(
    source: IDataSource,
    data?: any,
    method: string = "get",
    cache: boolean = false
  ) {
    // clear initial data;
    this.data = {};
    this.requestOptions.method = method;
    this.errorInfo = null;
    if (!this.request[method] || !_.isFunction(this.request[method])) {
      this.errorInfo = {
        status: 1001,
        code: `Method ${method} did not defined on Request`
      };
      return false;
    }

    // schemaPath = parseSchemaPath(source);
    let dataSource = source.source;
    this.cacheID = parseCacheID(dataSource);
    this.source = source;
    if (source) {
      const schema = await this.mapper.loadSchema(source);
      if (schema === null) {
        this.errorInfo = {
          status: 2001,
          code: `Schema for ${source.source} not found`
        };
        return false;
      }

      this.requestOptions.endpoint = this.mapper.getDataEntryPoint(method);
      if (!this.requestOptions.endpoint) {
        this.errorInfo = {
          status: 1000,
          code: "URL not match"
        };
        return false;
      }

      try {
        let response: any;

        // could stop the commit
        const exeConfig: IPluginExecutionConfig = {
          stopWhenEmpty: true,
          returnLastValue: true
        };
        const couldCommit = await this.pluginManager.executePlugins(
          "data.request.could",
          exeConfig
        );
        if (couldCommit === false) {
          this.errorInfo = {
            status: 1001,
            code: "Plugins blocked the commit"
          };
          return false;
        }
        const submitData = await this.pluginManager.executePlugins(
          "data.commit.process",
          { stopWhenEmpty: true, returnLastValue: true },
          { source, data: _.cloneDeep(data) },
        );
        if (submitData !== undefined) {
          this.requestOptions.params = submitData;
        } else {
          this.requestOptions.params = data;
        }

        if (cache) {
          response = Cache.getData(this.cacheID, this.requestOptions.endpoint);
        }

        // handle response
        if (!response) {
          response = await this.request[method](
            this.requestOptions.endpoint,
            this.requestOptions.params
          );
          if (response.data) {
            if (cache) {
              Cache.setData(
                this.cacheID,
                this.requestOptions.endpoint,
                response.data
              );
            }
            response = response.data;
          }
        }

        this.data = response;
      } catch (e) {
        this.errorInfo = {
          code: e.message
        };
      }
    }

    // could modify the response
    const exeConfig: IPluginExecutionConfig = {
      returnLastValue: true
    };

    const afterResult = await this.pluginManager.executePlugins(
      "data.request.after",
      exeConfig
    );
    if (!_.isEmpty(afterResult)) this.data = afterResult;

    return this.data;
  }

  async loadData(source: IDataSource, params?: any) {
    return await this.sendRequest(source, params, "get", true);
  }

  async updateData(source: IDataSource, data?: any) {
    return await this.sendRequest(source, data, "post");
  }

  async replaceData(source: IDataSource, data?: any) {
    return await this.sendRequest(source, data, "put");
  }

  async deleteData(source: IDataSource, data?: any) {
    return await this.sendRequest(source, data, "put");
  }
}
