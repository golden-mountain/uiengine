import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
  };
};

export const routeTo: IPlugin = {
  type: "ui.parser.event",
  weight: 0,
  callback,
  name: "routeTo"
};
