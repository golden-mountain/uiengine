import { IDataSource } from '../DataNode'

// Common interfaces
export interface IObject {
  [anyKey: string]: any
}

// UI schema
export interface IUISchema {
  component?: string | React.ElementType
  datasource?: IDataSource
  props?: IObject
  inheritProps?: boolean | string[]
  state?: {
    [stateName: string]: IDependanceTree | IDependanceNode
  }
  children?: Array<IUISchema|IUISchema[]>
  $children?: IUISchema|IUISchema[]
  [otherKey: string]: any
}

export interface IDependanceTree {
  deps: Array<IDependanceTree | IDependanceNode>
  strategy?: string
}

export interface IDependanceNode {
  selector: {
    [selectKey: string]: any
  }
  data?: any
  dataCompareRule?: string
  state?: {
    [stateName: string]: boolean
  }
  stateCompareRule?: string
  stateCompareStrategy?: string
}

// Data schema
export interface IDataSchema {
  version: string
  endpoints: {
    default: { path: string } | string
    [method: string]: { path: string } | string
  }
  'cm-lineage': string
  'cm-object-meta': IObject
  fields?: IDataNodeSchema[]
  [anyKey: string]: any
}

export interface IDataNodeSchema {
  key: string
  label: string
  type: string
  'cm-lineage': string
  'cm-meta'?: IDataMeta
  fields?: IDataNodeSchema[]
  'name-label'?: string
}

export interface IDataMeta {
  format?: string
  range?: string
  flags?: string
  'object-key'?: boolean
  'multi-field-key'?: boolean
  'max-elements'?: string
  'modify-ineligible'?: boolean
  'gui-section'?: string
  help?: string
  condition?: string
  enabled?: Array<string|string[]>
  disabled?: Array<string|string[]>
  'm-exclusion'?: string[]
  'obj-association'?: string[]
  allowed?: IAllowedOption[]
  default?: any
}

export interface IAllowedOption {
  label: string
  value: string
  help?: string
}
