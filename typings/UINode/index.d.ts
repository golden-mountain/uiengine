interface INodeProps {}

interface ILayoutSchema {
  component?: string;
  children?: Array<ILayoutSchema>;
  name?: string;
  props?: object;
  [key: string]: any;
}

interface IUINode {
  loadLayout(schema: ILayoutSchema | string);
  loadRemoteLayout(url: stringremoteURL): Promise<AxiosPromise>;
  loadData(source: string);
  getSchema(): ILayoutSchema;
  replaceLayout(newSchema: ILayoutSchema | string): IUINode;
  updateLayout(): IUINode;
  genLiveLayout();
  clearLayout(): IUINode;
  getDataNode(): IDataNode;
  getNode(path?: string): IUINode;
  // getProps(): INodeProps;
}
