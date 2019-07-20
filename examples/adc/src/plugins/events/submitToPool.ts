// import _ from "lodash";
import { Workflow } from "UIEngine";
import { IPluginFunc, IPlugin, IUINode } from "UIEngine/typings";

const callback: IPluginFunc = (uiNode: IUINode) => {
  return async (e: any, options: any) => {
    // console.log(options);
    const workflow = Workflow.getInstance();
    const result = await workflow.submitToPool(options);
    if (result) {
      workflow.deactiveLayout();
    }
  };
};

export const submitToPool: IPlugin = {
  type: "ui.parser.event",
  weight: 100,
  callback,
  name: "submitToPool"
};
