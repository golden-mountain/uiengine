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

export const request: IPlugin = {
  type: "ui.parser.event",
  initialize: false,
  callback,
  name: "request"
};
