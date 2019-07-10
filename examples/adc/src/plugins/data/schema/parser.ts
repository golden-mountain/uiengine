import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";

/**
 * get cm lineage by UI schema
 *
 * @param dataNode
 */
const callback: IPluginFunc = (dataNode: IDataNode) => {
  const rootSchema = dataNode.getRootSchema();
  let name = dataNode.source.source.replace(":", ".");
  const regex = /\[\d+\]/;
  name = name.replace(regex, "");
  // console.log(_.cloneDeep(rootSchema), name);
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
  weight: 99,
  callback,
  name: "parse-schema"
};
