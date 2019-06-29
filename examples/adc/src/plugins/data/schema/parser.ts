import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const rootSchema = dataNode.getRootSchema();
  let name = dataNode.source.replace(":", ".");
  const regex = /\[\d+\]/;
  name = name.replace(regex, "");
  let result = _.get(rootSchema, `fields`, []).filter((schema: any) => {
    return schema["cm-lineage"] === name;
  });
  return result.pop();
};

export const schemaParser: IPlugin = {
  type: "data.schema.parser",
  initialize: 100,
  callback,
  name: "parse-schema"
};
