import _ from "lodash";
import { Request, DataNode, Cache, StateNode } from ".";
import { AxiosPromise } from "axios";
import { IDataNode } from "../../typings/DataNode";
import { IStateNode } from "../../typings/StateNode";
import { IUINode, ILayoutSchema } from "../../typings/UINode";

export default class UINode implements IUINode {
  private errorInfo: IErrorInfo = {};
  private request: IRequest = new Request();
  children: Array<UINode> = [];
  isLiveChildren: boolean = false;
  private schema: ILayoutSchema = {};
  private dataNode?: any;
  private stateNode: IStateNode = new StateNode(this);
  private rootName: string = "";

  constructor(
    schema: ILayoutSchema,
    request?: IRequest,
    root: string = "default"
  ) {
    if (request) {
      this.request = request;
    }

    this.schema = schema;

    // cache root object if given root name
    if (root) {
      Cache.setLayoutRoot(root, this);
      this.rootName = root;
    }
  }

  async loadLayout(schema?: ILayoutSchema | string) {
    let returnSchema: any = schema;
    if (!returnSchema) returnSchema = this.schema;
    if (typeof schema === "string") {
      returnSchema = await this.loadRemoteLayout(schema);
      this.rootName = schema;
    }
    if (returnSchema) {
      await this.assignSchema(returnSchema);
    }
    return returnSchema;
  }

  getSchema(): ILayoutSchema {
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

  private async assignSchema(schema: ILayoutSchema) {
    let liveSchema = schema;
    if (liveSchema["datasource"]) {
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
            const subnode = new UINode(s[i], this.request, this.rootName);
            await subnode.loadLayout(s[i]);
            node.push(subnode);
          }
        } else {
          node = new UINode(s, this.request, this.rootName);
          await node.loadLayout(s);
        }
        children.push(node);
      }
      this.children = children;
    }
    this.schema = liveSchema;
    // load State
    this.stateNode = new StateNode(this);
    this.stateNode.renewStates();
    Cache.setLayoutRoot(this.rootName, this);
    return this;
  }

  async loadData(source: string) {
    this.dataNode = new DataNode(source, this.request);
    const result = await this.dataNode.loadData();
    return result;
  }

  async replaceLayout(newSchema: ILayoutSchema | string) {
    this.clearLayout();
    const schemaReplaced = await this.loadLayout(newSchema);
    return schemaReplaced;
  }

  async updateLayout() {
    const newSchema = await this.loadLayout(this.schema);
    return newSchema;
  }

  clearLayout() {
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
    if (route) {
      const path = route.map((v: Number) => {
        return `children[${v}]`;
      });
      return _.get(this, path.join("."));
    } else {
      return this.children;
    }
  }

  searchNodes(prop: object, target?: IUINode, root?: string): any {
    let nodes: Array<any> = [];

    // search this rootSchemas
    const rootName = root || this.rootName;
    if (!target) {
      target = Cache.getLayoutRoot(rootName) as IUINode;
    }

    const schema = target.getSchema();
    let finded = true;
    for (let name in prop) {
      const value = prop[name];
      // console.log(value, name, ">>>>>>>>>>>>>>>", schema[name]);
      if (schema[name] === undefined || !_.isEqual(schema[name], value)) {
        finded = false;
      }
    }
    if (finded) nodes.push(target);

    // TO Improve?: recursive find
    const children = target.getChildren();
    _.forEach(children, (child: any) => {
      if (_.isArray(child)) {
        _.forEach(child, (c: any) => {
          nodes = nodes.concat(this.searchNodes(prop, c));
        });
      } else {
        nodes = nodes.concat(this.searchNodes(prop, child));
      }
    });
    return nodes;
  }

  async genLiveLayout(schema: ILayoutSchema, data: any) {
    if (schema.datasource) {
      data = await this.loadData(schema.datasource);
    }

    // replace $ to row number
    const updatePropRow = (target: ILayoutSchema, index: number) => {
      if (_.isArray(target)) {
        _.forEach(target, (c: any) => {
          _.forIn(c, function(value, key) {
            if (typeof value === "object") {
              updatePropRow(value, index);
            } else if (value.indexOf("$") > -1) {
              _.set(c, key, value.replace("$", index));
            }
          });
        });
      } else {
        _.forIn(target, function(value, key) {
          if (typeof value === "object") {
            updatePropRow(value, index);
          } else if (value.indexOf("$") > -1) {
            _.set(target, key, value.replace("$", index));
          }
        });
      }
    };

    const liveSchema = schema;
    const rowTemplate: any = liveSchema.$children;
    if (rowTemplate && data) {
      liveSchema.children = data.map((d: any, index: number) =>
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
    return this.getStateNode().renewStates();
  }
}
