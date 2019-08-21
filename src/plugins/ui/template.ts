import _ from "lodash";
import { IUINode } from "../../../typings";
import { IPluginFunc, IPlugin } from "../../../typings";

const callback: IPluginFunc = async (uiNode: IUINode) => {
  // console.log(uiNode.getSchema(), ">>>>>>.");
  const schema = uiNode.getSchema();
  const tplSchemaPath = _.get(schema, "$template");
  let result = {};
  if (tplSchemaPath) {
    const reqConfig = uiNode.request.getConfig();
    let path = `${reqConfig.layoutSchemaPrefix}${tplSchemaPath}`;
    let response: any = await uiNode.request.get(path);
    if (response.data) {
      result = response.data;
      // Cache.setLayoutSchema(rootName, result);
      _.unset(uiNode.schema, "$template");
      _.forIn(result, (v, k) => {
        uiNode.schema[k] = v;
      });
      await uiNode.replaceLayout(uiNode.schema);
    }
  }
  return result;
};

export const template: IPlugin = {
  type: "ui.parser",
  priority: 0,
  callback,
  name: "template"
};
