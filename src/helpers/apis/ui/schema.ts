export const schema: any = function(this: any, name: string, value?: any) {
  return this.get(name);
};

schema.prototype.set = function(name: string, value: any) {};
schema.prototype.get = function(name: String) {};
schema.prototype.update = function(schemaobject: any) {};

export default schema;
