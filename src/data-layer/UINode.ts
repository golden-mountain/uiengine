import _ from "lodash";

import {
  Request,
  DataNode,
  Cache,
  StateNode,
  PluginManager,
  Messager,
  parseRootName
} from "..";

import { AxiosPromise } from "axios";
import {
  IDataNode,
  IStateNode,
  IUINode,
  ILayoutSchema,
  IRequest,
  IErrorInfo,
  IPluginManager,
  IMessager,
  IStateInfo,
  IWorkingMode,
  IUINodeRenderer
} from "../../typings";

export default class UINode implements IUINode {
  request: IRequest = Request.getInstance();
  dataNode: IDataNode;
  stateNode: IStateNode = new StateNode(this);
  children: Array<UINode> = [];
  pluginManager: IPluginManager = new PluginManager(this);
  errorInfo: IErrorInfo = {};
  schema: ILayoutSchema = {};
  rootName: string = "";
  isLiveChildren: boolean = false;
  id: string = "";
  messager: IMessager;
  props: object = {};
  parent?: IUINode;
  stateInfo: IStateInfo = {
    data: null,
    state: {},
    time: 0
  };
  workingMode?: IWorkingMode;
  nodes: {
    [name: string]: IUINodeRenderer;
  } = {};

  constructor(
    schema: ILayoutSchema,
    request?: IRequest,
    root: string = "",
    parent?: IUINode
  ) {
    if (request) {
      this.request = request;
    }
    this.schema = schema;

    // cache root object if given root name
    if (root) {
      this.rootName = root;
    }

    // initial id, the id can't change
    // if (!this.schema._id) {
    this.schema._id = _.uniqueId("node-");
    // }
    this.id = this.schema._id;

    // new messager
    this.messager = Messager.getInstance();

    // assign parent
    this.parent = parent;

    // data node initial
    const emptyDataNodeName = `$dummy.${this.id}`;
    if (!schema.datasource) schema.datasource = emptyDataNodeName;
    this.dataNode = new DataNode(schema.datasource, this, this.request);
  }

  private setRootName(root: string) {
    this.rootName = parseRootName(root);
  }

  async loadLayout(
    schema?: ILayoutSchema | string,
    workingMode?: IWorkingMode
  ) {
    // load remote node
    let returnSchema: any = schema;
    if (!returnSchema) returnSchema = this.schema;
    if (typeof schema === "string" && schema) {
      returnSchema = await this.loadRemoteLayout(schema);
      this.setRootName(schema);
    }

    // assign the schema to this and it's children
    if (returnSchema) {
      await this.assignSchema(returnSchema, workingMode);
    }

    // cache this node
    Cache.setUINode(this.rootName, this);
    return returnSchema;
  }

  getSchema(path?: string): ILayoutSchema {
    // if (_.isEmpty(this.schema)) {
    //   console.warn("did you execute loadLayout before using getSchema method?");
    // }
    if (path) {
      return _.get(this.schema, path);
    }
    return this.schema;
  }

  async loadRemoteLayout(url: string): Promise<AxiosPromise> {
    this.setRootName(url);
    let result: any = Cache.getLayoutSchema(this.rootName);
    if (!result) {
      try {
        let response: any = await this.request.get(url);
        if (response.data) {
          result = response.data;
          Cache.setLayoutSchema(this.rootName, result);
        }
      } catch (e) {
        this.errorInfo = {
          status: 400,
          code: `Error loading from ${url}`
        };
      }
    }
    return result;
  }

  /**
   * TO DO: need to enhance:
   * 1. if only state change, on layout gen
   * 2. if data change, if the changed data has an item different than origin one, should renew the one, if delete one, should also remove the one
   * @param schema
   * @param reloadData
   */
  private async assignSchema(
    schema: ILayoutSchema,
    workingMode?: IWorkingMode
  ) {
    // assign workingMode
    if (workingMode) this.workingMode = workingMode;

    let liveSchema = schema;
    if (liveSchema["datasource"]) {
      await this.dataNode.loadData(liveSchema["datasource"]);
    }

    if (liveSchema["$children"] && this.dataNode) {
      const data = this.dataNode.data;
      liveSchema = await this.genLiveLayout(liveSchema, data);
    }

    if (liveSchema.children) {
      const children: any = [];
      for (let index in liveSchema.children) {
        let node: any;
        let s: any = liveSchema.children[index];
        if (_.isArray(s)) {
          node = new UINode({}, this.request, this.rootName, this);
          for (let i in s) {
            const subnode = new UINode(s[i], this.request, this.rootName, this);
            await subnode.loadLayout(s[i], this.workingMode);
            node.children.push(subnode);
          }
        } else {
          node = new UINode(s, this.request, this.rootName, this);
          await node.loadLayout(s, this.workingMode);
        }
        children.push(node);
      }
      this.children = children;
    }

    this.schema = liveSchema;
    // load State
    this.stateNode = new StateNode(this);
    await this.stateNode.renewStates();

    // load ui.parser plugin
    try {
      await this.pluginManager.executePlugins("ui.parser");
    } catch (e) {
      console.log(e.message);
    }

    // state info default
    return this;
  }

  async replaceLayout(
    newSchema: ILayoutSchema | string,
    workingMode?: IWorkingMode
  ) {
    const schemaReplaced = await this.loadLayout(newSchema, workingMode);
    return schemaReplaced;
  }

  async updateLayout(workingMode?: IWorkingMode) {
    const newSchema = await this.assignSchema(this.schema, workingMode);
    return newSchema;
  }

  clearLayout() {
    Cache.clearUINodes(this.rootName);
    this.schema = {};
    this.errorInfo = {};
    this.children = [];
    return this;
  }

  getNode(path?: string) {
    if (path) {
      return _.get(this, path);
    }
    return this;
  }

  getChildren(route?: Array<Number>) {
    // if (_.isEmpty(this.children)) {
    //   console.warn(
    //     "did you execute loadLayout before using getChildren method?"
    //   );
    // }
    if (route) {
      const path = route.map((v: Number) => {
        return `children[${v}]`;
      });
      return _.get(this, path.join("."));
    } else {
      return this.children;
    }
  }

  async genLiveLayout(schema: ILayoutSchema, data: any) {
    // replace $ to row number
    const updatePropRow = (target: ILayoutSchema, index: string) => {
      _.forIn(target, function(value: any, key: string) {
        if (typeof value === "object") {
          updatePropRow(value, index);
        } else if (_.isString(value) && value.indexOf("$") > -1) {
          _.set(target, key, value.replace("$", index));
        }
      });
    };

    const liveSchema = schema;
    const rowTemplate: any = liveSchema.$children;
    if (rowTemplate && data) {
      liveSchema.children = data.map((d: any, index: string) =>
        rowTemplate.map((s: any) => {
          const newSchema = _.cloneDeep(s);
          if (newSchema.datasource) {
            updatePropRow(newSchema, index);
            newSchema._index = index; // row id
          }
          return newSchema;
        })
      );
    }

    // add a new children
    this.isLiveChildren = true;
    return liveSchema;
  }

  sendMessage(force: boolean = false) {
    const newState = {
      nodes: this.nodes,
      data: _.cloneDeep(this.dataNode.data),
      state: _.cloneDeep(this.stateNode.state),
      time: force ? new Date().getTime() : 0
    };
    // if (!_.isEmpty(newState.nodes)) {
    //   console.log(_.cloneDeep(newState), "at send message on UINode");
    // }
    if (!_.isEqual(newState, this.stateInfo)) {
      this.stateInfo = newState;
      this.messager.sendMessage(this.id, this.stateInfo);
    }
  }
}
