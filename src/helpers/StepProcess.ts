import _ from 'lodash'
import {
  IStepConfig,
  IStepExecution,
  IExecutionResult,
  IExecutionHelper,
  IStepOption,
  IStepController,
  IControllerResult,
  IControllerHelper,
  IGlobalOption,
  IStepRecord,
  IStepResult,
} from '../../typings'

interface IStepIndex {
  [key: string]: number
}

interface IStepCache {
  key: string
  count: number
  config: IStepConfig
}

type ProcessStatus = 'PENDING' | 'INITING' | 'IN_PROGRESS' | 'PAUSED' | 'TERMINATED' | 'IN_ERROR'

export default class StepProcess {
  private stepMap: IStepIndex = {}
  private stepQueue: IStepCache[] = []
  private options: IGlobalOption = {}

  private currentStatus: ProcessStatus = 'PENDING'
  private totalCount: number = 0
  private history: IStepRecord[] = []

  constructor(steps: IStepConfig[], options?: IGlobalOption) {
    this.init(steps, options)
  }

  private reset() {
    this.stepMap = {}
    this.stepQueue = []
    this.options = {}

    this.currentStatus = 'PENDING'
    this.totalCount = 0
    this.history = []
  }

  private init(steps: IStepConfig[], globalOptions?: IGlobalOption) {
    this.reset()

    // init start
    this.currentStatus = 'INITING'
    const hasStepConfig = _.isArray(steps) && !_.isEmpty(steps)
    if (hasStepConfig) {
      steps.forEach((step: IStepConfig) => {
        if (_.isObject(step)) {
          const { name, params, execution, options, controller } = step
          if (_.isFunction(execution)) {
            const key = _.isString(name) ? name : _.uniqueId('step')
            const length = this.stepQueue.push({
              key,
              count: 0,
              config: {
                name: key,
                params,
                execution,
              }
            })
            this.stepMap[key] = length - 1

            // Copy step options
            const stepOptions: IStepOption = {}
            if (_.isObject(options) && !_.isEmpty(options)) {
              const { nextStep, maxStepCount } = options
              if (_.isString(nextStep)) {
                const step = steps.find((step: IStepConfig) => {
                  return step.name === nextStep
                })
                if (step) {
                  stepOptions.nextStep = nextStep
                }
              } else if (_.isObject(nextStep) && !_.isEmpty(nextStep)) {
                const stepJumpConfig = {}
                _.forIn(nextStep, (stepName: string, status: string) => {
                  const step = steps.find((step: IStepConfig) => {
                    return step.name === stepName
                  })
                  if (step) {
                    stepJumpConfig[status] = stepName
                  }
                })
                if (!_.isEmpty(stepJumpConfig)) {
                  stepOptions.nextStep = stepJumpConfig
                }
              }

              if (_.isFinite(maxStepCount)) {
                stepOptions.maxStepCount = maxStepCount
              }
            }
            if (!_.isEmpty(stepOptions)) {
              this.stepQueue[length - 1].config.options = stepOptions
            }

            // link step controller
            if (_.isFunction(controller)) {
              this.stepQueue[length - 1].config.controller = controller
            }
          }
        }
      })
    }

    // copy global options
    const jumpConfig = _.get(globalOptions, 'jumpToStep', {})
    const jumpToStep = {}
    if (hasStepConfig && !_.isEmpty(jumpConfig)) {
      _.forIn(jumpConfig, (stepName: string, status: string) => {
        const step = steps.find((step: IStepConfig) => {
          return step.name === stepName
        })
        if (step) {
          jumpToStep[status] = stepName
        }
      })
    }
    this.options.jumpToStep = jumpToStep
    this.options.maxStepNum = _.get(globalOptions, 'maxStepNum', Number.MAX_SAFE_INTEGER)

    // init end
    this.currentStatus = 'PENDING'
  }

  private error(message: string) {
    const lastRecord = this.history[this.history.length - 1]
    this.currentStatus = 'IN_ERROR'
    return {
      status: this.currentStatus,
      errorInfo: message,
      lastStepNum: !_.isNil(lastRecord) ? lastRecord.stepNum : undefined,
      lastStep: !_.isNil(lastRecord) ? lastRecord.key : undefined,
      lastResult: !_.isNil(lastRecord) ? _.cloneDeep(lastRecord.result) : undefined,
      nextStep: !_.isNil(lastRecord) ? lastRecord.nextStep : undefined,
      history: _.cloneDeep(this.history),
    } as IStepResult
  }

  private getStepCount(defaultCount: number, name?: string) {
    if (_.isNil(name)) {
      return defaultCount
    } else {
      const stepIndex = _.get(this.stepMap, name)
      const stepCache = _.get(this.stepQueue, stepIndex, null)
      if (_.has(stepCache, 'count')) {
        return _.get(stepCache, 'count', null)
      } else {
        return null
      }
    }
  }

  private getHistory(defaultRecord: IStepRecord, stepNum?: number) {
    if (_.isNil(stepNum)) {
      return defaultRecord
    } else {
      const record = _.get(this.history, stepNum)
      if (_.isNil(record)) {
        return null
      }
      return record
    }
  }

  private controller(stepKey: string, stepResult: IExecutionResult, stepOption?: IStepOption) {
    // step option
    const nextStep = _.get(stepOption, 'nextStep')
    if (_.isString(nextStep) && !_.isEmpty(nextStep)) {
      return nextStep
    } else if (_.isObject(nextStep) && !_.isEmpty(nextStep)) {
      const status = _.get(stepResult, 'status')
      if (_.isString(status) && !_.isEmpty(status)) {
        const step = _.get(nextStep, status)
        if (_.isString(step) && !_.isEmpty(step)) {
          return step
        }
      }
    }

    // global option
    const jumpToStep = _.get(this.options, 'jumpToStep')
    if (_.isObject(jumpToStep) && !_.isEmpty(jumpToStep)) {
      const status = _.get(stepResult, 'status')
      if (_.isString(status) && !_.isEmpty(status)) {
        const step = _.get(jumpToStep, status)
        if (_.isString(step) && !_.isEmpty(step)) {
          return step
        }
      }
    }

    // default order
    const stepIndex = _.get(this.stepMap, stepKey)
    const nextStepCache = _.get(this.stepQueue, stepIndex + 1)
    if (_.isNil(nextStepCache)) {
      return null
    }
    return nextStepCache.key
  }

  async next(byStep?: boolean) {
    this.currentStatus = 'IN_PROGRESS'

    // max total count
    const max: number = _.get(this.options, 'maxStepNum', Number.MAX_SAFE_INTEGER)
    if (_.isFinite(max) && this.totalCount >= max) {
      return this.error('Max count of total steps')
    }

    // search next step
    let nextStepCache: IStepCache | null = null
    let lastExeResult: IExecutionResult | null = null
    if (this.history.length === 0) {
      nextStepCache = _.get(this.stepQueue, 0, null)
    } else {
      const lastStepNum = this.history.length - 1
      const lastStepRecord = this.history[lastStepNum]
      const { stepNum, key, result, nextStep } = lastStepRecord
      if (_.isNil(nextStep)) {
        this.currentStatus = 'TERMINATED'
        return {
          status: this.currentStatus,
          lastStepNum: stepNum,
          lastStep: key,
          lastResult: _.cloneDeep(result),
          nextStep,
          history: _.cloneDeep(this.history),
        } as IStepResult
      } else if (_.has(this.stepMap, nextStep)) {
        const nextIndex = _.get(this.stepMap, nextStep)
        nextStepCache = _.get(this.stepQueue, nextIndex, null)
        lastExeResult = result
      } else {
        this.currentStatus = 'IN_ERROR'
        return {
          status: this.currentStatus,
          errorInfo: `Can\'t solve next step ${nextStep}`,
          lastStepNum: stepNum,
          lastStep: key,
          lastResult: _.cloneDeep(result),
          nextStep,
          history: _.cloneDeep(this.history),
        } as IStepResult
      }
    }
    if (_.isNil(nextStepCache)) {
      return this.error('Can\'t find next step config')
    }

    const { key, count, config } = nextStepCache
    const { params, execution, options, controller } = config
    if (_.isFunction(execution)) {
      try {
        // max step count
        const maxStepCount: number = _.get(options, 'maxStepCount', Number.MAX_SAFE_INTEGER)
        if (_.isFinite(maxStepCount) && count >= maxStepCount) {
          return this.error(`Max count of step ${key}`)
        }

        // execute
        const eHelper: IExecutionHelper = {
          getLastResult: () => lastExeResult as IExecutionResult,
        }
        const exeResult = await execution(params, eHelper)
        nextStepCache.count = count + 1

        const record: IStepRecord = {
          stepNum: this.totalCount + 1,
          key,
          result: exeResult,
          nextStep: null,
        }
        this.history.push(record)
        this.totalCount++

        try {
          // control
          let nextStep: string | null = null
          if (_.isFunction(controller)) {
            const cHelper: IControllerHelper = {
              getExecutionResult: () => exeResult,
              getStepCount: this.getStepCount.bind(this, nextStepCache.count),
              getHistory: this.getHistory.bind(this, record),
            }
            const conResult = await controller(this.totalCount, cHelper)
            const next = _.get(conResult, 'nextStep', null)
            if (_.isString(next) && !_.isEmpty(next)) {
              nextStep = next
            } else {
              nextStep = this.controller(key, exeResult, options)
            }
          } else {
            nextStep = this.controller(key, exeResult, options)
          }
          record.nextStep = nextStep
        } catch(e) {
          console.log(e)
          return this.error(`Error occurs in controller of step ${key}`)
        }

      } catch(e) {
        console.log(e)
        return this.error(`Error occurs in execution of step ${key}`)
      }
    } else {
      return this.error(`Can\'t find execution of step ${key}`)
    }

    // next entry
    if (byStep === true) {
      const { stepNum, key, result, nextStep } = this.history[this.history.length - 1]
      this.currentStatus = 'PAUSED'
      return {
        status: this.currentStatus,
        lastStepNum: stepNum,
        lastStep: key,
        lastResult: _.cloneDeep(result),
        nextStep,
        history: _.cloneDeep(this.history),
      } as IStepResult
    }

    const nextResult: IStepResult = await this.next()
    return nextResult
  }
}
