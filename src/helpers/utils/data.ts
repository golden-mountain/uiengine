import _ from "lodash";
import { DataPool, DataEngine } from "..";

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
export function getDomainName(id: any, snakeCase: boolean = true) {
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

export function parseCacheID(source: string, parsePath: boolean = true) {
  let path = source;
  if (parsePath) {
    path = parseSchemaPath(source);
  }
  return _.snakeCase(path);
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
    result = dataEngine.sendRequest({ source }, result, method, false);
    responses.push(result);
  });

  responses = await Promise.all(responses);
  return responses;
}
