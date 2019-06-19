export interface INodeProps {}

export interface ILayoutSchema {
  component?: string;
  children?: Array<ILayoutSchema>;
  _children?: Array<ILayoutSchema>;
  name?: string;
  props?: object;
  [key: string]: any;
}

export interface IUINode {
  loadLayout(schema: ILayoutSchema | string);
  loadRemoteLayout(url: stringremoteURL): Promise<AxiosPromise>;
  loadData(source: string);
  getSchema(): ILayoutSchema;
  getLiveSchema(): ILayoutSchema;
  getRootSchema(): ILayoutSchema;
  replaceLayout(newSchema: ILayoutSchema | string);
  updateLayout();
  genLiveLayout(schema: ILayoutSchema, data: any);
  clearLayout();
  getDataNode(): IDataNode;
  getNode(path?: string);
  updateState();
  getStateNode(): IStateNode;
  // getProps(): INodeProps;
}
