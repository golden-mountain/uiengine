import { IUIEngineConfig } from "../UIEngine";
import { IUINode, IStateInfo } from "../UINode";

export interface IComponentWrapperProps {
  uiNode: IUINode;
  config?: IUIEngineConfig;
  key?: string;
  [anyKey: string]: any;
}

// used cross modules
export interface IComponentWrapperState extends IStateInfo {
}

export interface IWrappedComponentProps {
  uinode: IUINode;
  key?: string;
  [anyKey: string]: any;
}
