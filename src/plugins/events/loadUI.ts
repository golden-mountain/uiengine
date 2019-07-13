import _ from "lodash";
import { NodeController } from "../..";
import { IPluginFunc, IPlugin, IUINode } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  return (e: any, options: any) => {
    // console.log(uiNode.schema, options, "... on loadUI plugin");
    const { layout, container } = options;
    if (!layout) {
      return false;
    }
    const nodeController = NodeController.getInstance();
    const workflow = nodeController.workflow;
    return workflow.activeLayout(layout, { container });
  };
};

export const loadLayout: IPlugin = {
  type: "ui.parser.event",
  weight: 0,
  callback,
  name: "loadUI"
};
