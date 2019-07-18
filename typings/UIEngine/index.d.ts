import { IUINode } from "../UINode";

export interface IUIEngineProps {
  layouts: any;
  [anyKey: string]: any;
}

export interface IUIEngineStates {
  nodes: Array<IUINodeRenderer>;
  activeNodeID: string;
  [anyKey: string]: any;
}
