import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  // console.log(uiNode.getSchema(), ">>>>>>.");
  const schema = uiNode.getSchema();
  const tplSchemaPath = _.get(schema, "$template");
  let result = {};
  if (tplSchemaPath) {
    const reqConfig = uiNode.getRequest().getConfig();
    let path = `${reqConfig.layoutSchemaPrefix}${tplSchemaPath}`;
    result = await uiNode.loadLayout(path);
  }
  return result;
};

export const template: IPlugin = {
  type: "ui.parser",
  initialize: false,
  callback,
  name: "template"
};
