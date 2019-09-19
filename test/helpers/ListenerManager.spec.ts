/* global describe, it, before */

import chai from 'chai'
import chaiSpies from 'chai-spies'
import _ from 'lodash'

import { ListenerManager } from '../../src/helpers/ListenerManager'
import {
  IListenerConfig,
  IListenerParam,
  IListenerHelper,
  IEventConfig,
} from '../../typings'

chai.use(chaiSpies)
const expect = chai.expect

const listenerA1: IListenerConfig = {
  name: 'hello',
  paramKeys: ['target'],
  debugList: ['target'],
  listener: (directParam: IListenerParam, helper: IListenerHelper) => {
    const target = _.get(directParam, 'target')
    if (!_.isNil(target)) {
      return `Hello ${target}!`
    }
  },
  weight: 0,
}

const listenerA2: IListenerConfig = {
  name: 'hello',
  paramKeys: ['target', 'source'],
  debugList: ['target', 'source'],
  listener: (directParam: IListenerParam, helper: IListenerHelper) => {
    const target = _.get(directParam, 'target')
    const source = _.get(directParam, 'source')
    if (!_.isNil(target) && !_.isNil(source)) {
      return `Hello ${target}! This is ${source}.`
    }
  },
  weight: 1,
}

const listenerB1: IListenerConfig = {
  name: 'weather',
  paramKeys: ['weather'],
  debugList: ['weather'],
  listener: (directParam: IListenerParam, helper: IListenerHelper) => {
    const weather = _.get(directParam, 'weather')
    if (weather === true) {
      return 'It is a good day!'
    } else {
      return 'It is a bad day?'
    }
  },
  weight: 0,
}

const listenerB2: IListenerConfig = {
  name: 'weather',
  paramKeys: ['event', 'weather'],
  debugList: ['event', 'weather'],
  listener: (directParam: IListenerParam, helper: IListenerHelper) => {
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

const listenerC1: IListenerConfig = {
  name: 'goodbye',
  paramKeys: ['date'],
  debugList: ['date'],
  listener: async (directParam: IListenerParam, helper: IListenerHelper) => {
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

describe('ListenerManager Unit Test:', () => {
  before(() => {
    const manager = ListenerManager.getInstance()
    manager.setHistoryCapacity(10)
  })
  beforeEach(() => {
  })

  describe('Test load and unload:', () => {
    it('should get the instance successfully:', () => {
      const manager = ListenerManager.getInstance()
      expect(manager).to.exist
    })
    it('should load one plugin successfully:', () => {
      const manager = ListenerManager.getInstance()
      const success = manager.loadListeners(listenerA1)
      const loadedListener = manager.getListenerConfig('hello')
      expect(success).to.equal(true)
      expect(loadedListener).to.deep.equal(listenerA1)
    })
    it('should load plugins successfully:', () => {
      const manager = ListenerManager.getInstance()
      const success = manager.loadListeners([listenerA1, listenerB1])
      const helloListener = manager.getListenerConfig('hello')
      const weatherListener = manager.getListenerConfig('weather')
      expect(success).to.equal(true)
      expect(helloListener).to.deep.equal(listenerA1)
      expect(weatherListener).to.deep.equal(listenerB1)
    })
    it('should load the plugin with higher weight successfully:', () => {
      const manager = ListenerManager.getInstance()
      const success = manager.loadListeners([listenerA1, listenerA2, listenerA1])
      const loadedPlugin = manager.getListenerConfig('hello')
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal(listenerA2)
    })
    it('should unload the plugin successfully:', () => {
      const manager = ListenerManager.getInstance()
      const success = manager.loadListeners([listenerA1, listenerA2, listenerB1, listenerB2, listenerC1])
      expect(success).to.equal(true)

      expect(manager.getListenerConfig('hello')).to.deep.equal(listenerA2)
      expect(manager.unloadListeners('hello')).to.equal(true)
      expect(manager.getListenerConfig('hello')).to.equal(null)

      expect(manager.getListenerConfig('weather')).to.deep.equal(listenerB2)
      expect(manager.unloadListeners('weather')).to.equal(true)
      expect(manager.getListenerConfig('weather')).to.equal(null)

      expect(manager.getListenerConfig('goodbye')).to.deep.equal(listenerC1)
      expect(manager.unloadListeners('Goodbye')).to.equal(true)
      expect(manager.getListenerConfig('goodbye')).to.deep.equal(listenerC1)
    })
  })

  describe('Test static event props:', () => {
    it('should call the single listener successfully:', () => {
      const manager = ListenerManager.getInstance()
      manager.loadListeners([listenerA1, listenerB1, listenerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        defaultParams: { target: 'Tom', source: 'Jason' },
        debugList: ['target', 'source'],
        target: 'Button1',
        listener: 'hello',
      }
      const props = manager.getStaticEventProps(eventConfig)

      manager.loadListeners([listenerA2, listenerB2])
      eventConfig.eventName = 'onFocus'
      if (!_.isNil(eventConfig.defaultParams)) {
        eventConfig.defaultParams.target = 'Peter'
        eventConfig.defaultParams = { weather: true }
      }
      eventConfig.target = 'Button2'
      eventConfig.listener = 'weather'

      const result = props.onClick()
      expect(result).to.deep.equal({
        eventName: 'onClick',
        target: 'Button1',
        queue: ['hello'],
        results: [
          {
            listenerName: 'hello',
            result: 'Hello Tom!',
          }
        ],
      })
    })

    it('should call the multiple listeners successfully:', () => {
      const manager = ListenerManager.getInstance()
      manager.loadListeners([listenerA1, listenerB1, listenerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        receiveParams: ['target', 'source', 'weather'],
        defaultParams: { target: '', source: '', weather: false },
        debugList: ['target', 'source', 'weather'],
        target: 'Button1',
        listener: ['hello', 'weather'],
      }
      const props = manager.getStaticEventProps(eventConfig)

      manager.loadListeners([listenerA2, listenerB2])
      eventConfig.eventName = 'onFocus'
      eventConfig.receiveParams = []
      if (!_.isNil(eventConfig.defaultParams)) {
        eventConfig.defaultParams.target = 'Peter'
        eventConfig.defaultParams = { date: 'next week' }
      }
      eventConfig.target = 'Button2'
      eventConfig.listener = 'goodbye'

      const result = props.onClick('Tom', 'Jason', true)

      expect(result).to.deep.equal({
        eventName: 'onClick',
        target: 'Button1',
        queue: ['hello', 'weather'],
        results: [
          {
            listenerName: 'hello',
            result: 'Hello Tom!',
          },
          {
            listenerName: 'weather',
            result: 'It is a good day!',
          }
        ],
      })
    })
  })

  describe('Test dynamic event listener:', () => {
    it('should call the single listener successfully:', () => {
      const manager = ListenerManager.getInstance()
      manager.loadListeners([listenerA1, listenerB1, listenerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        receiveParams: ['target', 'source'],
        defaultParams: { target: 'Tom', source: 'Jason' },
        debugList: ['target', 'source'],
        target: 'Button1',
        listener: 'hello',
      }
      const listener = manager.getDynamicEventListener(eventConfig)

      manager.loadListeners([listenerA2, listenerB2])
      eventConfig.defaultParams = { target: 'Peter', source: 'John' }
      const hResult = listener()
      expect(hResult).to.deep.equal({
        eventName: 'onClick',
        target: 'Button1',
        queue: ['hello'],
        results: [
          {
            listenerName: 'hello',
            result: 'Hello Peter! This is John.',
          }
        ],
      })

      eventConfig.eventName = 'onFocus'
      eventConfig.receiveParams = ['weather', 'event']
      eventConfig.defaultParams = { weather: false }
      eventConfig.target = 'Button2'
      eventConfig.listener = 'weather'
      const wResult = listener(true, { target: 'Beijing' })
      expect(wResult).to.deep.equal({
        eventName: 'onFocus',
        target: 'Button2',
        queue: ['weather'],
        results: [
          {
            listenerName: 'weather',
            result: 'The weather in Beijing is good today.',
          }
        ],
      })

    })

    it('should call the multiple listeners successfully:', (done: any) => {
      const manager = ListenerManager.getInstance()
      manager.loadListeners([listenerA1, listenerB1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        defaultParams: { target: 'Tom', source: 'Jason', weather: true },
        debugList: ['target', 'source', 'weather'],
        target: 'Button1',
        listener: ['hello', 'weather'],
      }
      const listener = manager.getDynamicEventListener(eventConfig)

      manager.loadListeners([listenerA2, listenerB2, listenerC1])
      eventConfig.eventName = 'onFocus'
      eventConfig.receiveParams = ['event']
      eventConfig.defaultParams = { target: 'Peter', source: 'John', weather: false, date: 'next week' }
      eventConfig.target = 'Button2'
      eventConfig.listener = ['hello', 'weather', 'goodbye']

      const result = listener({ target: 'Beijing' })
      const promise = result.results[2].result
      promise.then(() => {
        try {
          expect(result).to.deep.equal({
            eventName: 'onFocus',
            target: 'Button2',
            queue: ['hello' ,'weather', 'goodbye'],
            results: [
              {
                listenerName: 'hello',
                result: 'Hello Peter! This is John.',
              },
              {
                listenerName: 'weather',
                result: 'The weather in Beijing is bad today.',
              },
              {
                listenerName: 'goodbye',
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
      const manager = ListenerManager.getInstance()
      manager.loadListeners([listenerA2, listenerB2, listenerC1])

      const eventConfig: IEventConfig = {
        eventName: 'onClick',
        receiveParams: ['event'],
        defaultParams: { target: 'Tom', source: 'Jason', weather: false, date: 'tomorrow' },
        debugList: ['target', 'source', 'weather', 'date', 'event'],
        target: 'Button1',
        listener: ['hello', 'weather', 'goodbye'],
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
                listenerName: 'hello',
                result: 'Hello Tom! This is Jason.',
              },
              {
                listenerName: 'weather',
                result: 'The weather in NewYork is bad today.',
              },
              {
                listenerName: 'goodbye',
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
                listenerName: 'hello',
                originInfo: { target: 'Tom', source: 'Jason' },
                finialInfo: { target: 'Tom', source: 'Jason' },
                result: 'Hello Tom! This is Jason.',
              },
              {
                listenerName: 'weather',
                originInfo: { weather: false, event: { type: 'click', target: 'NewYork' } },
                finialInfo: { weather: false, event: { type: 'click', target: 'NewYork' } },
                result: 'The weather in NewYork is bad today.',
              },
              {
                listenerName: 'goodbye',
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

          historyRecords = manager.exportHistoryRecords({ struct: 'listener-tree' })
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
    const manager = ListenerManager.getInstance()
    manager.unloadListeners()
    manager.resetHistory()
  })
  after(() => {
  })
})
