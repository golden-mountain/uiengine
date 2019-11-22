export function plugin(name: string, plugin: any) {}

plugin.get = function(name?: string) {
  console.log("get a plugin");
};
