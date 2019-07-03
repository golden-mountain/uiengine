import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }

    console.log(
      options,
      e,
      uiNode.dataNode.dataPool.get(options.target, false)
    );
  };
};

export const request: IPlugin = {
  type: "ui.parser.event",
  weight: 0,
  callback,
  name: "request"
};
