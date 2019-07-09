import _ from "lodash";
import { IPluginExecutionConfig } from "../../typings";

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

// export async function submit(
//   dataSources: Array<string>,
//   method: string = "post",
//   connectWith?: string
// ) {
//   const exeConfig: IPluginExecutionConfig = {
//     stopWhenEmpty: true,
//     returnLastValue: true
//   };
//   const couldSubmit = await this.pluginManager.executePlugins(
//     "data.commit.could",
//     exeConfig
//   );
//   if (couldSubmit !== undefined && !couldSubmit.status) {
//     return couldSubmit;
//   }
//   let result = {};
//   let responses: any = [];
//   dataSources.forEach((source: string) => {
//     // const cacheID = this.formatCacheID(source);
//     result = _.merge(result, this.dataPool.get(source, true));
//     // remote?
//     if (connectWith === undefined) {
//       result = this.dataEngine.sendRequest(source, result, method, false);
//       responses.push(result);
//     } else {
//       this.dataPool.set(result, connectWith);
//     }
//   });

//   if (connectWith === undefined) {
//     responses = await Promise.all(responses);
//     return responses;
//   }
//   return result;
// }
