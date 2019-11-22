export function component(name: string, component: any) {}

component.get = function(name: string) {
  console.log("get a component");
};

component.set = function(components: string | object, component?: any) {
  console.log("set one or group components");
};
