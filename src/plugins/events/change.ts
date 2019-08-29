import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = (uiNode: IUINode) => {
  return (e: any, options: any) => {
    if (e.stopPropagation) {
      e.stopPropagation();
    }
    let value;
    if (e.target) {
      value = e.target.value;
    } else {
      value = e;
    }
    uiNode.dataNode.updateData(value);
  };
};

export const change: IPlugin = {
  type: "ui.parser.event",
  priority: 100,
  callback,
  name: "change"
};
