import { IUINode } from "../UINode";
import { IErrorInfo } from "../Request";

export interface IUIEngineProps {
  layouts: any;
  [anyKey: string]: any;
}

export interface IUIEngineStates {
  nodes: Array<IUINodeRenderer>;
  activeNodeID: string;
  error?: IErrorInfo;
  [anyKey: string]: any;
}
