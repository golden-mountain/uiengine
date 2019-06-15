export default class UINode {
  private schema: object;

  constructor(schema: object) {
    this.schema = schema;
  }

  getSchema() {
    return this.schema;
  }
}
