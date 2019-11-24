const plugin: any = function(this: any, name: string, plugin?: any) {
  if (!plugin) {
    return this.get(name);
  }
  return this.set(name, plugin);
};

plugin.prototype.get = function(name?: string) {
  console.log("get a plugin");
};

plugin.prototype.set = function(plugins?: any, plugin?: any) {
  console.log("set array of plugins or an plugin");
};

plugin.set = (plugins: string | object, plugin?: any) => {
  return new plugin(plugins, plugin);
};

plugin.get = (name: string) => {
  return new plugin(name);
};
export default plugin;
