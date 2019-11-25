export interface IApiRegisterListener {
  set: (
    listeners: IListenerConfig[] | IListenerMap,
    manager?: IListenerManager
  ) => boolean;
  // name is the listener name
  get: (name?: string) => IListener;
}
