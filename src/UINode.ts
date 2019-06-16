import { Request } from ".";

export default class UINode {
  private schema: object = {};
  private request: IRequest;

  constructor(schema: object | string, requestConfig?: object) {
    this.request = new Request(requestConfig);

    if (typeof schema === "object") {
      this.schema = schema;
    } else {
      // need remote load
      this.loadLayout(schema);
    }
  }

  getSchema() {
    return this.schema;
  }

  async loadLayout(url: string) {
    let response: any = await this.request.get(url);
    if (response.data) {
      this.schema = response.data;
    } else {
      this.schema = {
        error: `Error loading from ${url}`
      };
    }
    return response;
  }
}
