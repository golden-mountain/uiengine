import _ from "lodash";
import { PluginManager, Cache, DataPool } from "./";
import {
  IDataNode,
  IRequest,
  IPluginManager,
  IUINode,
  IPluginExecutionConfig,
  IDataEngine,
  IDataPool
} from "../../typings";
import { Request, DataEngine } from ".";

export default class DataNode implements IDataNode {
  private request: IRequest = new Request({});
  errorInfo: any = {
    status: undefined,
    code: ""
  };
  pluginManager: IPluginManager = new PluginManager(this);
  dataEngine: IDataEngine;
  uiNode: IUINode;
  source: string;
  rootData?: any;
  schema?: any;
  rootSchema?: any;
  data: any;
  cacheID: string;
  dataPool: IDataPool;

  constructor(source: any, uiNode: IUINode, request?: IRequest) {
    this.uiNode = uiNode;

    if (_.isObject(source)) {
      this.data = source;
      this.source = "";
    } else {
      // give default data
      this.data = _.get(uiNode.schema, "defaultvalue");
      this.source = source;
    }
    this.rootData = {};

    // initial data engine
    if (request) {
      this.request = request;
    }

    // get id
    this.cacheID = this.formatCacheID(source);
    this.dataEngine = new DataEngine(this.request);

    // get instance of data pool
    this.dataPool = DataPool.getInstance();
  }

  formatSource(source: string, prefix?: string) {
    const formatted = _.trim(source.replace(":", "."), ".");
    if (prefix) {
      return `${prefix}.${formatted}`;
    }
    return formatted;
  }

  formatCacheID(id: any) {
    if (id && _.isString(id)) {
      const splitter = id.indexOf(":") > -1 ? ":" : ".";
      let [schemaPath] = id.split(splitter);
      return _.snakeCase(schemaPath);
    } else {
      return "$dummy";
    }
  }

  getErrorInfo() {
    return this.errorInfo;
  }

  getData(path?: string) {
    return path ? _.get(this.data, path, this.data) : this.data;
  }

  getSchema(path?: string) {
    if (path) {
      return _.get(this.schema, path);
    }
    return this.schema;
  }

  getRootSchema() {
    return this.dataEngine.mapper.rootSchema;
  }

  getRootData(path?: string) {
    return path ? _.get(this.rootData, path, this.rootData) : this.rootData;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  async loadData(source?: string) {
    // const { schemaPath = "", name = "" } = this.source;
    if (source) {
      this.source = source;
      // source = this.formatSource(source);
      this.cacheID = this.formatCacheID(source);
    } else {
      source = this.source;
    }

    if (source) {
      // let result = Cache.getData(this.cacheID, source);
      let s = this.formatSource(source, this.formatCacheID(source));
      let result;
      // let result = this.dataPool.get(s, false);
      let data = await this.dataEngine.loadData(source);
      if (data === null) {
        this.errorInfo = this.dataEngine.errorInfo;
        return;
      }

      const exeConfig: IPluginExecutionConfig = {
        returnLastValue: true
      };
      this.schema = await this.pluginManager.executePlugins(
        "data.schema.parser",
        exeConfig
      );
      // get parent data to assign new data
      const nameSegs = source.split(".");
      nameSegs.pop();
      this.rootData = _.get(data, nameSegs);
      let formattedSource = this.formatSource(source);
      result = _.get(data, formattedSource, null);
      this.data = result;
      // Cache.setData(this.cacheID, source, result);
      this.dataPool.set(result, s);
    }

    return this.data;
  }

  async updateData(value: any, path?: string) {
    let noUpdateLayout = true;
    if (_.isArray(value) && this.uiNode.schema.$children) {
      noUpdateLayout = _.isEqual(value, this.data);
    }

    // update this data
    if (path) {
      _.set(this.data, path, value);
    } else {
      // const { name = "" } = this.source;
      this.data = value;
      const nameSegs = this.source.split(/\.|\:/);
      const lastName = nameSegs.pop();
      if (lastName) {
        _.set(this.rootData, lastName, value);
      }
    }

    // check data from update plugins
    const exeConfig: IPluginExecutionConfig = {
      stopWhenEmpty: true,
      returnLastValue: true
    };
    this.errorInfo = await this.pluginManager.executePlugins(
      "data.update.could",
      // when one validation got false value, break; the rest plugins execution
      exeConfig
    );

    // update state without sending message
    if (noUpdateLayout) {
      await this.uiNode.pluginManager.executePlugins("ui.parser");
      await this.uiNode.stateNode.renewStates();
    } else {
      await this.uiNode.updateLayout();
    }

    const status = _.get(this.errorInfo, "status", true);
    if (status) {
      this.dataPool.set(
        this.data,
        this.formatSource(this.source, this.cacheID)
      );
      // Cache.setData(this.cacheID, this.formatSource(this.source), this.data);
    }
    return status;
  }

  async deleteData(path?: any) {
    const exeConfig: IPluginExecutionConfig = {
      stopWhenEmpty: true,
      returnLastValue: true
    };
    this.errorInfo = await this.pluginManager.executePlugins(
      "data.delete.could",
      exeConfig
    );
    let noUpdateLayout = true;

    const status = _.get(this.errorInfo, "status", true);
    if (status) {
      if (path !== undefined) {
        if ((_.isArray(path) || _.isNumber(path)) && _.isArray(this.data)) {
          if (this.uiNode.schema.$children) {
            noUpdateLayout = false;
          }

          _.remove(this.data, (e: any, index: number) => {
            return _.isArray(path) ? path.indexOf(index) > -1 : index === path;
          });
        } else {
          _.unset(this.data, path);
        }
      } else {
        this.data = null;
      }

      // Cache.setData(this.cacheID, this.formatSource(this.source), this.data);
      this.dataPool.set(
        this.data,
        this.formatSource(this.source, this.cacheID)
      );
      // update state without sending message
      if (noUpdateLayout) {
        // for update props purpose
        await this.uiNode.pluginManager.executePlugins("ui.parser");
        await this.uiNode.stateNode.renewStates();
      } else {
        await this.uiNode.updateLayout();
      }
    }
    return status;
  }

  async submit(
    dataSources: Array<string>,
    method: string = "post",
    connectWith?: string
  ) {
    const result = {};
    let responses: any = [];
    dataSources.forEach((source: string) => {
      const cacheID = this.formatCacheID(source);
      const line = this.formatSource(source, cacheID);
      // const data = Cache.getData(this.cacheID, line);
      // _.merge(result, data);
      _.merge(result, this.dataPool.get(line, true));

      // remote?
      if (connectWith === undefined) {
        responses.push(
          this.dataEngine.sendRequest(source, result, method, false)
        );
      } else {
        const cacheID = this.formatCacheID(connectWith);
        const s = this.formatSource(connectWith, cacheID);
        this.dataPool.set(result, s);
      }
    });

    if (connectWith === undefined) {
      responses = await Promise.all(responses);
      return responses;
    }
    return result;
  }
}
