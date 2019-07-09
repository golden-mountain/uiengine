import _ from "lodash";
import { IPluginExecutionConfig } from "../../../typings";
import { DataPool, DataEngine } from "..";

export function formatSource(source: string, prefix?: string) {
  const formatted = _.trim(source.replace(":", "."), ".");
  if (prefix) {
    return `${prefix}.${formatted}`;
  }
  return formatted;
}

export function getDomainName(id: any) {
  if (id && _.isString(id)) {
    const splitter = id.indexOf(":") > -1 ? ":" : ".";
    let [schemaPath] = id.split(splitter);
    return _.snakeCase(schemaPath);
  } else {
    return "$dummy";
  }
}

export async function submitToAPI(
  dataSources: Array<string>,
  method: string = "post"
) {
  let result = {};
  let responses: any = [];
  const dataPool = DataPool.getInstance();
  const dataEngine = DataEngine.getInstance();
  dataSources.forEach((source: string) => {
    result = _.merge(result, dataPool.get(source, true));
    result = dataEngine.sendRequest(source, result, method, false);
    responses.push(result);
  });

  responses = await Promise.all(responses);
  return responses;
}

export function submitToPool(
  dataSources: Array<string>,
  connectWith: string = ""
) {
  let result = {};
  const dataPool = DataPool.getInstance();
  dataSources.forEach((source: string) => {
    result = _.merge(result, dataPool.get(source, true));
    dataPool.set(result, connectWith);
  });
  return result;
}
