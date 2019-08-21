import { IUINode, IStateInfo } from "../UINode";

export interface IComponentWrapper {
  uiNode: IUINode;
  key?: string;
  [anyKey: string]: any;
}

export interface IComponentWrapperProps {
  uinode: IUINode;
  key?: string;
}

// used cross modules
export interface IComponentState extends IStateInfo {}
