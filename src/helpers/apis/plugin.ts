export const plugin: any = function(name: string) {
  return plugin.info(name);
};

plugin.info = function(name: string) {
  console.log("get a request");
};
