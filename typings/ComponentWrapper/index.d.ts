import { IUINode } from "../UINode";

export interface IComponentWrapper {
  uiNode?: IUINode;
  key?: string;
  [anyKey: string]: any;
}

// used cross modules
export interface IComponentState {
  state?: IState;
  data?: any;
}
