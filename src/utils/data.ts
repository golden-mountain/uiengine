import _ from "lodash";

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
