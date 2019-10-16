/* global describe, it, before */

import chai from 'chai'
import chaiSpies from 'chai-spies'
import _ from 'lodash'

import { DataPool } from '../../src/helpers/DataPool'

chai.use(chaiSpies)
const expect = chai.expect

describe('DataPool Unit Test:', () => {
  before(() => {
  })
  beforeEach(() => {
  })

  describe('Test set and get function:', () => {
    it('should get the instance successfully:', () => {
      const dataPool = DataPool.getInstance()
      expect(dataPool).to.exist
    })
    it('should set and get the data value successfully:', () => {
      const dataPool = DataPool.getInstance()

      const firstSet = dataPool.set('a.b:c.d', 'this is d node')
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: 'this is d node'
                }
              }
            }
          }
        }
      )
      let data = dataPool.get('a.b:c.d')
      expect(data).to.equal('this is d node')
      data = dataPool.get('a.b:c.d', { withPath: true })
      expect(data).to.deep.equal(
        {
          a: {
            b: {
              c: {
                d: 'this is d node'
              }
            }
          }
        }
      )

      const secondSet = dataPool.set(
        'a.b:c.d.e',
        'this is d node',
        { createPath: false },
      )
      expect(secondSet).to.equal(false)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: 'this is d node'
                }
              }
            }
          }
        }
      )
      data = dataPool.get('a.b:c.d.e')
      expect(data).to.equal(undefined)

      const thirdSet = dataPool.set('a.b:c.d', { e: 'this is e node' })
      expect(thirdSet).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: {
                    e: 'this is e node'
                  }
                }
              }
            }
          }
        }
      )
      data = dataPool.get('a.b:c.d.e')
      expect(data).to.equal('this is e node')
      data = dataPool.get('a.b:c.d.e', { withPath: true })
      expect(data).to.deep.equal(
        {
          a: {
            b: {
              c: {
                d: {
                  e: 'this is e node'
                }
              }
            }
          }
        }
      )

      const forthSet = dataPool.set(
        'a.b:c.d.e',
        { f: 'this is f node, but it is not a dataPool node' },
        { createChild: false },
      )
      expect(forthSet).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: {
                    e: {
                      f: 'this is f node, but it is not a dataPool node'
                    }
                  }
                }
              }
            }
          }
        }
      )
      data = dataPool.get('a.b:c.d.e')
      expect(data).to.deep.equal(
        {
          f: 'this is f node, but it is not a dataPool node'
        }
      )
      data = dataPool.get('a.b:c.d.e', { withPath: true })
      expect(data).to.deep.equal(
        {
          a: {
            b: {
              c: {
                d: {
                  e: {
                    f: 'this is f node, but it is not a dataPool node'
                  }
                }
              }
            }
          }
        }
      )
      data = dataPool.get('a.b:c.d.e.f')
      expect(data).to.deep.equal(undefined)

      const fifthSet = dataPool.set(
        'a.b:c.d.e.f',
        'this is f node',
        { createPath: false },
      )
      expect(fifthSet).to.equal(false)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: {
                    e: {
                      f: 'this is f node, but it is not a dataPool node'
                    }
                  }
                }
              }
            }
          }
        }
      )

      const sixthSet = dataPool.set(
        '#a.b:',
        { root: 'this is the root node' },
        { createPath: false, createChild: false },
      )
      expect(sixthSet).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            root: 'this is the root node'
          }
        }
      )

    })
    it('should set and get the data info successfully:', () => {
      const dataPool = DataPool.getInstance()

      const firstSet = dataPool.set(
        '#a.b:',
        'this is root node',
        { dataInfo: { status: { value: 'create' } } }
      )
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: 'this is root node'
        }
      )
      let wholeInfo = dataPool.get(undefined, { content: 'status' })
      expect(wholeInfo).to.deep.equal(
        {
          a_b: 'create'
        }
      )

      const secondSet = dataPool.set('a.b:c1', 'this is c1 node', { dataInfo: { status: { value: 'create' } } })
      expect(secondSet).to.equal(true)
      const thirdSet = dataPool.set('a.b:c2', 'this is c2 node', { dataInfo: { status: { value: 'update' } } })
      expect(thirdSet).to.equal(true)
      const forthSet = dataPool.set('a.b:c3', 'this is c3 node', { dataInfo: { status: { value: 'delete' } } })
      expect(forthSet).to.equal(true)
      const fifthSet = dataPool.set('a.b:c4', 'this is c4 node', { dataInfo: { status: { value: 'view' } } })
      expect(fifthSet).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c1: 'this is c1 node',
                c2: 'this is c2 node',
                c3: 'this is c3 node',
                c4: 'this is c4 node',
              }
            }
          }
        }
      )
      let info = dataPool.get('a.b:c1', { content: 'status' })
      expect(info).to.equal('create')
      info = dataPool.get('a.b:c2', { content: 'status' })
      expect(info).to.equal('update')
      info = dataPool.get('a.b:c3', { content: 'status' })
      expect(info).to.equal('delete')
      info = dataPool.get('a.b:c4', { content: 'status' })
      expect(info).to.equal('view')

      const sixthSet = dataPool.set(
        'a.b:c.d',
        {
          d1: 'this is d1 node',
          d2: 'this is d2 node',
        },
        { dataInfo: { status: { defaultValue: 'create' } } }
      )
      expect(sixthSet).to.equal(true)
      info = dataPool.get('a.b:c.d', { content: 'status' })
      expect(info).to.equal('create')
      info = dataPool.get('a.b:c.d.d1', { content: 'status' })
      expect(info).to.equal('create')
      info = dataPool.get('a.b:c.d.d2', { content: 'status' })
      expect(info).to.equal('create')

      const seventhSet = dataPool.set(
        'a.b:c.d',
        {
          d1: 'this is updated d1 node',
          d2: 'this is updated d2 node',
        },
        { dataInfo: { status: { value: 'update' } } }
      )
      expect(seventhSet).to.equal(true)
      info = dataPool.get('a.b:c.d', { content: 'status' })
      expect(info).to.equal('update')
      info = dataPool.get('a.b:c.d.d1', { content: 'status' })
      expect(info).to.equal('update')
      info = dataPool.get('a.b:c.d.d2', { content: 'status' })
      expect(info).to.equal('update')

      const eighthSet = dataPool.set(
        'a.b:c.d',
        {
          d1: 'this is twice updated d1 node',
          d2: 'this is twice updated d2 node',
        },
        {
          dataInfo: {
            type: {
              setDataInfo: (path: string, data: any, prevInfo: string) => {
                if (typeof data === 'object') {
                  return 'branch node'
                }
                if (typeof data === 'string') {
                  return 'leaf node'
                }
                return prevInfo
              }
            }
          }
        }
      )
      expect(seventhSet).to.equal(true)
      info = dataPool.get('a.b:c.d', { content: 'type' })
      expect(info).to.equal('branch node')
      info = dataPool.get('a.b:c.d.d1', { content: 'type' })
      expect(info).to.equal('leaf node')
      info = dataPool.get('a.b:c.d.d2', { content: 'type' })
      expect(info).to.equal('leaf node')

    })
  })

  describe('Test clear function:', () => {
    it('should clear the data info successfully:', () => {
      const dataPool = DataPool.getInstance()
      const firstSet = dataPool.set(
        '#a.b:',
        {
          a: {
            b: {
              c1: 'this is c1 node',
              c2: 'this is c2 node',
              c3: 'this is c3 node',
              c4: 'this is c4 node',
            }
          }
        },
        { dataInfo: { status: { value: 'create' } } }
      )
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c1: 'this is c1 node',
                c2: 'this is c2 node',
                c3: 'this is c3 node',
                c4: 'this is c4 node',
              }
            }
          }
        }
      )

      dataPool.clear('a.b:c2')
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c1: 'this is c1 node',
                c3: 'this is c3 node',
                c4: 'this is c4 node',
              }
            }
          }
        }
      )

      dataPool.clear('a.b:')
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {}
          }
        }
      )

      dataPool.clear('#a.b:')
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal({})

    })
  })

  describe('Test transfer function:', () => {
    it('should transfer the data value successfully:', () => {
      const dataPool = DataPool.getInstance()
      const firstSet = dataPool.set(
        'a.b:c',
        {
          c1: 'this is c1 node',
          c2: 'this is c2 node',
          c3: 'this is c3 node',
          c4: 'this is c4 node',
        },
        { dataInfo: { status: { value: 'view' } } }
      )
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                }
              }
            }
          }
        }
      )

      const firstTransfer = dataPool.transfer('a.b:c', 'a.b:d', { createDst: true })
      expect(firstTransfer).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                },
                d: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                }
              }
            }
          }
        }
      )

      const secondTransfer = dataPool.transfer('a.b:d', 'a.b:e')
      expect(secondTransfer).to.equal(false)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                },
                d: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                }
              }
            }
          }
        }
      )

      const thirdTransfer = dataPool.transfer(
        'a.b:d',
        'a.b:e',
        { createDst: true, clearSrc: true }
      )
      expect(thirdTransfer).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                },
                e: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                }
              }
            }
          }
        }
      )

      const secondSet = dataPool.set(
        'a.b:c.c5',
        'this is c5 node of c',
        { dataInfo: { status: { value: 'create' } } }
      )
      expect(secondSet).to.equal(true)
      const thirdSet = dataPool.set(
        'a.b:e.c6',
        'this is c6 node of e',
        { dataInfo: { status: { value: 'create' } } }
      )
      expect(thirdSet).to.equal(true)
      const forthSet = dataPool.set(
        'a.b:d',
        {
          c5: 'this is c5 node of d'
        },
        { dataInfo: { status: { value: 'create' } } }
      )
      expect(forthSet).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                  c5: 'this is c5 node of c',
                },
                d: {
                  c5: 'this is c5 node of d',
                },
                e: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                  c6: 'this is c6 node of e',
                }
              }
            }
          }
        }
      )

      const forthTransfer = dataPool.transfer(
        'a.b:e',
        'a.b:c',
        { clearSrc: true }
      )
      expect(forthTransfer).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                  c6: 'this is c6 node of e',
                },
                d: {
                  c5: 'this is c5 node of d',
                },
              }
            }
          }
        }
      )

      const fifthTransfer = dataPool.transfer(
        'a.b:d',
        'a.b:c',
        { clearSrc: true, mergeConfig: { mergeData: true } }
      )
      expect(fifthTransfer).to.equal(true)
      wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                  c5: 'this is c5 node of d',
                  c6: 'this is c6 node of e',
                },
              }
            }
          }
        }
      )

    })
    it('should transfer the data info successfully:', () => {
      const dataPool = DataPool.getInstance()
      const firstSet = dataPool.set(
        'a.b:c',
        {
          c1: 'this is c1 node',
          c2: 'this is c2 node',
          c3: 'this is c3 node',
          c4: 'this is c4 node',
        },
        { dataInfo: { status: { value: 'view' } } }
      )
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  c1: 'this is c1 node',
                  c2: 'this is c2 node',
                  c3: 'this is c3 node',
                  c4: 'this is c4 node',
                }
              }
            }
          }
        }
      )

      const firstTransfer = dataPool.transfer('a.b:c', 'a.b:d', { createDst: true })
      expect(firstTransfer).to.equal(true)
      let status = dataPool.get('a.b:c', { content: 'status' })
      expect(status).to.equal('view')
      status = dataPool.get('a.b:d', { content: 'status' })
      expect(status).to.equal('view')

      const secondTransfer = dataPool.transfer(
        'a.b:d',
        'a.b:e',
        { createDst: true, clearSrc: true }
      )
      expect(secondTransfer).to.equal(true)
      status = dataPool.get('a.b:d', { content: 'status' })
      expect(status).to.equal(undefined)
      status = dataPool.get('a.b:e', { content: 'status' })
      expect(status).to.equal('view')

      const secondSet = dataPool.set(
        'a.b:c.c5',
        'this is c5 node of c',
        { dataInfo: { type: { value: 'string' } } }
      )
      expect(secondSet).to.equal(true)
      let type = dataPool.get('a.b:c.c5', { content: 'type' })
      expect(type).to.equal('string')
      const thirdSet = dataPool.set(
        'a.b:e.c6',
        123456,
        { dataInfo: { type: { value: 'number' } } }
      )
      expect(thirdSet).to.equal(true)
      type = dataPool.get('a.b:e.c6', { content: 'type' })
      expect(type).to.equal('number')
      const forthSet = dataPool.set(
        'a.b:d',
        {
          c5: 'this is c5 node of d'
        },
        {
          dataInfo: {
            type: {
              setDataInfo: (path: string, data: any, prevInfo: any) => {
                if (typeof data === 'object') {
                  return 'object'
                } else if (typeof data === 'string') {
                  return 'string'
                }
                return 'undefined'
              }
            }
          }
        }
      )
      expect(forthSet).to.equal(true)
      type = dataPool.get('a.b:d', { content: 'type' })
      expect(type).to.equal('object')

      const forthTransfer = dataPool.transfer(
        'a.b:d',
        'a.b:c',
        { clearSrc: true, mergeConfig: { mergeData: true, mergeInfo: true } }
      )
      expect(forthTransfer).to.equal(true)
      type = dataPool.get('a.b:c', { content: 'type' })
      expect(type).to.equal('object')
      type = dataPool.get('a.b:c.c5', { content: 'type' })
      expect(type).to.equal('string')

      // const fifthTransfer = dataPool.transfer(
      //   'a.b:d',
      //   'a.b:c',
      //   { clearSrc: true, mergeConfig: { mergeData: true } }
      // )
      // expect(forthTransfer).to.equal(true)
      // wholeData = dataPool.get()
      // expect(wholeData).to.deep.equal(
      //   {
      //     a_b: {
      //       a: {
      //         b: {
      //           c: {
      //             c1: 'this is c1 node',
      //             c2: 'this is c2 node',
      //             c3: 'this is c3 node',
      //             c4: 'this is c4 node',
      //             c5: 'this is c5 node of d',
      //             c6: 'this is c6 node of e',
      //           },
      //         }
      //       }
      //     }
      //   }
      // )

    })
  })

  describe('Test info functions:', () => {
    it('should set and get the data info successfully:', () => {
      const dataPool = DataPool.getInstance()

      const firstSet = dataPool.set('a.b:c.d', 'this is d node')
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: 'this is d node'
                }
              }
            }
          }
        }
      )

      const firstSetInfo = dataPool.setInfo(
        'a.b:c.d',
        [
          {
            key: 'status',
            defaultValue: 'create',
          },
          {
            key: 'type',
            value: 'string',
          },
          {
            key: 'time',
            value: 1,
          },
        ],
      )
      expect(firstSetInfo).to.equal(true)

      const secondSetInfo = dataPool.setInfo(
        'a.b:c.e',
        [
          {
            key: 'status',
            defaultValue: 'create',
          },
          {
            key: 'type',
            value: 'string',
          },
          {
            key: 'time',
            value: 1,
          },
        ],
      )
      expect(secondSetInfo).to.equal(false)

      const firstGetInfo = dataPool.getInfo('a.b:c.d', 'status')
      expect(firstGetInfo).to.equal('create')

      const secondGetInfo = dataPool.getInfo('a.b:c.d', ['status', 'type', 'time'])
      expect(secondGetInfo).to.deep.equal(
        {
          status: 'create',
          type: 'string',
          time: 1,
        }
      )

    })
    it('should clear the data info successfully:', () => {
      const dataPool = DataPool.getInstance()

      const firstSet = dataPool.set('a.b:c.d', 'this is d node')
      expect(firstSet).to.equal(true)
      let wholeData = dataPool.get()
      expect(wholeData).to.deep.equal(
        {
          a_b: {
            a: {
              b: {
                c: {
                  d: 'this is d node'
                }
              }
            }
          }
        }
      )

      const firstSetInfo = dataPool.setInfo(
        'a.b:c.d',
        [
          {
            key: 'status',
            defaultValue: 'create',
          },
          {
            key: 'type',
            value: 'string',
          },
          {
            key: 'time',
            value: 1,
          },
        ],
      )
      expect(firstSetInfo).to.equal(true)
      const firstGetInfo = dataPool.getInfo(
        'a.b:c.d',
        ['status', 'type', 'time']
      )
      expect(firstGetInfo).to.deep.equal(
        {
          status: 'create',
          type: 'string',
          time: 1,
        }
      )

      dataPool.clearInfo('a.b:c.d', 'time')
      const secondGetInfo = dataPool.getInfo(
        'a.b:c.d',
        ['status', 'type', 'time']
      )
      expect(secondGetInfo).to.deep.equal(
        {
          status: 'create',
          type: 'string',
          time: undefined,
        }
      )

      dataPool.clearInfo('a.b:c.d', ['status', 'type'])
      const thirdGetInfo = dataPool.getInfo(
        'a.b:c.d',
        ['status', 'type', 'time']
      )
      expect(thirdGetInfo).to.deep.equal(
        {
          status: undefined,
          type: undefined,
          time: undefined,
        }
      )

      dataPool.setInfo(
        'a.b:c.d',
        [
          {
            key: 'status',
            value: 'update',
          },
          {
            key: 'type',
            value: 'text',
          },
          {
            key: 'time',
            value: 2,
          },
        ],
      )
      dataPool.clearInfo('a.b:c.d')
      const forthGetInfo = dataPool.getInfo(
        'a.b:c.d',
        ['status', 'type', 'time']
      )
      expect(forthGetInfo).to.deep.equal(
        {
          status: undefined,
          type: undefined,
          time: undefined,
        }
      )

    })
  })

  afterEach(() => {
    const dataPool = DataPool.getInstance()
    dataPool.clear()
  })
  after(() => {
  })
})
