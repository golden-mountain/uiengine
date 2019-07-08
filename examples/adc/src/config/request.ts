const reqConfig = {
  // axios config
  baseURL: "http://localhost:3000/",
  timeout: 1000,

  // customize config
  devMode: false,
  dataSchemaPrefix: "schema/data/",
  dataPathPrefix: "",
  layoutSchemaPrefix: "schema/ui/",
  headers: {}
};

export default reqConfig;
