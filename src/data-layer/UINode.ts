import _ from "lodash";
import { Request, DataNode, Cache, StateNode } from ".";
import { AxiosPromise } from "axios";
import { IDataNode } from "../../typings/DataNode";
import { IStateNode } from "../../typings/StateNode";
import { IUINode, ILayoutSchema } from "../../typings/UINode";

export default class UINode implements IUINode {
  private errorInfo: IErrorInfo = {};
  private request: IRequest = new Request();
  private children: Array<UINode> | Array<any> = [];
  private schema: ILayoutSchema = {};
  private liveSchema: ILayoutSchema = {};
  private rootSchema: ILayoutSchema = {};
  private dataNode?: any;
  private stateNode: IStateNode = new StateNode(this);

  constructor(schema: ILayoutSchema, request?: IRequest) {
    if (request) {
      this.request = request;
    }

    // this.loadLayout(schema);
    this.schema = schema;
    this.liveSchema = _.cloneDeep(schema);
  }

  async loadLayout(schema?: ILayoutSchema | string) {
    if (!schema) schema = this.schema;
    if (typeof schema === "string") {
      schema = await this.loadRemoteLayout(schema);
      this.rootSchema = schema;
    }
    await this.assignSchema(schema);
    return schema;
  }

  getSchema(): ILayoutSchema {
    return this.schema;
  }

  getErrorInfo(): IErrorInfo {
    return this.errorInfo;
  }

  getChildren(): Array<IUINode> {
    return this.children;
  }

  getDataNode(): IDataNode {
    return this.dataNode;
  }

  getLiveSchema(): ILayoutSchema {
    return this.liveSchema;
  }

  getRootSchema(): ILayoutSchema {
    return this.rootSchema;
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
    let liveSchema = _.cloneDeep(schema);
    if (liveSchema["datasource"]) {
      await this.loadData(liveSchema["datasource"]);
    }

    if (liveSchema["$children"]) {
      const data = this.getDataNode().getData();
      ////////////// SCHEMA SWITCHED TO LIVE schema//////
      liveSchema = await this.genLiveLayout(schema, data);
    }

    if (liveSchema.children) {
      this.children = liveSchema.children.map((s: any) => {
        let node: any;
        if (_.isArray(s)) {
          node = _.map(s, (v: ILayoutSchema) => {
            const subnode = new UINode(v);
            // subnode.loadLayout(v);
            return subnode;
          });
        } else {
          node = new UINode(s);
          // node.loadLayout(s);
        }
        return node;
      });
    }

    this.schema = schema;
    this.liveSchema = liveSchema;

    await this.updateState();
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
    this.liveSchema = {};
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

  async genLiveLayout(schema: ILayoutSchema, data: any) {
    if (schema.datasource) {
      data = await this.loadData(schema.datasource);
    }

    const liveSchema = _.cloneDeep(schema);
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
    this.liveSchema = liveSchema;
    return liveSchema;
  }

  async updateState() {
    return this.getStateNode().renewStates();
  }
}
