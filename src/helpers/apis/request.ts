export function request(path: string, configObject?: any) {
  return request.get(name, configObject);
}

request.get = function(path: string, configObject?: any) {
  console.log("get a request");
};
