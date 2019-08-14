// import _ from "lodash";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

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
  weight: 100,
  callback,
  name: "change"
};
