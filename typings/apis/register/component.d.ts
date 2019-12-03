export interface IApiRegisterComponent {
  set: (components: any, libraryName?: string) => boolean;
  get: (name?: string) => any;
}
