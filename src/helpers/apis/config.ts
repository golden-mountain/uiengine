export const config: any = function(name: string, config: any) {};

config.get = function(name: string) {
  console.log("get a config");
};

config.set = function(configs: string | object, value: any) {
  console.log("set config");
};
