export function listener(name: string, listener: any) {}

listener.get = function(name: string) {
  console.log("get a listener");
};

listener.set = function(listeners: string | object, listener?: any) {
  console.log("set an listener or a group of listeners");
};
