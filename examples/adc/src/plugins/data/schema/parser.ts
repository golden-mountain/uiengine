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
  console.log(rootSchema, "........");
  let name = dataNode.source.replace(":", ".");
  const regex = /\[\d+\]/;
  name = name.replace(regex, "");
  return _.get(rootSchema, `definition.${name}`);
};

export const schemaParser: IPlugin = {
  type: "data.schema.parser",
  initialize: false,
  callback,
  name: "parse-schema"
};
