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
  id: string;
  children: Array<IUINode>;
  isLiveChildren: boolean;
  loadLayout(schema: ILayoutSchema | string);
  loadRemoteLayout(url: stringremoteURL): Promise<AxiosPromise>;
  loadData(source: string);
  getSchema(): ILayoutSchema;
  replaceLayout(newSchema: ILayoutSchema | string);
  updateLayout();
  genLiveLayout(schema: ILayoutSchema, data: any);
  clearLayout();
  getChildren(route?: Array<Number>);
  getDataNode(): IDataNode;
  getNode(path?: string);
  updateState();
  getStateNode(): IStateNode;
  searchNodes(prop: object, root?: string);
  // getProps(): INodeProps;
}
