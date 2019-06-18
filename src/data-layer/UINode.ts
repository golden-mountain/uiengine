import _ from "lodash";
import { Request, DataNode } from ".";
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

  loadLayout(schema?: ILayoutSchema | string) {
    if (!schema) schema = this.schema;
    if (typeof schema === "object") {
      this.assignSchema(schema);
    } else {
      this.schema = this.loadRemoteLayout(schema);
    }
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
    try {
      let response: any = await this.request.get(url);
      // console.log(response);
      if (response.data) {
        this.assignSchema(response.data);
      } else {
        this.errorInfo = {
          status: 400,
          code: `Error loading from ${url}`
        };
      }
      // this.schema = response;
      return response;
    } catch (e) {
      return e;
    }
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
  }

  async loadData(source: string) {
    // const dataSource: IDataSource = { isURL: true, value: source };
    this.dataNode = new DataNode(source, this.request);
    return await this.dataNode.loadData();
  }

  replaceLayout(newSchema: ILayoutSchema | string) {
    this.clearLayout();
    this.loadLayout(newSchema);
    return this;
  }

  updateLayout() {
    // console.log(this.schema);
    this.loadLayout(this.schema);
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