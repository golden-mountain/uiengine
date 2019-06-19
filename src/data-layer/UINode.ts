import _ from "lodash";
import { Request, DataNode, Cache } from ".";
import { AxiosPromise } from "axios";
import { IDataNode } from "../../typings/DataNode";
// import { IUINode, ILayoutSchema } from "../../typings/UINode";

export default class UINode implements IUINode {
  private errorInfo: IErrorInfo = {};
  private request: IRequest = new Request();
  private children: Array<UINode> = [];
  private schema: ILayoutSchema = {};
  private dataNode?: any;

  constructor(schema: ILayoutSchema, request?: IRequest) {
    if (request) {
      this.request = request;
    }

    // this.loadLayout(schema);
    this.schema = schema;
  }

  async loadLayout(schema?: ILayoutSchema | string) {
    if (!schema) schema = this.schema;
    if (typeof schema !== "object") {
      schema = await this.loadRemoteLayout(schema);
    }
    this.assignSchema(schema);
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

  async loadRemoteLayout(url: string): Promise<AxiosPromise> {
    let result: any = Cache.getLayoutSchema(url);
    if (!result) {
      try {
        let response: any = await this.request.get(url);
        if (response.data) {
          result = response.data;
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

  private assignSchema(schema: ILayoutSchema) {
    if (schema.children) {
      this.children = schema.children.map((s: any) => {
        this.loadLayout(s);
        return new UINode(s);
      });
      // console.log(this.children);
    }
    if (schema["datasource"]) {
      // console.log("load schema", schema["datasource"]);
      this.loadData(schema.datasource);
    }

    if (schema["template"]) {
      this.genLiveLayout();
    }
    this.schema = schema;
    return this;
  }

  async loadData(source: string) {
    // const dataSource: IDataSource = { isURL: true, value: source };
    this.dataNode = new DataNode(source, this.request);
    return await this.dataNode.loadData();
  }

  async replaceLayout(newSchema: ILayoutSchema | string) {
    this.clearLayout();
    await this.loadLayout(newSchema);
    return this;
  }

  async updateLayout() {
    // console.log(this.schema);
    await this.loadLayout(this.schema);
    return this;
  }

  clearLayout() {
    this.schema = [];
    this.errorInfo = {};
    this.children = [];
    this.dataNode = null;
    return this;
  }

  getNode(path?: string) {
    if (path) {
      // console.log(_.get(this, "schema"));
      return _.get(this, path);
    }
    return this;
  }

  genLiveLayout() {
    const template = _.get(this.schema, "template");
    const data = this.getDataNode().getData();
    // console.log(data);
    if (template && data) {
    }
  }
}
