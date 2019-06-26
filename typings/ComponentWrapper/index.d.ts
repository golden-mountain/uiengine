import { IUINode } from "../UINode";

export interface IComponentWrapper {
  uiNode: IUINode;
  key?: string;
  [anyKey: string]: any;
}
