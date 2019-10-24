/* global describe, it, before */

import chai from 'chai'
import chaiSpies from 'chai-spies'
import _ from 'lodash'

import { PluginManager } from '../../src/helpers/PluginManager'
import { IPlugin, IPluginExecutionHelper } from '../../typings'

chai.use(chaiSpies)
const expect = chai.expect

const pluginA1: IPlugin = {
  name: 'hello',
  categories: [{ name: 'say-hello', priority: 100 }],
  scopePaths: ['global'],
  paramKeys: ['target'],
  debugList: ['target'],
  execution: (param: any, helper: IPluginExecutionHelper) => {
    const target = _.get(param, 'target')
    if (!_.isNil(target)) {
      return `Hello ${target}!`
    }
  },
  priority: 0,
  weight: 0,
}

const pluginA2: IPlugin = {
  name: 'hello',
  categories: [{ name: 'say-hello', priority: 100 }],
  scopePaths: ['global'],
  paramKeys: ['target', 'source'],
  debugList: ['target', 'source'],
  execution: (param: any, helper: IPluginExecutionHelper) => {
    const target = _.get(param, 'target')
    const source = _.get(param, 'source')
    if (!_.isNil(target) && !_.isNil(source)) {
      return `Hello ${target}! This is ${source}.`
    }
  },
  priority: 0,
  weight: 1,
}

const pluginB1: IPlugin = {
  name: 'weather',
  categories: [{ name: 'say-hello', priority: 99 }],
  scopePaths: ['global'],
  paramKeys: ['weather'],
  debugList: ['weather'],
  execution: (param: any, helper: IPluginExecutionHelper) => {
    const weather = _.get(param, 'weather')
    if (weather === true) {
      return 'It is a good day!'
    } else {
      return 'It is a bad day?'
    }
  },
  priority: 0,
  weight: 0,
}

const pluginB2: IPlugin = {
  name: 'weather',
  categories: [{ name: 'say-hello', priority: 99 }],
  scopePaths: ['global.detail'],
  paramKeys: ['weather'],
  debugList: ['weather'],
  execution: (param: any, helper: IPluginExecutionHelper) => {
    const weather = _.get(param, 'weather')
    if (weather === true) {
      return 'It is a sunny day!'
    } else {
      return 'It is a raining day!'
    }
  },
  priority: 1,
  weight: 1,
}

const pluginC1: IPlugin = {
  name: 'goodbye',
  categories: ['say-goodbye'],
  scopePaths: ['global'],
  paramKeys: ['target'],
  debugList: ['target'],
  execution: (param: any, helper: IPluginExecutionHelper) => {
    const target = _.get(param, 'target')
    if (!_.isNil(target)) {
      return `Good bye, ${target}!`
    }
  },
  priority: 0,
  weight: 0,
}

const pluginD1: IPlugin = {
  name: 'timeout1',
  categories: ['timer'],
  scopePaths: ['global'],
  paramKeys: ['counter'],
  debugList: ['counter'],
  execution: async (param: any, helper: IPluginExecutionHelper) => {
    const counter: { count: number } = _.get(param, 'counter')
    if (_.isObject(counter)) {
      await new Promise((resolve) => {
        setTimeout(() => {
          counter.count = 1000
          resolve()
        }, 100)
      })
      return true
    }
    return false
  },
  priority: 0,
  weight: 0,
}

const pluginD2: IPlugin = {
  name: 'timeout2',
  categories: ['timer'],
  scopePaths: ['global'],
  paramKeys: ['counter'],
  debugList: ['counter'],
  execution: async (param: any, helper: IPluginExecutionHelper) => {
    const counter: { unit: string } = _.get(param, 'counter')
    if (_.isObject(counter)) {
      await new Promise((resolve) => {
        setTimeout(() => {
          counter.unit = 'kg'
          resolve()
        }, 100)
      })
      return true
    }
    return false
  },
  priority: 0,
  weight: 0,
}

describe('PluginManager Unit Test:', () => {
  before(() => {
  })
  beforeEach(() => {
  })

  describe('Test load and unload:', () => {
    it('should get the instance successfully:', () => {
      const manager = PluginManager.getInstance()
      expect(manager).to.exist
    })
    it('should load one plugin successfully:', () => {
      const manager = PluginManager.getInstance()
      const success = manager.loadPlugins([pluginA1])
      const loadedPlugin = manager.getPlugins('global', 'say-hello', 'hello')
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal(pluginA1)
    })
    it('should load plugins successfully:', () => {
      const manager = PluginManager.getInstance()
      const success = manager.loadPlugins([pluginA1, pluginB1])
      const loadedPlugin = manager.getPlugins('global', 'say-hello')
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal({
        'hello': pluginA1,
        'weather': pluginB1,
      })
    })
    it('should load the plugin with higher weight successfully:', () => {
      const manager = PluginManager.getInstance()
      const success = manager.loadPlugins([pluginA2, pluginA1])
      const loadedPlugin = manager.getPlugins('global', 'say-hello', 'hello')
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal(pluginA2)
    })
    it('should load the plugin to sub scope successfully:', () => {
      const manager = PluginManager.getInstance()
      const success = manager.loadPlugins([pluginB1, pluginB2])
      const loadedPlugin = manager.getPlugins()
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal({
        'global': {
          name: 'global',
          plugins: {
            'say-hello': {
              'weather': pluginB1
            }
          },
          subScopes: {
            'detail': {
              name: 'detail',
              plugins: {
                'say-hello': {
                  'weather': pluginB2
                }
              }
            }
          }
        }
      })
    })
    it('should unload the plugin successfully:', () => {
      const manager = PluginManager.getInstance()
      const success = manager.loadPlugins([pluginA1, pluginA2, pluginB1, pluginB2, pluginC1])
      let loadedPlugin = manager.getPlugins()
      expect(success).to.equal(true)
      expect(loadedPlugin).to.deep.equal({
        'global': {
          name: 'global',
          plugins: {
            'say-hello': {
              hello: pluginA2,
              weather: pluginB1,
            },
            'say-goodbye': {
              goodbye: pluginC1,
            }
          },
          subScopes: {
            'detail': {
              name: 'detail',
              plugins: {
                'say-hello': {
                  weather: pluginB2
                }
              }
            }
          }
        }
      })

      let result
      result = manager.unloadPlugins('global.detail', 'say-hello', 'weather')
      expect(result).to.equal(true)
      result = manager.unloadPlugins('global', 'say-hello', 'weather')
      expect(result).to.equal(true)
      loadedPlugin = manager.getPlugins()
      expect(loadedPlugin).to.deep.equal({
        'global': {
          name: 'global',
          plugins: {
            'say-hello': {
              hello: pluginA2,
            },
            'say-goodbye': {
              goodbye: pluginC1,
            }
          },
          subScopes: {
            'detail': {
              name: 'detail',
              plugins: {
                'say-hello': {}
              }
            }
          }
        }
      })

      result = manager.unloadPlugins('global', 'say-hello')
      expect(result).to.equal(true)
      result = manager.unloadPlugins('global.detail', 'say-hello')
      expect(result).to.equal(true)
      loadedPlugin = manager.getPlugins()
      expect(loadedPlugin).to.deep.equal({
        'global': {
          name: 'global',
          plugins: {
            'say-goodbye': {
              goodbye: pluginC1,
            }
          },
          subScopes: {
            'detail': {
              name: 'detail',
              plugins: {}
            }
          }
        }
      })

      result = manager.unloadPlugins('global.detail')
      expect(result).to.equal(true)
      result = manager.unloadPlugins('global')
      expect(result).to.equal(true)
      loadedPlugin = manager.getPlugins()
      expect(loadedPlugin).to.deep.equal({
        'global': {
          name: 'global',
          plugins: {},
          subScopes: {
            'detail': {
              name: 'detail',
              plugins: {}
            }
          }
        }
      })
    })
  })

  describe('Test register and unregister:', () => {
    it('should register the id successfully:', () => {
      const manager = PluginManager.getInstance()
      const success = manager.register('Jason', { categories: [ 'say-hello', 'say-goodbye' ] })
      expect(success).to.equal(true)
      const info = manager.getRegisterInfo('Jason')
      expect(info).to.deep.equal({
        categories: [ 'say-hello', 'say-goodbye' ],
        scopePaths: [ 'global' ],
      })
    })
    it('should unregister the id successfully:', () => {
      const manager = PluginManager.getInstance()
      let success = manager.register('Jason', { categories: [ 'say-hello', 'say-goodbye' ] })
      expect(success).to.equal(true)

      success = manager.unregister('Jason')
      expect(success).to.equal(true)
      const info = manager.getRegisterInfo('Jason')
      expect(info).to.deep.equal(null)
    })
  })

  describe('Test sync execute', () => {
    it('should sync-execute the single sync-plugin successfully:', () => {
      const manager = PluginManager.getInstance()
      manager.register('Jason')

      const result = manager.syncExecutePlugin('Jason', pluginA1, { target: 'Tom' })
      expect(result).to.deep.equal({
        status: 'COMPLETED',
        results: [
          {
            name: 'hello',
            result: 'Hello Tom!'
          }
        ]
      })
    })

    it('should sync-execute the single async-plugin successfully:', (done: any) => {
      const manager = PluginManager.getInstance()
      manager.register('Jason')

      const counter = {}
      const result = manager.syncExecutePlugin('Jason', pluginD1, { counter })
      const promise = result.results[0].result
      expect(result).to.deep.equal({
        status: 'COMPLETED',
        results: [
          {
            name: 'timeout1',
            result: promise
          }
        ]
      })
      if (promise instanceof Promise) {
        promise.then((data: any) => {
          try {
            expect(data).to.deep.equal(true)
            expect(counter).to.deep.equal({ count: 1000 })
            done()
          } catch(e) {
            done(e)
          }
        })
      } else {
        expect(promise).to.deep.equal(true)
        expect(counter).to.deep.equal({ count: 1000 })
        done()
      }
    })

    it('should sync-execute the plugins of one category successfully:', () => {
      const manager = PluginManager.getInstance()
      manager.loadPlugins([pluginA1, pluginA2, pluginB1, pluginB2, pluginC1])

      manager.register('Jason', { categories: ['say-hello'], scopePaths: ['global'] })
      manager.register('Tom', { categories: ['say-hello'], scopePaths: ['global.detail'] })

      const resultJ = manager.syncExecutePlugins('Jason', 'say-hello', { source: 'Jason', target: 'Tom', weather: true })
      const resultT = manager.syncExecutePlugins('Tom', 'say-hello', { source: 'Tom', target: 'Jason', weather: true })
      expect(resultJ).to.deep.equal({
        status: 'COMPLETED',
        results: [
          {
            name: 'hello',
            result: 'Hello Tom! This is Jason.'
          },
          {
            name: 'weather',
            result: 'It is a good day!'
          },
        ]
      })
      expect(resultT).to.deep.equal({
        status: 'COMPLETED',
        results: [
          {
            name: 'hello',
            result: 'Hello Jason! This is Tom.'
          },
          {
            name: 'weather',
            result: 'It is a sunny day!'
          },
        ]
      })
    })
  })

  describe('Test async execute', () => {
    it('should async-execute the single sync-plugin successfully:', (done: any) => {
      const manager = PluginManager.getInstance()
      manager.register('Jason')

      const promise = manager.executePlugin('Jason', pluginA1, { target: 'Tom' })
      promise.then((result) => {
        try {
          expect(result).to.deep.equal({
            status: 'COMPLETED',
            results: [{
              name: 'hello',
              result: 'Hello Tom!'
            }]
          })
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('should async-execute the single async-plugin successfully:', (done: any) => {
      const manager = PluginManager.getInstance()
      manager.register('Jason')

      const counter = {}
      const promise = manager.executePlugin('Jason', pluginD1, { counter })

      promise.then((data) => {
        try {
          expect(data).to.deep.equal({
            status: 'COMPLETED',
            results: [
              {
                name: 'timeout1',
                result: true
              }
            ]
          })
          expect(counter).to.deep.equal({ count: 1000 })
          done()
        } catch(e) {
          done(e)
        }
      })
    })

    it('should async-execute the plugins of one category successfully:', (done: any) => {
      const manager = PluginManager.getInstance()
      manager.loadPlugins([pluginD1, pluginD2])
      manager.register('Jason', { categories: [ 'timer' ] })

      const counter = {}
      const promise = manager.executePlugins('Jason', 'timer', { counter })
      promise.then((result) => {
        try {
          expect(result).to.deep.equal({
            status: 'COMPLETED',
            results: [
              {
                name: 'timeout1',
                result: true
              },
              {
                name: 'timeout2',
                result: true
              },
            ]
          })
          expect(counter).to.deep.equal({
            count: 1000,
            unit: 'kg'
          })
          done()
        } catch(e) {
          done(e)
        }
      })
    })
  })

  describe('Test debug', () => {
    it('should store the debug info successfully', () => {
      const manager = PluginManager.getInstance()
      manager.loadPlugins([pluginA1, pluginA2, pluginB1, pluginB2, pluginC1])

      manager.register('Jason', { categories: ['say-hello'], scopePaths: ['global'] })

      const resultJ = manager.syncExecutePlugins('Jason', 'say-hello', { source: 'Jason', target: 'Tom', weather: true })
      expect(resultJ).to.deep.equal({
        status: 'COMPLETED',
        results: [
          {
            name: 'hello',
            result: 'Hello Tom! This is Jason.'
          },
          {
            name: 'weather',
            result: 'It is a good day!'
          },
        ]
      })
      const records = manager.searchHistoryRecords('Jason', 'say-hello')
      expect(records).to.deep.equal([
        {
          id: 'Jason',
          category: 'say-hello',
          queue: ['hello', 'weather'],
          records: [
            {
              pluginName: 'hello',
              originInfo: { target: 'Tom', source: 'Jason' },
              finialInfo: { target: 'Tom', source: 'Jason' },
              result: 'Hello Tom! This is Jason.'
            },
            {
              pluginName: 'weather',
              originInfo: { weather: true },
              finialInfo: { weather: true },
              result: 'It is a good day!'
            }
          ],
          startNumber: 1,
          storeNumber: 1,
        }
      ])
      const icMap = manager.exportHistoryRecords({ struct: 'id-category-tree' })
      expect(icMap).to.deep.equal({
        'Jason': {
          'say-hello': [
            {
              id: 'Jason',
              category: 'say-hello',
              queue: ['hello', 'weather'],
              records: [
                {
                  pluginName: 'hello',
                  originInfo: { target: 'Tom', source: 'Jason' },
                  finialInfo: { target: 'Tom', source: 'Jason' },
                  result: 'Hello Tom! This is Jason.'
                },
                {
                  pluginName: 'weather',
                  originInfo: { weather: true },
                  finialInfo: { weather: true },
                  result: 'It is a good day!'
                }
              ],
              startNumber: 1,
              storeNumber: 1,
            }
          ]
        }
      })
      const ciMap = manager.exportHistoryRecords({ struct: 'category-id-tree' })
      expect(ciMap).to.deep.equal({
        'say-hello': {
          'Jason': [
            {
              id: 'Jason',
              category: 'say-hello',
              queue: ['hello', 'weather'],
              records: [
                {
                  pluginName: 'hello',
                  originInfo: { target: 'Tom', source: 'Jason' },
                  finialInfo: { target: 'Tom', source: 'Jason' },
                  result: 'Hello Tom! This is Jason.'
                },
                {
                  pluginName: 'weather',
                  originInfo: { weather: true },
                  finialInfo: { weather: true },
                  result: 'It is a good day!'
                }
              ],
              startNumber: 1,
              storeNumber: 1,
            }
          ]
        }
      })
    })
  })

  afterEach(() => {
    const manager = PluginManager.getInstance()
    manager.unloadPlugins('global')
    manager.unloadPlugins('global.detail')
    manager.resetHistory()
  })
  after(() => {
  })
})
