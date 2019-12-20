export interface IApiRegisterHandler {
  set: (
    handlers: IHandlerConfig[] | IHandlerMap,
    manager?: IHandlerManager
  ) => boolean;
  // name is the handler name
  get: (name?: string) => IHandler;
}
