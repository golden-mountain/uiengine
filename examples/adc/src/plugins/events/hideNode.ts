// import _ from "lodash";
import { NodeController } from "uiengine";
import { IPluginFunc, IPlugin, IUINode } from "uiengine/typings";

const callback: IPluginFunc = (uiNode: IUINode) => {
  return (e: any, options: any) => {
    const nodeController = NodeController.getInstance();
    nodeController.workflow.deactiveLayout();
  };
};

export const hideNode: IPlugin = {
  type: "ui.parser.event",
  priority: 100,
  callback,
  name: "hideNode"
};
