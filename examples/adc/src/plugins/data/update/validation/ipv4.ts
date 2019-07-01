import _ from "lodash";
import { IPluginFunc, IPlugin, IDataNode } from "UIEngine/typings";

const callback: IPluginFunc = (dataNode: IDataNode) => {
  const data = dataNode.data;
  const format = dataNode.getSchema("cm-meta.format");
  let result = true,
    errorMessage = "";
  if (format === "ipv4-address") {
    result = /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/.test(
      data
    );
    if (!result) errorMessage = `Error input ipv4`;
  }

  return { status: result, code: errorMessage };
};

export const ipv4: IPlugin = {
  type: "data.update.could",
  weight: 100,
  callback,
  name: "ipv4"
};
