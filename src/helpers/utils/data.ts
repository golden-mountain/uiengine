import _ from "lodash";
import { DataPool, DataEngine, searchNodes } from "..";
import { IDataSource, IPluginExecutionConfig } from "../../../typings";

/**
 * convert a.b.c:d to a.b.c.d
 * if Prefix provided, convert to prefix.a.b.c.d
 * @param source
 * @param prefix
 */
export function formatSource(source: string, prefix?: string) {
  const formatted = _.trim(source.replace(":", "."), ".");
  if (prefix) {
    return `${prefix}.${formatted}`;
  }
  return formatted;
}

/**
 * convert id to a_b_c
 *
 * @param id a.b.c:d
 */
export function getDomainName(
  id: IDataSource | string,
  snakeCase: boolean = true
) {
  // it's a IDataSource
  // {source: "slb.virtual-server:template-policy", autoload: true}
  if (typeof id === "object") {
    id = _.get(id, "source", "");
  }

  if (id && _.isString(id)) {
    const splitter = id.indexOf(":") > -1 ? ":" : ".";
    let [schemaPath] = id.split(splitter);
    if (snakeCase) {
      return _.snakeCase(schemaPath);
    } else {
      return schemaPath;
    }
  } else {
    return "$dummy";
  }
}

/**
 * convert source to a.b.c.
 * @param source
 */
export function parseSchemaPath(source: string) {
  let schemaPath = getDomainName(source, false);
  return `${schemaPath}.json`;
}

/**
 * Convert source to a_b_c
 *
 * @param source
 * @param parsePath
 */
export function parseCacheID(source: string, parsePath: boolean = true) {
  let path = source;
  if (parsePath) {
    path = parseSchemaPath(source);
  }
  return _.snakeCase(path);
}

/**
 * export to a_b_c
 *
 * @param root like a-b-c.json
 */
export function parseRootName(root: string) {
  root = root.replace(".json", "");
  return _.snakeCase(root);
}

export async function submitToAPI(
  dataSources: Array<IDataSource>,
  method: string = "post"
) {
  let result = {};
  let responses: any = [];
  const dataPool = DataPool.getInstance();
  const dataEngine = DataEngine.getInstance();
  for (let index in dataSources) {
    const source = dataSources[index];
    result = _.merge(result, dataPool.get(source.source, true));
    result = await dataEngine.sendRequest(source, result, method, false);
    if (result !== false) responses.push(result);
  }

  return responses;
}

export async function validateAll(dataSources: Array<any>) {
  let validateResults: any = [];
  // dataSources.forEach((dataSource: any) => {
  for (let j in dataSources) {
    let dataSource = dataSources[j];
    const props = {
      datasource: dataSource
    };
    const nodes = searchNodes(props);
    // nodes.forEach((uiNode: IUINode) => {
    for (let i in nodes) {
      const uiNode = nodes[i];
      // check data from update plugins
      const exeConfig: IPluginExecutionConfig = {
        stopWhenEmpty: true,
        returnLastValue: true
      };
      const errorInfo = uiNode.dataNode.pluginManager.executeSyncPlugins(
        "data.update.could",
        exeConfig
      );
      if (errorInfo) {
        uiNode.dataNode.errorInfo = errorInfo;
        validateResults.push(errorInfo);
        // await uiNode.updateLayout();
        await uiNode.pluginManager.executePlugins("ui.parser");
        uiNode.sendMessage(true);
      }
    }
  }
  return validateResults;
}
