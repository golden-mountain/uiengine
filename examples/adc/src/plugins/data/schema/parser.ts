import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";

/**
 * get cm lineage by UI schema
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  console.log("executed on data schema parser");
  const rootSchema = dataNode.getRootSchema();
  let name = dataNode.source.replace(":", ".");
  const regex = /\[\d+\]/;
  name = name.replace(regex, "");
  let result = _.get(rootSchema, `fields`, []).filter((schema: any) => {
    return schema["cm-lineage"] === name;
  });

  // parse data schema deps
  result = result.pop();
  dataNode.schema = result;
  return result;
};

export const schemaParser: IPlugin = {
  type: "data.schema.parser",
  weight: 100,
  callback,
  name: "parse-schema"
};
