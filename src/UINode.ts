import _ from "lodash";
import { Request, DataNode } from ".";
import { AxiosPromise } from "axios";
import { IDataNode, IDataSource } from "../typings/DataNode";

export default class UINode implements IUINode {
  private errorInfo: object = {};
  private request: IRequest = new Request();
  private children: Array<UINode> = [];
  private schema: ILayoutSchema = {};
  private dataNode?: any;
  private data: any;

  constructor(schema: ILayoutSchema, request?: IRequest) {
    if (request) {
      this.request = request;
    }

    if (typeof schema === "object") {
      this.assignSchema(schema);
    } else {
      this.schema = this.loadLayout(schema);
    }
  }

  getSchema(): ILayoutSchema {
    return this.schema;
  }

  async loadLayout(url: string): Promise<AxiosPromise> {
    let response: any = await this.request.get(url);
    // console.log(response);
    if (response.data) {
      this.assignSchema(response.data);
    } else {
      this.errorInfo = {
        error: `Error loading from ${url}`
      };
    }
    // this.schema = response;
    return response;
  }

  private assignSchema(schema: ILayoutSchema) {
    if (schema.children) {
      this.children = schema.children.map((s: any) => {
        return new UINode(s);
      });
    }
    if (schema["datasource"]) {
      this.loadData(schema.datasource);
    }
    this.schema = schema;
  }

  loadData(source: string): IUINode {
    const dataSource: IDataSource = { isURL: true, value: source };
    this.dataNode = new DataNode(dataSource, this.request);
    return this;
  }

  getDataNode(): IDataNode {
    return this.dataNode;
  }
}
