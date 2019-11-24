const component: any = function(
  this: any,
  name: string | object,
  component?: any
) {
  if (!component) {
    return this.get(name);
  }
  return this.set(name, component);
};

component.prototype.get = function(name: string) {
  console.log("get a component");
};

component.prototype.set = function(
  components: string | object,
  component?: any
) {
  console.log("set one or group components");
};

component.get = function(name: string) {
  return new component(name);
};

component.set = function(coms: string | object, com?: any) {
  return new component(coms, com);
};

export default component;
