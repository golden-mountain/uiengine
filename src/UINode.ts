import { Request } from ".";

export default class UINode {
  private schema: object = {};
  private request: IRequest;

  constructor(schema: object | string) {
    if (typeof schema === "object") {
      this.schema = schema;
    } else {
      // need remote load
      this.loadLayout(schema);
    }
    this.request = new Request({});
  }

  getSchema() {
    return this.schema;
  }

  loadLayout(url: string) {}
}
