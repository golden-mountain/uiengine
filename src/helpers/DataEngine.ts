import _ from "lodash";

import {
  IDataEngine,
  IPluginManager,
  IRequest,
  IRequestOptions,
  IDataMapper,
  IPluginExecutionConfig
} from "../../typings";
import { PluginManager, Cache, DataMapper } from ".";

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
  source?: string;
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

  parseSchemaPath(source: string) {
    const splitter = source.indexOf(":") > -1 ? ":" : ".";
    let [schemaPath] = source.split(splitter);
    return `${schemaPath}.json`;
  }

  async loadSchema(source: string) {
    this.schemaPath = this.parseSchemaPath(source);
    return await this.mapper.loadSchema(this.schemaPath);
  }

  async sendRequest(
    source: string,
    data?: any,
    method: string = "get",
    cache: boolean = false
  ) {
    // clear initial data;
    this.data = {};
    this.requestOptions.params = data;
    this.requestOptions.method = method;
    this.errorInfo = null;
    if (!this.request[method] || !_.isFunction(this.request[method])) {
      this.errorInfo = {
        status: 1001,
        code: `Method ${method} did not defined on Request`
      };
      return false;
    }

    let schemaPath = "";
    schemaPath = this.parseSchemaPath(source);
    this.source = schemaPath;
    let result = {};
    if (schemaPath) {
      const schema = await this.mapper.loadSchema(schemaPath);
      if (schema === null) {
        this.errorInfo = {
          status: 2001,
          code: `Schema for ${schemaPath} not found`
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

  async loadData(source: string, params?: any) {
    return await this.sendRequest(source, params, "get", true);
  }

  async updateData(source: string, data?: any) {
    return await this.sendRequest(source, data, "post");
  }

  async replaceData(source: string, data?: any) {
    return await this.sendRequest(source, data, "put");
  }

  async deleteData(source: string, data?: any) {
    return await this.sendRequest(source, data, "put");
  }
}
