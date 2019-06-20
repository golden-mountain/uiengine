import _ from "lodash";
import { Request, DataNode, Cache, StateNode } from ".";
import { AxiosPromise } from "axios";
import { IDataNode } from "../../typings/DataNode";
import { IStateNode } from "../../typings/StateNode";
import { IUINode, ILayoutSchema } from "../../typings/UINode";

export default class UINode implements IUINode {
  private errorInfo: IErrorInfo = {};
  private request: IRequest = new Request();
  private children: Array<UINode> = [];
  private schema: ILayoutSchema = {};
  private dataNode?: any;
  private stateNode: IStateNode = new StateNode(this);

  constructor(schema: ILayoutSchema, request?: IRequest) {
    if (request) {
      this.request = request;
    }

    this.schema = schema;
  }

  async loadLayout(schema?: ILayoutSchema | string) {
    let returnSchema: any = schema;
    if (!returnSchema) returnSchema = this.schema;
    if (typeof schema === "string") {
      returnSchema = await this.loadRemoteLayout(schema);
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
      ////////////// SCHEMA SWITCHED TO LIVE schema//////
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
            const subnode = new UINode(s[i]);
            await subnode.loadLayout(s[i]);
            node.push(subnode);
          }
        } else {
          node = new UINode(s);
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

  getChildren(...args: any) {
    const path = args.map((v: number) => {
      return `children[${v}]`;
    });
    return this.getNode(path.join("."));
  }

  async genLiveLayout(schema: ILayoutSchema, data: any) {
    if (schema.datasource) {
      data = await this.loadData(schema.datasource);
    }

    const liveSchema = schema;
    const rowTemplate: any = liveSchema.$children;
    if (rowTemplate && data) {
      liveSchema.children = data.map((d: any, index: number) =>
        rowTemplate.map((s: any) => {
          const newSchema = _.cloneDeep(s);
          if (newSchema.datasource) {
            newSchema.datasource = newSchema.datasource.replace("$", index);
          }
          return newSchema;
        })
      );
    }

    // add a new children
    return liveSchema;
  }

  async updateState() {
    return this.getStateNode().renewStates();
  }
}
