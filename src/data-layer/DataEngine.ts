import _ from "lodash";

import {
  IDataEngine,
  IPluginManager,
  IRequest,
  IDataMapper,
  IPluginExecutionConfig
} from "../../typings";
import { PluginManager, Cache, DataMapper } from ".";

export default class UIEngine implements IDataEngine {
  private request: IRequest;
  errorInfo?: any;
  source?: string;
  schemaPath?: string;
  mapper: IDataMapper;
  data?: any;
  pluginManager: IPluginManager = new PluginManager(this);
  cacheID: string = "response";

  /**
   *
   * @param source a.b.c
   * @param request IRequest
   * @param loadDefaultPlugins whether load default plugins
   */
  constructor(request: IRequest) {
    this.request = request;
    this.mapper = new DataMapper(this.request);
  }

  parseSchemaPath(source: string) {
    const splitter = source.indexOf(":") > -1 ? ":" : ".";
    let [schemaPath] = source.split(splitter);
    return `${schemaPath}.json`;
  }

  async loadSchema(source: string) {
    this.schemaPath = this.parseSchemaPath(source);
    return await this.mapper.loadSchema(source);
  }

  async sendRequest(
    source: string,
    data?: any,
    method: string = "get",
    cache: boolean = false
  ) {
    // clear initial data;
    this.data = {};
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
      // if (source != this.source) {
      //   Cache.clearDataSchemaCache(this.cacheID);
      // }

      const schema = await this.loadSchema(schemaPath);
      if (schema === null) {
        this.errorInfo = {
          status: 2001,
          code: `Schema for ${schemaPath} not found`
        };
        return false;
      }

      const endpoint = this.mapper.getDataEntryPoint(method);
      if (!endpoint) {
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
          response = Cache.getData(this.cacheID, endpoint);
        }
        // handle response
        if (!response) {
          response = await this.request[method](endpoint, data);

          if (response.data) {
            if (cache) {
              Cache.setData(this.cacheID, endpoint, response.data);
            }
            response = response.data;
          }
        }
        result = response;
      } catch (e) {
        this.errorInfo = {
          code: e.message
        };
      }
    }

    this.data = result;

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
