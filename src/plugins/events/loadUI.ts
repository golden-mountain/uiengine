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
    return nodeController.workflow.activeLayout(layout, {
      container,
      parentNode: uiNode
    });
  };
};

export const loadLayout: IPlugin = {
  type: "ui.parser.event",
  priority: 0,
  callback,
  name: "loadUI"
};
