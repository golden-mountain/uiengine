import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "../../../../typings";

/**
 * return this node's schema, this is default schema parser
 * use plugin cause' we don't know exactly the schema definition
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const rootSchema = dataNode.getRootSchema();
  const { name = "" } = dataNode.source;
  return _.get(rootSchema, `definition.${name}`);
};

export const mock: IPlugin = {
  type: "data.schema.parser",
  initialize: false,
  callback,
  name: "parse-schema"
};
