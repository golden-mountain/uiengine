// import _ from "lodash";
import { NodeController } from "UIEngine";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

const callback: IPluginFunc = (uiNode: IUINode) => {
  return (e: any, options: any) => {
    console.log(options);
  };
};

export const submitToPool: IPlugin = {
  type: "ui.parser.event",
  weight: 100,
  callback,
  name: "submitToPool"
};
