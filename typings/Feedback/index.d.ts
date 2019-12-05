
export interface IFeedbacker {
  (type: string, info: any, feedbacks: IFeedbackResult[]): any
}

export interface IFeedbackConfig {
  name: string
  priority?: number
  feedbacker: IFeedbacker
}
export interface IFeedbackList {
  [name: string]: IFeedbackConfig
}
export interface IFeedbackMap {
  [type: string]: IFeedbackList
}

export interface IFeedbackSendOption {
  include?: string|string[]
  exclude?: string|string[]
  order?: string[]
}
export interface IFeedbackResult {
  name: string
  result: any
}

export interface IFeedback {
  send: (type: string, info: any, options?: IFeedbackSendOption) => IFeedbackResult[]

  inject: (type: string, feedbacker: IFeedbacker|IFeedbackConfig) => string
  eject: (type: string, name?: string) => void

  search: (type?: string, name?: string) => IFeedbackMap|IFeedbackList|IFeedbackConfig
}
