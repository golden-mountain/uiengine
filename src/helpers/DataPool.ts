import _ from 'lodash'

import {
  getDomainName,
  formatSource,
} from './utils/data'

import {
  IDataPool,
  IDataPoolSetOption,
  IDataPoolGetOption,
  IDataPoolClearOption,
  IDataPoolTransferOption,
  IDataPoolInfoConfig,
  IDataPoolConnectObject,
  IDataPoolConnectOption,
} from '../../typings'

interface IDataElement {
  dataValue?: any
  dataInfo?: {
    status?: string
    [otherInfo: string]: any
  }
  connect?: IDataConnection[]
  parent?: IDataElement
  children?: { [key: string]: IDataElement } | Array<IDataElement>
}
interface IDataConnection {
  object: IDataPoolConnectObject
  options?: IDataPoolConnectOption
}

export interface IDataPoolConfig {
  domainAnalyzer?: (path: string) => string
  routeAnalyzer?: (path: string) => string
}

export class DataPool implements IDataPool {
  private static instance: DataPool
  static getInstance = () => {
    if (!DataPool.instance) {
      DataPool.instance = new DataPool
    }
    return DataPool.instance
  }

  private pool: {
    [domain: string]: IDataElement
  }
  private domainAnalyzer?: (path: string) => string
  private routeAnalyzer?: (path: string) => string

  constructor(config?: IDataPoolConfig) {
    this.pool = {}

    if (_.isObject(config) && !_.isEmpty(config)) {
      const { domainAnalyzer, routeAnalyzer } = config
      if (_.isFunction(domainAnalyzer)) {
        this.domainAnalyzer = domainAnalyzer
      }
      if (_.isFunction(routeAnalyzer)) {
        this.routeAnalyzer = routeAnalyzer
      }
    }
  }

  private routeExplorer(
    node: IDataElement,
    route: string,
    options?: IDataPoolSetOption,
  ) {
    let autoCreate: boolean = true
    if (_.isObject(options)) {
      const { createPath } = options
      if (_.isBoolean(createPath)) {
        autoCreate = createPath
      }
    }

    let currentNode: IDataElement | null = node
    if (!_.isNil(node)) {
      if (_.isString(route)) {
        if (!_.isEmpty(route)) {
          const accessList: Array<string|number> = []
          const routeSlices = route.split('.')
          routeSlices.forEach((slice: string) => {
            const accessArray = /\[\d*\]/g
            const matchResult = slice.match(accessArray)
            if (!_.isNil(matchResult)) {
              let restStr = slice
              matchResult.forEach((matchStr: string) => {
                const startIndex = restStr.indexOf(matchStr)
                const endIndex = startIndex + matchStr.length

                accessList.push(restStr.slice(0, startIndex))
                restStr = restStr.slice(endIndex)

                const arrayIndex = /\[(\d*)\]/
                const mResult = matchStr.match(arrayIndex)
                if (!_.isNil(mResult)) {
                  const indexStr = mResult[1]
                  const indexNum = Number(indexStr)
                  accessList.push(indexNum)
                }
              })
              if (restStr) {
                accessList.push(restStr)
              }
            } else {
              accessList.push(slice)
            }
          })

          accessList.forEach((item: string | number) => {
            if (currentNode === null) {
              return
            } else {
              let children = currentNode.children
              if (_.isNil(children)) {
                if (autoCreate) {
                  if (_.isString(item)) {
                    currentNode.children = {}
                  } else if (_.isNumber(item)) {
                    currentNode.children = []
                  }
                  children = currentNode.children
                  // change leaf node(has value, no children) to branch node(no value, has children)
                  delete currentNode.dataValue
                } else {
                  currentNode = null
                  return
                }
              }

              let childNode: IDataElement = _.get(children, item)
              if (_.isNil(childNode)) {
                if (autoCreate && !_.isNil(children)) {
                  children[item] = { parent: currentNode } as IDataElement
                  childNode = children[item]
                } else {
                  currentNode = null
                  return
                }
              }

              currentNode = childNode
            }
          })
        }
      } else {
        currentNode = null
      }
    } else {
      currentNode = null
    }

    return currentNode
  }
  private createChildren(
    data: any,
    route: string,
    targetElement: IDataElement,
    prevChildren?: { [key: string]: IDataElement } | Array<IDataElement>,
    options?: IDataPoolSetOption,
  ) {
    if (_.isObject(data)) {
      if (_.isArray(data)) {
        let children: IDataElement[] = []
        data.forEach((item: any, index: number) => {
          let prevItemNode: IDataElement | undefined
          if (_.isArray(prevChildren)) {
            prevItemNode = _.get(prevChildren, [index])
          }

          const nextItemNode: IDataElement = { parent: targetElement }
          if (_.isObject(item)) {
            const itemChildren = this.createChildren(
              item,
              route + `[${index}]`,
              nextItemNode,
              _.get(prevItemNode, 'children'),
              options,
            )
            if (_.isObject(itemChildren) || _.isArray(itemChildren)) {
              nextItemNode.children = itemChildren
            } else {
              nextItemNode.dataValue = undefined
            }
          } else {
            nextItemNode.dataValue = item
          }

          this.solveDataInfo(
            item,
            route + `[${index}]`,
            nextItemNode,
            prevItemNode,
            options,
          )

          children[index] = nextItemNode
        })
        return children
      } else {
        let children: { [key: string]: IDataElement } = {}
        Object.keys(data).forEach((key: string) => {
          let prevKeyNode: IDataElement | undefined
          if (_.isObject(prevChildren) && !_.isArray(prevChildren)) {
            prevKeyNode = _.get(prevChildren, [key])
          }

          const nextKeyNode: IDataElement = { parent: targetElement }
          const value = data[key]
          if (_.isObject(value)) {
            const keyChildren = this.createChildren(
              value,
              route + `.${key}`,
              nextKeyNode,
              _.get(prevKeyNode, 'children'),
              options,
            )
            if (_.isObject(keyChildren) || _.isArray(keyChildren)) {
              nextKeyNode.children = keyChildren
            } else {
              nextKeyNode.dataValue = undefined
            }
          } else {
            nextKeyNode.dataValue = value
          }

          this.solveDataInfo(
            value,
            route + `.${key}`,
            nextKeyNode,
            prevKeyNode,
            options,
          )

          children[key] = nextKeyNode
        })
        return children
      }
    }
  }
  private solveDataInfo(
    data: any,
    route: string,
    targetElement: IDataElement,
    prevElement?: IDataElement,
    options?: IDataPoolSetOption,
  ) {
    let infoConfig: {
      [infoKey: string]: {
        value?: any
        defaultValue?: any
        setDataInfo?: (path: string, data: any, prevInfo?: any) => any
      }
    } = {}
    if (_.isObject(options)) {
      const { dataInfo } = options
      if (_.isObject(dataInfo) && !_.isEmpty(dataInfo)) {
        infoConfig = dataInfo
      }
    }

    let dataInfo: { [infoKey: string]: any } = {}
    if (!_.isNil(prevElement)) {
      const prevDataInfo = _.get(prevElement, 'dataInfo')
      if (_.isObject(prevDataInfo) && !_.isEmpty(prevDataInfo)) {
        dataInfo = prevDataInfo
      }
    }

    Object.keys(infoConfig).forEach((infoKey: string) => {
      const config = infoConfig[infoKey]

      if (_.isObject(config)) {
        const { value, defaultValue, setDataInfo } = config

        if (value !== undefined) {
          dataInfo[infoKey] = value
        } else if (defaultValue !== undefined && dataInfo[infoKey] === undefined) {
          dataInfo[infoKey] = defaultValue
        }
        if (_.isFunction(setDataInfo)) {
          const nextInfoValue = setDataInfo(route, data, dataInfo[infoKey])
          if (nextInfoValue !== undefined) {
            dataInfo[infoKey] = nextInfoValue
          }
        }
      }
    })

    if (!_.isEmpty(dataInfo)) {
      targetElement.dataInfo = dataInfo
    }

  }
  set(path: string, data: any, options?: IDataPoolSetOption) {
    if (_.isString(path) && path) {
      // get domain name
      let domainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        domainName = this.domainAnalyzer(path)
      } else {
        domainName = getDomainName(path)
      }
      // get target route
      let targetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        targetRoute = this.routeAnalyzer(path)
      } else {
        targetRoute = formatSource(path)
      }

      // get domain root node
      const domainRoot = _.get(this.pool, domainName, {} as IDataElement)
      // set the domain node if it doesn't exist
      if (!_.has(this.pool, domainName)) {
        _.set(this.pool, domainName, domainRoot)
      }

      // get target node
      const targetNode = this.routeExplorer(domainRoot, targetRoute, options)
      if (!_.isNil(targetNode)) {
        let autoCreate: boolean = true
        if (_.isObject(options)) {
          const { createChild } = options
          if (_.isBoolean(createChild)) {
            autoCreate = createChild
          }
        }

        // set data value
        if (autoCreate && _.isObject(data)) {
          const prevChildren = targetNode.children
          const nextChildren = this.createChildren(
            data,
            targetRoute,
            targetNode,
            prevChildren,
            options,
          )
          if (_.isObject(nextChildren) || _.isArray(nextChildren)) {
            targetNode.children = nextChildren
            // change leaf node(has value, no children) to branch node(no value, has children)
            delete targetNode.dataValue
          } else {
            return false
          }
        } else {
          targetNode.dataValue = data
          // change branch node(no value, has children) to leaf node(has value, no children)
          delete targetNode.children
        }

        // set data info
        this.solveDataInfo(
          data,
          targetRoute,
          targetNode,
          targetNode,
          options,
        )

      } else {
        return false
      }
    } else {
      return false
    }
    return true
  }
  setInfo(path: string, config: IDataPoolInfoConfig | IDataPoolInfoConfig[]) {
    if (_.isString(path) && path) {
      // get domain name
      let domainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        domainName = this.domainAnalyzer(path)
      } else {
        domainName = getDomainName(path)
      }
      // get target route
      let targetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        targetRoute = this.routeAnalyzer(path)
      } else {
        targetRoute = formatSource(path)
      }

      // get domain root node
      const domainRoot = _.get(this.pool, domainName)
      // if can not find the target domain
      if (_.isNil(domainRoot)) {
        return false
      }

      // get target node
      const targetNode = this.routeExplorer(domainRoot, targetRoute, { createPath: false })
      if (!_.isNil(targetNode)) {
        const infoConfig = {}
        if (_.isArray(config)) {
          config.forEach((item: IDataPoolInfoConfig) => {
            if (_.isObject(item)) {
              const { key, value, defaultValue } = item
              if (_.isString(key) && key) {
                infoConfig[key] = { value, defaultValue }
              }
            }
          })
        } else if (_.isObject(config)) {
          const { key, value, defaultValue } = config
          if (_.isString(key) && key) {
            infoConfig[key] = { value, defaultValue }
          }
        }

        // set data info
        this.solveDataInfo(
          null,
          targetRoute,
          targetNode,
          targetNode,
          { dataInfo: infoConfig },
        )

      } else {
        return false
      }
    } else {
      return false
    }
    return true
  }

  private getElementValue(
    dataElement: IDataElement
  ) {
    if (_.has(dataElement, 'dataValue')) {
      return dataElement.dataValue
    } else if (_.has(dataElement, 'children')) {
      let dataValue
      const children = dataElement.children
      if (_.isArray(children)) {
        const arrValue: any[] = []
        children.forEach((child: IDataElement, index: number) => {
          arrValue[index] = this.getElementValue(child)
        })
        dataValue = arrValue
      } else if (_.isObject(children)) {
        const objValue = {}
        Object.keys(children).forEach((key: string) => {
          const child = children[key]
          objValue[key] = this.getElementValue(child)
        })
        dataValue = objValue
      }
      return dataValue
    }
    return undefined
  }
  private getElementInfo(
    dataElement: IDataElement,
    infoKey: string,
  ) {
    if (_.has(dataElement, 'dataInfo')) {
      let nodeInfo = {}

      const dataInfo = dataElement.dataInfo
      if (_.isObject(dataInfo) && !_.isEmpty(dataInfo)) {
        nodeInfo = dataInfo
      }

      return nodeInfo[infoKey]
    } else {
      return undefined
    }
  }
  get(path?: string, options?: IDataPoolGetOption) {
    if (_.isString(path) && path) {
      // get domain name
      let domainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        domainName = this.domainAnalyzer(path)
      } else {
        domainName = getDomainName(path)
      }
      // get target route
      let targetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        targetRoute = this.routeAnalyzer(path)
      } else {
        targetRoute = formatSource(path)
      }

      // get domain root node
      const domainRoot = _.get(this.pool, domainName)
      if (_.isNil(domainRoot)) {
        return undefined
      }

      // get target node
      const targetNode = this.routeExplorer(
        domainRoot,
        targetRoute,
        { createPath: false },
      )
      if (!_.isNil(targetNode)) {
        let contentType: string = 'data'
        let wrapWithRoute: boolean = false
        if (_.isObject(options)) {
          const { content, withPath } = options
          if (_.isString(content) && content) {
            contentType = content
          }
          if (_.isBoolean(withPath)) {
            wrapWithRoute = withPath
          }
        }

        if (contentType === 'data') {
          let data =  this.getElementValue(targetNode)
          if (wrapWithRoute) {
            data = _.set({}, targetRoute, data)
          }
          return data
        } else {
          let info = this.getElementInfo(targetNode, contentType)
          if (wrapWithRoute) {
            info = _.set({}, targetRoute, info)
          }
          return info
        }
      } else {
        return undefined
      }
    } else {
      const allDomains: { [domain: string]: any} = {}
      Object.keys(this.pool).forEach((domain: string) => {
        const rootNode = this.pool[domain]

        let contentType: string = 'data'
        if (_.isObject(options)) {
          const { content } = options
          if (_.isString(content) && content) {
            contentType = content
          }
        }

        if (contentType === 'data') {
          allDomains[domain] = this.getElementValue(rootNode)
        } else {
          allDomains[domain] = this.getElementInfo(rootNode, contentType)
        }
      })
      return allDomains
    }
  }
  getInfo(path: string, key: string | string[]) {
    if (_.isString(path) && path) {
      // get domain name
      let domainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        domainName = this.domainAnalyzer(path)
      } else {
        domainName = getDomainName(path)
      }
      // get target route
      let targetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        targetRoute = this.routeAnalyzer(path)
      } else {
        targetRoute = formatSource(path)
      }

      // get domain root node
      const domainRoot = _.get(this.pool, domainName)
      if (_.isNil(domainRoot)) {
        return undefined
      }

      // get target node
      const targetNode = this.routeExplorer(
        domainRoot,
        targetRoute,
        { createPath: false },
      )
      if (!_.isNil(targetNode)) {
        let targetInfo = {}
        if (_.has(targetNode, 'dataInfo')) {
          const { dataInfo } = targetNode
          if (_.isObject(dataInfo) && !_.isEmpty(dataInfo)) {
            targetInfo = dataInfo
          }
        }

        if (_.isArray(key)) {
          const result = {}
          key.forEach((item: string) => {
            if (_.isString(item) && item) {
              result[item] = targetInfo[item]
            }
          })
          return result
        } else if (_.isString(key) && key) {
          return targetInfo[key]
        }
      } else {
        return undefined
      }
    } else {
      return undefined
    }
  }

  clear(path?: string, options?: IDataPoolClearOption) {
    if (_.isString(path) && path) {
      // get domain name
      let domainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        domainName = this.domainAnalyzer(path)
      } else {
        domainName = getDomainName(path)
      }
      // get target route
      let targetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        targetRoute = this.routeAnalyzer(path)
      } else {
        targetRoute = formatSource(path)
      }

      // get domain root node
      const domainRoot = _.get(this.pool, domainName)
      if (_.isNil(domainRoot)) {
        return
      }

      if (_.isObject(options)) {
        const { clearDomain } = options
        if (clearDomain === true) {
          delete this.pool[domainName]
          return
        }
      }

      // get target node
      const targetNode = this.routeExplorer(
        domainRoot,
        targetRoute,
        { createPath: false },
      )

      if (domainRoot === targetNode) {
        delete this.pool[domainName]
      } else if (!_.isNil(targetNode)) {
        const { parent } = targetNode
        if (!_.isNil(parent)) {
          const { children } = parent
          if (_.isArray(children)) {
            let deleteIndex: number = children.length
            children.some((child: IDataElement, index: number) => {
              if (child === targetNode) {
                deleteIndex = index
                return true
              }
            })

            if (deleteIndex < children.length) {
              children.splice(deleteIndex, 1)
            }
          } else if (_.isObject(children)) {
            let deleteKey: string = ''
            Object.keys(children).some((key: string) => {
              if (children[key] === targetNode) {
                deleteKey = key
                return true
              }
            })

            if (deleteKey) {
              delete children[deleteKey]
            }
          }
        }
      }

    } else if (_.isNil(path)) {
      this.pool = {}
    }
  }
  clearInfo(path: string, key?: string | string[]) {
    if (_.isString(path) && path) {
      // get domain name
      let domainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        domainName = this.domainAnalyzer(path)
      } else {
        domainName = getDomainName(path)
      }
      // get target route
      let targetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        targetRoute = this.routeAnalyzer(path)
      } else {
        targetRoute = formatSource(path)
      }

      // get domain root node
      const domainRoot = _.get(this.pool, domainName)
      if (_.isNil(domainRoot)) {
        return
      }

      // get target node
      const targetNode = this.routeExplorer(
        domainRoot,
        targetRoute,
        { createPath: false },
      )

      if (!_.isNil(targetNode)) {
        const { dataInfo } = targetNode
        if (_.isObject(dataInfo)) {
          if (_.isArray(key)) {
            key.forEach((infoKey: string) => {
              if (_.isString(infoKey) && infoKey) {
                delete dataInfo[infoKey]
              }
            })
          } else if (_.isString(key) && key) {
            delete dataInfo[key]
          } else if (key === undefined) {
            delete targetNode.dataInfo
          }
        }
      }
    }
  }

  private cloneElement(
    dataElement: IDataElement,
    options?: IDataPoolTransferOption,
  ) {
    const clone: IDataElement = {}

    if (_.has(dataElement, 'dataValue')) {
      const dataValue = dataElement.dataValue

      let shallowClone: boolean = false
      let deepClone: boolean = false
      if (_.isObject(options)) {
        const { cloneConfig } = options
        if (_.isObject(cloneConfig)) {
          const { shallowCloneData, deepCloneData } = cloneConfig
          if (_.isBoolean(shallowCloneData)) {
            shallowClone = shallowCloneData
          }
          if (_.isBoolean(deepCloneData)) {
            deepClone = deepCloneData
          }
        }
      }

      if (shallowClone) {
        clone.dataValue = _.clone(dataValue)
      } else if (deepClone) {
        clone.dataValue = _.cloneDeep(dataValue)
      } else {
        clone.dataValue = dataValue
      }
    } else if (_.has(dataElement, 'children')) {
      const children = dataElement.children

      if (_.isArray(children)) {
        const cloneChildren: IDataElement[] = []
        children.forEach((child: IDataElement, index: number) => {
          cloneChildren[index] = this.cloneElement(child, options)
        })
        clone.children = cloneChildren
      } else if (_.isObject(children)) {
        const cloneChildren: { [key: string]: IDataElement } = {}
        Object.keys(children).forEach((key: string) => {
          const child = children[key]
          cloneChildren[key] = this.cloneElement(child, options)
        })
        clone.children = cloneChildren
      }
    }

    if (_.has(dataElement, 'dataInfo')) {
      const dataInfo = dataElement.dataInfo

      let shallowClone: boolean = false
      let deepClone: boolean = false
      if (_.isObject(options)) {
        const { cloneConfig } = options
        if (_.isObject(cloneConfig)) {
          const { shallowCloneInfo, deepCloneInfo } = cloneConfig
          if (_.isBoolean(shallowCloneInfo)) {
            shallowClone = shallowCloneInfo
          }
          if (_.isBoolean(deepCloneInfo)) {
            deepClone = deepCloneInfo
          }
        }
      }

      if (_.isObject(dataInfo)) {
        const cloneInfo = {}

        Object.keys(dataInfo).forEach((key: string) => {
          if (shallowClone) {
            cloneInfo[key] = _.clone(dataInfo[key])
          } else if (deepClone) {
            cloneInfo[key] = _.cloneDeep(dataInfo[key])
          } else {
            cloneInfo[key] = dataInfo[key]
          }
        })

        if (!_.isEmpty(cloneInfo)) {
          clone.dataInfo = cloneInfo
        }
      }
    }

    return clone
  }
  private mergeExtraContent(
    srcElement: IDataElement,
    dstElement: IDataElement,
    mergeData: boolean,
    mergeInfo: boolean,
  ) {
    if (mergeData) {
      // merge extra data
      if (_.has(dstElement, 'dataValue')) {
        const srcDataValue = srcElement.dataValue
        const dstDataValue = dstElement.dataValue

        if (_.isArray(srcDataValue) && _.isArray(dstDataValue)) {
          srcDataValue.forEach((item: any, index: number) => {
            if (dstDataValue[index] === undefined) {
              dstDataValue[index] = item
            }
          })
        } else if (
          !_.isArray(srcDataValue) && _.isObject(srcDataValue) &&
          !_.isArray(dstDataValue) && _.isObject(dstDataValue)
        ) {
          Object.keys(srcDataValue).forEach((key: string) => {
            if (dstDataValue[key] === undefined) {
              dstDataValue[key] = srcDataValue[key]
            }
          })
        }
      } else if (_.has(dstElement, 'children')) {
        const srcChildren = srcElement.children
        const dstChildren = dstElement.children

        if (_.isArray(srcChildren) && _.isArray(dstChildren)) {
          srcChildren.forEach((srcChild: IDataElement, index: number) => {
            if (_.isNil(dstChildren[index])) {
              dstChildren[index] = srcChild
              srcChild.parent = dstElement
            } else {
              this.mergeExtraContent(srcChild, dstChildren[index], mergeData, mergeInfo)
            }
          })
        } else if (
          !_.isArray(srcChildren) && _.isObject(srcChildren) &&
          !_.isArray(dstChildren) && _.isObject(dstChildren)
        ) {
          Object.keys(srcChildren).forEach((key: string) => {
            if (_.isNil(dstChildren[key])) {
              dstChildren[key] = srcChildren[key]
              srcChildren[key].parent = dstElement
            } else {
              this.mergeExtraContent(srcChildren[key], dstChildren[key], mergeData, mergeInfo)
            }
          })
        }
      }
    }

    if (mergeInfo) {
      // merge extra info
      if (_.has(dstElement, 'dataInfo')) {
        const srcDataInfo = srcElement.dataInfo
        const dstDataInfo = dstElement.dataInfo

        if (_.isObject(srcDataInfo) && _.isObject(dstDataInfo)) {
          Object.keys(srcDataInfo).forEach((infoKey: string) => {
            if (dstDataInfo[infoKey] === undefined) {
              dstDataInfo[infoKey] = srcDataInfo[infoKey]
            }
          })
        }

      } else if (_.has(srcElement, 'dataInfo')) {
        dstElement.dataInfo = srcElement.dataInfo
      }
    }
  }
  private transferElement(
    srcElement: IDataElement,
    dstElement: IDataElement,
    options?: IDataPoolTransferOption,
  ) {
    if (_.isObject(options)) {
      const { clearSrc } = options
      if (!clearSrc) {
        srcElement = this.cloneElement(srcElement, options)
      }
    }

    // replace dst element with src element
    if (!_.isNil(dstElement.parent)) {
      const parentElement = dstElement.parent
      if (!_.isNil(parentElement.children)) {
        const parentChildren = parentElement.children
        if (_.isArray(parentChildren)) {
          parentChildren.some((child: IDataElement, index: number) => {
            if (child === dstElement) {
              parentChildren[index] = srcElement
              srcElement.parent = parentElement
              return true
            }
            return false
          })
        } else if (!_.isArray(parentChildren) && _.isObject(parentChildren)) {
          Object.keys(parentChildren).some((key: string) => {
            const child = parentChildren[key]
            if (child === dstElement) {
              parentChildren[key] = srcElement
              srcElement.parent = parentElement
              return true
            }
            return false
          })
        }
      }
    } else {
      Object.keys(this.pool).some((domainName: string) => {
        const rootElement = this.pool[domainName]
        if (rootElement === dstElement) {
          this.pool[domainName] = srcElement
          delete srcElement.parent
          return true
        }
        return false
      })
    }

    let mergeDataValue: boolean = false
    let mergeInfoValue: boolean = false
    if (_.isObject(options)) {
      const { mergeConfig } = options
      if (_.isObject(mergeConfig)) {
        const { mergeData, mergeInfo } = mergeConfig
        if (_.isBoolean(mergeData)) {
          mergeDataValue = mergeData
        }
        if (_.isBoolean(mergeInfo)) {
          mergeInfoValue = mergeInfo
        }
      }
    }

    // merge the extra content of dst element to src element
    this.mergeExtraContent(dstElement, srcElement, mergeDataValue, mergeInfoValue)

  }
  transfer(srcPath: string, dstPath: string, options?: IDataPoolTransferOption) {
    if (_.isString(srcPath) && srcPath) {
      // get src domain name
      let srcDomainName: string = ''
      if (_.isFunction(this.domainAnalyzer)) {
        srcDomainName = this.domainAnalyzer(srcPath)
      } else {
        srcDomainName = getDomainName(srcPath)
      }
      // get src target route
      let srcTargetRoute: string = ''
      if (_.isFunction(this.routeAnalyzer)) {
        srcTargetRoute = this.routeAnalyzer(srcPath)
      } else {
        srcTargetRoute = formatSource(srcPath)
      }

      // get src domain root node
      const srcDomainRoot = _.get(this.pool, srcDomainName)
      if (_.isNil(srcDomainRoot)) {
        return false
      }

      // get src target node
      const srcTargetNode = this.routeExplorer(
        srcDomainRoot,
        srcTargetRoute,
        { createPath: false },
      )

      if (!_.isNil(srcTargetNode)) {
        // get dst domain name
        let dstDomainName: string = ''
        if (_.isFunction(this.domainAnalyzer)) {
          dstDomainName = this.domainAnalyzer(dstPath)
        } else {
          dstDomainName = getDomainName(dstPath)
        }
        // get dst target route
        let dstTargetRoute: string = ''
        if (_.isFunction(this.routeAnalyzer)) {
          dstTargetRoute = this.routeAnalyzer(dstPath)
        } else {
          dstTargetRoute = formatSource(dstPath)
        }

        let autoClear: boolean = false
        let autoCreate: boolean = false
        if (_.isObject(options)) {
          const { clearSrc, createDst } = options
          if (_.isBoolean(clearSrc)) {
            autoClear = clearSrc
          }
          if (_.isBoolean(createDst)) {
            autoCreate = createDst
          }
        }

        // get dst domain root node
        let dstDomainRoot = _.get(this.pool, dstDomainName)
        if (_.isNil(dstDomainRoot)) {
          if (autoCreate) {
            dstDomainRoot = {} as IDataElement
            _.set(this.pool, dstDomainName, dstDomainRoot)
          } else {
            return false
          }
        }

        // get dst target node
        const dstTargetNode = this.routeExplorer(
          dstDomainRoot,
          dstTargetRoute,
          { createPath: autoCreate },
        )

        if (!_.isNil(dstTargetNode)) {
          if (autoClear === true) {
            this.clear(srcPath)
          }

          // transfer content of src node to dst node
          this.transferElement(srcTargetNode, dstTargetNode, options)

        } else {
          return false
        }
      } else {
        return false
      }
    } else {
      return false
    }
    return true
  }

  // undetermined functions
  connnect(path: string, object: IDataPoolConnectObject, options?: IDataPoolConnectOption) {

  }
  disconnect(path: string, object: IDataPoolConnectObject) {

  }
}

export default DataPool
