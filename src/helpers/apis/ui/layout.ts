export function layout(name: string) {
  return layout.get(name);
}

layout.get = function(name: string) {
  console.log("get a layout");
};
