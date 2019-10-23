import _ from "lodash";

import {
  IDataEngine,
  IDataMapper,
  IDataSource,
  IPluginManager,
  IPluginExecuteOption,
  IPluginResult,
  IRequest,
  IRequestOptions
} from "../../typings";

import { PluginManager, Cache, DataMapper, parseCacheID } from ".";

export default class DataEngine implements IDataEngine {
  static instance: DataEngine;
  static getInstance = () => {
    if (_.isNil(DataEngine.instance)) {
      DataEngine.instance = new DataEngine();
    }
    return DataEngine.instance;
  };

  id: string;
  pluginManager: IPluginManager;
  request: IRequest = {} as IRequest;
  errorInfo?: any;
  source?: IDataSource;
  schemaPath?: string;
  mapper: IDataMapper = {} as IDataMapper;
  data?: any;
  cacheID: string = "response";
  requestOptions: IRequestOptions = {};

  constructor() {
    this.id = _.uniqueId("DataEngine");
    this.pluginManager = PluginManager.getInstance();
    this.pluginManager.register(this.id, {
      categories: ["data.request.before", "data.request.after"]
    });
  }

  setRequest(request: IRequest) {
    this.request = request;
    this.mapper = DataMapper.getInstance();
    this.mapper.setRequest(request);
  }

  async loadSchema(source: IDataSource) {
    // this.schemaPath = parseSchemaPath(source)
    return await this.mapper.loadSchema(source);
  }

  async sendRequest(
    source: IDataSource,
    data?: any,
    method: string = "get",
    cache: boolean = false
  ) {
    // clear initial data
    this.data = {};
    this.requestOptions.params = _.cloneDeep(data);
    this.requestOptions.method = method;
    this.errorInfo = null;
    if (!this.request[method] || !_.isFunction(this.request[method])) {
      this.errorInfo = {
        status: 1001,
        code: `Method ${method} did not defined on Request`
      };
      return false;
    }

    // schemaPath = parseSchemaPath(source)
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
        const exeOption: IPluginExecuteOption = {
          afterExecute: (plugin, param, result) => {
            if (!result) {
              return {
                stop: true
              };
            }
            return {};
          }
        };
        const exeResult = await this.pluginManager.executePlugins(
          this.id,
          "data.request.before",
          { dataEngine: DataEngine.instance },
          exeOption
        );
        const couldCommit = exeResult.results.every((item: IPluginResult) => {
          if (item.result === true) {
            return true;
          } else {
            return false;
          }
        });

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
    const afterResult = await this.pluginManager.executePlugins(
      this.id,
      "data.request.after",
      { dataEngine: DataEngine.instance }
    );
    if (afterResult.status === "COMPLETED") {
      afterResult.results.forEach(result => {
        if (!_.isEmpty(result.result)) {
          this.data = result.result;
        }
      });
    }

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
