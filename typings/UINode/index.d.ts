interface INodeProps {}

interface ILayoutSchema {
  component?: string;
  children?: Array<ILayoutSchema>;
  name?: string;
  props?: object;
  [key: string]: any;
}

interface IUINode {
  loadLayout(url: stringremoteURL): Promise<AxiosPromise>;
  loadData(source: string): IUINode;
  getSchema(): ILayoutSchema;
  // replaceLayout(): IUINode;
  // updateLayout(): IUINode;
  // genLiveLayout(): IUINode;
  // deleteLayout(): IUINode;
  getDataNode(): IDataNode;
  // getNode(path?: string): IUINode;
  // getProps(): INodeProps;
}
