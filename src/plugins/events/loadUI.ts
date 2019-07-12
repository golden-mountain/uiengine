import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    console.log(uiNode.schema, options, "... on loadUI plugin");
  };
};

export const loadLayout: IPlugin = {
  type: "ui.parser.event",
  weight: 0,
  callback,
  name: "loadUI"
};
