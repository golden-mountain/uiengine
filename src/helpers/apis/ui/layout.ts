import { ILayoutSchema } from "../../../../typings";

export const layout: any = function(this: any, name: string) {
  return this.get(name);
};

layout.prototype.active = function(name?: string) {
  return this.get(name);
};

layout.prototype.get = function(name?: string) {
  console.log("get a layout");
};

layout.select = function(name?: string) {
  return this.get(name);
};

layout.replaceWith = function(layoutObject?: ILayoutSchema) {
  // return this.get(name);
};

// static methods
layout.active = (name?: string) => {
  return new layout(name).active();
};
layout.get = (name?: string) => {
  return new layout(name);
};

layout.select = (name?: string) => {
  return new layout(name);
};

export default layout;
