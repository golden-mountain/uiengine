const listener: any = function(this: any, name: string, listener?: any) {
  if (!listener) {
    return this.get(name);
  }
  return this.set(name, listener);
};

listener.prototype.get = function(name: string) {
  console.log("get a listener");
};

listener.prototype.set = function(listeners: string | object, listener?: any) {
  console.log("set an listener or a group of listeners");
};

listener.set = (listeners: string | object, listener?: any) => {
  return new listener(listeners, listener);
};

listener.get = (name: string) => {
  return new listener(name);
};

export default listener;
