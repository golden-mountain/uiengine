
// StepProcess interfaces
export interface IStepConfig {
  name?: string
  params?: any
  execution: IStepExecution
  options?: IStepOption
  controller?: IStepController
}

export type IStepExecution = (params: any, helper: IExecutionHelper) => IExecutionResult | Promise<IExecutionResult>
export interface IExecutionResult {
  status?: string
  [anyKey: string]: any
}
export interface IExecutionHelper {
  getLastResult: () => IExecutionResult
}

export interface IStepOption {
  nextStep?: string | { [status: string]: string }
  maxStepCount?: number
}

export type IStepController = (stepNum: number, helper: IControllerHelper) => IControllerResult | Promise<IControllerResult>
export interface IControllerResult {
  nextStep?: string
}
export interface IControllerHelper {
  getExecutionResult: () => IExecutionResult
  getStepCount: (name?: string) => number | null
  getHistory: (stepNum?: number) => IStepRecord | null
}

export interface IGlobalOption {
  jumpToStep?: { [status: string]: string }
  maxStepNum?: number
}

export interface IStepRecord {
  stepNum: number
  key: string
  result: IExecutionResult
  nextStep?: string | null
}

export interface IStepResult {
  status: ProcessStatus
  errorInfo?: string
  lastStepNum?: number
  lastStep?: string
  lastResult?: IExecutionResult
  nextStep?: string
  history: IStepRecord[]
}
