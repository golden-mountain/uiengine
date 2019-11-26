export const defaultRequestConfig = {
  // axios config
  baseURL: 'http://localhost:3000/',
  timeout: 1000,

  // customized config
  devMode: false,
  dataSchemaPrefix: 'schema/data/',
  mockDataPrefix: '',
  realDataPrefix: '',
  uiSchemaPrefix: 'schema/ui/',
  headers: {},
}

export default defaultRequestConfig
