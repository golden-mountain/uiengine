/* global describe, it, before */

import chai from 'chai'
import chaiSpies from 'chai-spies'
import _ from 'lodash'

import { HandlerManager } from '../../src/helpers/HandlerManager'
import {
  IHandlerConfig,
  IHandlerParam,
  IHandlerHelper,
  IEventConfig,
} from '../../typings'

chai.use(chaiSpies)
const expect = chai.expect

const handlerA1: IHandlerConfig = {
  name: 'hello',
  paramKeys: ['target'],
  debugList: ['target'],
  handler: (directParam: IHandlerParam, helper: IHandlerHelper) => {
    const target = _.get(directParam, 'target')
    if (!_.isNil(target)) {
      return `Hello ${target}!`
    }
  },
  weight: 0,
}

const handlerA2: IHandlerConfig = {
  name: 'hello',
  paramKeys: ['target', 'source'],
  debugList: ['target', 'source'],
  handler: (directParam: IHandlerParam, helper: IHandlerHelper) => {
    const target = _.get(directParam, 'target')
    const source = _.get(directParam, 'source')
    if (!_.isNil(target) && !_.isNil(source)) {
      return `Hello ${target}! This is ${source}.`
    }
  },
  weight: 1,
}

const handlerB1: IHandlerConfig = {
  name: 'weather',
  paramKeys: ['weather'],
  debugList: ['weather'],
  handler: (directParam: IHandlerParam, helper: IHandlerHelper) => {
    const weather = _.get(directParam, 'weather')
    if (weather === true) {
      return 'It is a good day!'
    } else {
      return 'It is a bad day?'
    }
  },
  weight: 0,
}

const handlerB2: IHandlerConfig = {
  name: 'weather',
  paramKeys: ['event', 'weather'],
  debugList: ['event', 'weather'],
  handler: (directParam: IHandlerParam, helper: IHandlerHelper) => {
    const target = _.get(directParam, 'event.target')
    const weather = _.get(directParam, 'weather')
    if (weather === true) {
      return `The weather ${_.isString(target) && target ? `in ${target} ` : ''}is good today.`
    } else {
      return `The weather ${_.isString(target) && target ? `in ${target} ` : ''}is bad today.`
    }
  },
  weight: 1,
}

const handlerC1: IHandlerConfig = {
  name: 'goodbye',
  paramKeys: ['date'],
  debugList: ['date'],
  handler: async (directParam: IHandlerParam, helper: IHandlerHelper) => {
    const date = _.get(directParam, 'date')
    return await new Promise((resolve) => {
      setTimeout(() => {
        if (!_.isNil(date)) {
          resolve(`Good bye, see you ${date}!`)
        } else {
          resolve(`Good bye!`)
        }
      }, 100)
    })
  },
  weight: 0,
}

describe('HandlerManager Unit Test:', () => {
  before(() => {
    const manager = HandlerManager.getInstance()
    manager.setHistoryCapacity(10)
  })
  beforeEach(() => {
  })

  describe('Test load and unload:', () => {
    it('should get the instance successfully:', () => {
      const manager = HandlerManager.getInstance()
      expect(manager).to.exist
    })
    it('should load one plugin successfully:', () => {
      const manager = HandlerManager.getInstance()
      const success = manager.loadHandlers(handlerA1)
      const loadedHandler = manager.getHandlerConfig('hello')
      expect(success).to.equal(true)
      expect(loadedHandler).to.deep.equal(handlerA1)
    })
    it('should load plugins successfully:', () => {
      const manager = HandlerManager.getInstance()
      const success = manager.loadHandlers([handlerA1, handlerB1])
      const helloHandler = manager.getHandlerConfig('hello')
      const weatherHandler = manager.getHandlerConfig('weather')
      expect(success).to.equal(true)
      expect(helloHandler).to.deep.equal(handlerA1)
      expect(weatherHandler).to.deep.equal(handlerB1)
    })
    it('should load the plugin with higher weight successfully:', () => {
      const manager = HandlerManager.getInstance()
      const success = manager.loadHandlers([handlerA1, handlerA2, handlerA1])
      const loadedPlugin = manager.getHandlerConfig('hello')
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal(handlerA2)
    })
    it('should unload the plugin successfully:', () => {
      const manager = HandlerManager.getInstance()
      const success = manager.loadHandlers([handlerA1, handlerA2, handlerB1, handlerB2, handlerC1])
      expect(success).to.equal(true)

      expect(manager.getHandlerConfig('hello')).to.deep.equal(handlerA2)
      expect(manager.unloadHandlers('hello')).to.equal(true)
      expect(manager.getHandlerConfig('hello')).to.equal(null)

      expect(manager.getHandlerConfig('weather')).to.deep.equal(handlerB2)
      expect(manager.unloadHandlers('weather')).to.equal(true)
      expect(manager.getHandlerConfig('weather')).to.equal(null)

      expect(manager.getHandlerConfig('goodbye')).to.deep.equal(handlerC1)
      expect(manager.unloadHandlers('Goodbye')).to.equal(true)
      expect(manager.getHandlerConfig('goodbye')).to.deep.equal(handlerC1)
    })
  })

  describe('Test static event props:', () => {
    it('should call the single handler successfully:', () => {
      const manager = HandlerManager.getInstance()
      manager.loadHandlers([handlerA1, handlerB1, handlerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        defaultParams: { target: 'Tom', source: 'Jason' },
        debugList: ['target', 'source'],
        target: 'Button1',
        handler: 'hello',
      }
      const props = manager.getStaticEventProps(eventConfig)

      manager.loadHandlers([handlerA2, handlerB2])
      eventConfig.eventName = 'onFocus'
      if (!_.isNil(eventConfig.defaultParams)) {
        eventConfig.defaultParams.target = 'Peter'
        eventConfig.defaultParams = { weather: true }
      }
      eventConfig.target = 'Button2'
      eventConfig.handler = 'weather'

      const result = props.onClick()
      expect(result).to.deep.equal({
        eventName: 'onClick',
        target: 'Button1',
        queue: ['hello'],
        results: [
          {
            handlerName: 'hello',
            result: 'Hello Tom!',
          }
        ],
      })
    })

    it('should call the multiple handlers successfully:', () => {
      const manager = HandlerManager.getInstance()
      manager.loadHandlers([handlerA1, handlerB1, handlerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        receiveParams: ['target', 'source', 'weather'],
        defaultParams: { target: '', source: '', weather: false },
        debugList: ['target', 'source', 'weather'],
        target: 'Button1',
        handler: ['hello', 'weather'],
      }
      const props = manager.getStaticEventProps(eventConfig)

      manager.loadHandlers([handlerA2, handlerB2])
      eventConfig.eventName = 'onFocus'
      eventConfig.receiveParams = []
      if (!_.isNil(eventConfig.defaultParams)) {
        eventConfig.defaultParams.target = 'Peter'
        eventConfig.defaultParams = { date: 'next week' }
      }
      eventConfig.target = 'Button2'
      eventConfig.handler = 'goodbye'

      const result = props.onClick('Tom', 'Jason', true)

      expect(result).to.deep.equal({
        eventName: 'onClick',
        target: 'Button1',
        queue: ['hello', 'weather'],
        results: [
          {
            handlerName: 'hello',
            result: 'Hello Tom!',
          },
          {
            handlerName: 'weather',
            result: 'It is a good day!',
          }
        ],
      })
    })
  })

  describe('Test dynamic event handler:', () => {
    it('should call the single handler successfully:', () => {
      const manager = HandlerManager.getInstance()
      manager.loadHandlers([handlerA1, handlerB1, handlerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        receiveParams: ['target', 'source'],
        defaultParams: { target: 'Tom', source: 'Jason' },
        debugList: ['target', 'source'],
        target: 'Button1',
        handler: 'hello',
      }
      const handler = manager.getDynamicEventHandler(eventConfig)

      manager.loadHandlers([handlerA2, handlerB2])
      eventConfig.defaultParams = { target: 'Peter', source: 'John' }
      const hResult = handler()
      expect(hResult).to.deep.equal({
        eventName: 'onClick',
        target: 'Button1',
        queue: ['hello'],
        results: [
          {
            handlerName: 'hello',
            result: 'Hello Peter! This is John.',
          }
        ],
      })

      eventConfig.eventName = 'onFocus'
      eventConfig.receiveParams = ['weather', 'event']
      eventConfig.defaultParams = { weather: false }
      eventConfig.target = 'Button2'
      eventConfig.handler = 'weather'
      const wResult = handler(true, { target: 'Beijing' })
      expect(wResult).to.deep.equal({
        eventName: 'onFocus',
        target: 'Button2',
        queue: ['weather'],
        results: [
          {
            handlerName: 'weather',
            result: 'The weather in Beijing is good today.',
          }
        ],
      })

    })

    it('should call the multiple handlers successfully:', (done: any) => {
      const manager = HandlerManager.getInstance()
      manager.loadHandlers([handlerA1, handlerB1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        defaultParams: { target: 'Tom', source: 'Jason', weather: true },
        debugList: ['target', 'source', 'weather'],
        target: 'Button1',
        handler: ['hello', 'weather'],
      }
      const handler = manager.getDynamicEventHandler(eventConfig)

      manager.loadHandlers([handlerA2, handlerB2, handlerC1])
      eventConfig.eventName = 'onFocus'
      eventConfig.receiveParams = ['event']
      eventConfig.defaultParams = { target: 'Peter', source: 'John', weather: false, date: 'next week' }
      eventConfig.target = 'Button2'
      eventConfig.handler = ['hello', 'weather', 'goodbye']

      const result = handler({ target: 'Beijing' })
      const promise = result.results[2].result
      promise.then(() => {
        try {
          expect(result).to.deep.equal({
            eventName: 'onFocus',
            target: 'Button2',
            queue: ['hello' ,'weather', 'goodbye'],
            results: [
              {
                handlerName: 'hello',
                result: 'Hello Peter! This is John.',
              },
              {
                handlerName: 'weather',
                result: 'The weather in Beijing is bad today.',
              },
              {
                handlerName: 'goodbye',
                result: 'Good bye, see you next week!',
              },
            ],
          })
          done()
        } catch(e) {
          done(e)
        }
      })
    })
  })

  describe('Test history and debug:', () => {
    it('should store the event record and debug info successfully:', (done: any) => {
      const manager = HandlerManager.getInstance()
      manager.loadHandlers([handlerA2, handlerB2, handlerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        receiveParams: ['event'],
        defaultParams: { target: 'Tom', source: 'Jason', weather: false, date: 'tomorrow' },
        debugList: ['target', 'source', 'weather', 'date', 'event'],
        target: 'Button1',
        handler: ['hello', 'weather', 'goodbye'],
      }
      const props = manager.getStaticEventProps([eventConfig])
      const result = props.onClick({ type: 'click', target: 'NewYork' })
      const promise = result.results[2].result

      promise.then(() => {
        try {
          expect(result).to.deep.equal({
            eventName: 'onClick',
            target: 'Button1',
            queue: ['hello', 'weather', 'goodbye'],
            results: [
              {
                handlerName: 'hello',
                result: 'Hello Tom! This is Jason.',
              },
              {
                handlerName: 'weather',
                result: 'The weather in NewYork is bad today.',
              },
              {
                handlerName: 'goodbye',
                result: 'Good bye, see you tomorrow!',
              },
            ],
          })

          let historyRecords: any = manager.searchHistoryRecords()
          let expectRecord: any = {
            eventName: 'onClick',
            target: 'Button1',
            originInfo: { target: 'Tom', source: 'Jason', weather: false, date: 'tomorrow', event: { type: 'click', target: 'NewYork' } },
            finialInfo: { target: 'Tom', source: 'Jason', weather: false, date: 'tomorrow', event: { type: 'click', target: 'NewYork' } },
            queue: ['hello', 'weather', 'goodbye'],
            records: [
              {
                handlerName: 'hello',
                originInfo: { target: 'Tom', source: 'Jason' },
                finialInfo: { target: 'Tom', source: 'Jason' },
                result: 'Hello Tom! This is Jason.',
              },
              {
                handlerName: 'weather',
                originInfo: { weather: false, event: { type: 'click', target: 'NewYork' } },
                finialInfo: { weather: false, event: { type: 'click', target: 'NewYork' } },
                result: 'The weather in NewYork is bad today.',
              },
              {
                handlerName: 'goodbye',
                originInfo: { date: 'tomorrow' },
                finialInfo: { date: 'tomorrow' },
                result: 'Good bye, see you tomorrow!',
              },
            ],
            startNumber: 1,
            storeNumber: 1,
          }
          expectRecord.records.forEach((item: any) => {
            item.eventRecord = expectRecord
          })
          expect(historyRecords).to.deep.equal([
            expectRecord,
          ])

          historyRecords = manager.exportHistoryRecords({ struct: 'sequence' })
          expect(historyRecords).to.deep.equal([
            expectRecord,
          ])

          historyRecords = manager.exportHistoryRecords({ struct: 'target-tree' })
          expect(historyRecords).to.deep.equal({
            Button1: [expectRecord],
          })

          historyRecords = manager.exportHistoryRecords({ struct: 'target-event-tree' })
          expect(historyRecords).to.deep.equal({
            Button1: {
              onClick: [expectRecord],
            },
          })

          historyRecords = manager.exportHistoryRecords({ struct: 'event-tree' })
          expect(historyRecords).to.deep.equal({
            onClick: [expectRecord],
          })

          historyRecords = manager.exportHistoryRecords({ struct: 'event-target-tree' })
          expect(historyRecords).to.deep.equal({
            onClick: {
              Button1: [expectRecord],
            },
          })

          historyRecords = manager.exportHistoryRecords({ struct: 'handler-tree' })
          expect(historyRecords).to.deep.equal({
            hello: [expectRecord.records[0]],
            weather: [expectRecord.records[1]],
            goodbye: [expectRecord.records[2]],
          })

          done()
        } catch(e) {
          done(e)
        }
      })
    })
  })

  afterEach(() => {
    const manager = HandlerManager.getInstance()
    manager.unloadHandlers()
    manager.resetHistory()
  })
  after(() => {
  })
})
