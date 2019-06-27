import _ from "lodash";
import {
  Request,
  DataNode,
  Cache,
  StateNode,
  PluginManager,
  Messager
} from ".";
import { AxiosPromise } from "axios";
import * as uiPlugins from "../plugins/ui";
import {
  IDataNode,
  IStateNode,
  IUINode,
  ILayoutSchema,
  IRequest,
  IErrorInfo,
  IPluginManager,
  IMessager
} from "../../typings";

export default class UINode implements IUINode {
  private request: IRequest = new Request();
  dataNode?: any;
  stateNode: IStateNode = new StateNode(this);
  children: Array<UINode> = [];
  pluginManager: IPluginManager = new PluginManager(this);
  loadDefaultPlugins: boolean = true;
  errorInfo: IErrorInfo = {};
  schema: ILayoutSchema = {};
  rootName: string = "";
  isLiveChildren: boolean = false;
  id: string = "";
  messager: IMessager;
  props: object = {};
  parent?: IUINode;

  constructor(
    schema: ILayoutSchema,
    request?: IRequest,
    root: string = "",
    loadDefaultPlugins: boolean = true,
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

    // load plugins
    if (loadDefaultPlugins) {
      this.loadDefaultPlugins = loadDefaultPlugins;
      this.pluginManager.loadPlugins(uiPlugins);
    }

    // initial id, the id can't change
    if (!this.schema._id) {
      this.schema._id = _.uniqueId("node-");
    }
    this.id = this.schema._id;

    // new messager
    this.messager = new Messager(this.schema._id);

    // assign parent
    this.parent = parent;
  }

  async loadLayout(schema?: ILayoutSchema | string) {
    // load remote node
    let returnSchema: any = schema;
    if (!returnSchema) returnSchema = this.schema;
    if (typeof schema === "string" && schema) {
      returnSchema = await this.loadRemoteLayout(schema);
      if (!this.rootName) this.rootName = schema;
    }
    // assign the schema to this and it's children
    if (returnSchema) {
      await this.assignSchema(returnSchema);
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

  getErrorInfo(): IErrorInfo {
    return this.errorInfo;
  }

  getDataNode(): IDataNode {
    return this.dataNode;
  }

  getStateNode(): IStateNode {
    return this.stateNode;
  }

  getPluginManager(): IPluginManager {
    return this.pluginManager;
  }

  getRequest(): IRequest {
    return this.request;
  }

  async loadRemoteLayout(url: string): Promise<AxiosPromise> {
    let result: any = Cache.getLayoutSchema(url);
    if (!result) {
      try {
        let response: any = await this.request.get(url);
        if (response.data) {
          result = response.data;
          Cache.setLayoutSchema(url, result);
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

  private async assignSchema(
    schema: ILayoutSchema,
    reloadData: boolean = true
  ) {
    let liveSchema = schema;
    if (liveSchema["datasource"] && reloadData) {
      await this.loadData(liveSchema["datasource"]);
    }

    if (liveSchema["$children"]) {
      const data = this.getDataNode().getData();
      liveSchema = await this.genLiveLayout(schema, data);
    }

    if (liveSchema.children) {
      const children: any = [];
      for (let index in liveSchema.children) {
        let node: any;
        let s: any = liveSchema.children[index];
        if (_.isArray(s)) {
          node = [];
          for (let i in s) {
            const subnode = new UINode(
              s[i],
              this.request,
              this.rootName,
              this.loadDefaultPlugins,
              this
            );
            await subnode.loadLayout(s[i]);
            node.push(subnode);
          }
        } else {
          node = new UINode(
            s,
            this.request,
            this.rootName,
            this.loadDefaultPlugins,
            this
          );
          await node.loadLayout(s);
        }
        children.push(node);
      }
      this.children = children;
    }

    this.schema = liveSchema;
    // load State
    this.stateNode = new StateNode(this, this.loadDefaultPlugins);
    await this.stateNode.renewStates();

    // load ui.parser plugin
    try {
      await this.pluginManager.executePlugins("ui.parser");
    } catch (e) {
      console.log(e.message);
    }
    return this;
  }

  async loadData(source: string) {
    this.dataNode = new DataNode(
      source,
      this,
      this.request,
      this.loadDefaultPlugins
    );
    const result = await this.dataNode.loadData();
    return result;
  }

  async replaceLayout(newSchema: ILayoutSchema | string) {
    this.clearLayout();
    const schemaReplaced = await this.loadLayout(newSchema);
    return schemaReplaced;
  }

  async updateLayout() {
    const newSchema = await this.assignSchema(this.schema, false);
    return newSchema;
  }

  clearLayout() {
    Cache.clearUINodes(this.rootName);
    this.schema = {};
    this.errorInfo = {};
    this.children = [];
    this.rootName = "";
    this.isLiveChildren = false;
    this.id = "";
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

  searchNodes(prop: object, layoutId?: string): any {
    let nodes: Array<any> = [];

    const rootName = layoutId || this.rootName;
    let allUINodes = Cache.getUINode(rootName) as IUINode;
    if (_.isObject(allUINodes)) {
      _.forIn(allUINodes, (target: any, id: string) => {
        if (!target.getSchema) return;
        let finded = true;
        const schema = target.getSchema();
        _.forIn(prop, (v: any, name: string) => {
          // handle name with $
          if (name.indexOf("$") > -1 && schema._index !== undefined) {
            name = name.replace("$", schema._index);
          }
          const schemaValue = _.get(schema, name);
          if (v !== schemaValue) {
            finded = false;
            return;
          }
        });
        if (finded) {
          nodes.push(target);
        }
      });
    }
    return nodes;
  }

  searchDepsNodes(myNode?: IUINode, layoutId?: string) {
    let schema: ILayoutSchema;
    if (!myNode) {
      schema = this.getSchema();
    } else {
      schema = myNode.getSchema();
    }

    let root = layoutId;
    let nodes: Array<any> = [];
    // to fix: rootName should not be empty
    if (!root) root = this.rootName || "default";
    let allUINodes = Cache.getUINode(root) as IUINode;
    _.forIn(allUINodes, (node: IUINode) => {
      const sch = node.getSchema();
      if (sch.state) {
        _.forIn(sch.state, (state: any, key: string) => {
          if (state.deps) {
            _.forEach(state.deps, (dep: any) => {
              if (dep.selector) {
                let finded = false;
                //k=id, v:id-of-demo-element-1
                _.forIn(dep.selector, (v: any, k: any) => {
                  if (!schema[k] || v !== schema[k]) {
                    finded = false;
                    return;
                  } else {
                    finded = true;
                  }
                });
                if (finded) {
                  nodes.push(node);
                }
              }
            });
          }
        });
      }
    });
    return nodes;
  }

  async genLiveLayout(schema: ILayoutSchema, data: any) {
    if (schema.datasource) {
      data = await this.loadData(schema.datasource);
    }

    // replace $ to row number
    const updatePropRow = (target: ILayoutSchema, index: string) => {
      if (_.isArray(target)) {
        _.forEach(target, (c: any) => {
          _.forIn(c, function(value, key) {
            if (typeof value === "object") {
              updatePropRow(value, index);
            } else if (_.isString(value) && value.indexOf("$") > -1) {
              _.set(c, key, value.replace("$", index));
            }
          });
        });
      } else {
        _.forIn(target, function(value, key) {
          if (typeof value === "object") {
            updatePropRow(value, index);
          } else if (_.isString(value) && value.indexOf("$") > -1) {
            _.set(target, key, value.replace("$", index));
          }
        });
      }
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

  async updateState() {
    return await this.getStateNode().renewStates();
  }
}
