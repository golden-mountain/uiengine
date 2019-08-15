# UI Engine

## Start the Example

```
cd examples/adc
npm install
npm start
```

# Devloper Manual
## Directories
```
| doc
Architecture UML and docs
| examples
| lib
distination folder
| src
UIEngine framework source code
| typings
UIEngine type define
| test
all UIEngine test code
```

## Schema 
To separate the data & UI design, the architecture used 2 kinds of schema, UI Schema and Data Schema

### UI Schema
UI Schema we can treat it as an JSX, all HTML tags & 3rd part libraries are compatiable,
the schema keeps some preserved keys, like component, children, props, also we allow users define them by requirements.


#### Preserved Keys
1. component
  * Buildin HTML tags
  No need install anything
  ```
  {
    "component": "div"
  }
  ```
  * 3rd Components
  
  Notice: 
  
   a. Make sure you need add them into package.json at "dependencies" section
   
   b. Need registered at a certain place, see examples/adc/src/components
   
   ```
   import * as antd from "antd";
import { BrowserRouter, Route } from "react-router-dom";

export default {
  a10,
  demo,
  antd,
  rr: {
    BrowserRouter,
    Route
  }
};
```
   c. At the bootstrap script, register the components, see examples/adc/src/App.tsx
```
   UIEngineRegister.registerComponents(components);
```
   
  Usage: add library 
```
  {
    "component": "antd:Button"
  }
```

### Data Schema
#### Definiation


## TODO:

### extension for core nodes

### example

    trigger all validation  when submit
    show backend responsed error message

### DEBUG TOOL

Add a debug component to access all the debug info, structure like

```
schemas
    ui: abc.json {} edit
    data: abc.json {}
    ui: cde.json {}
    data: cde.json {}

plugins:
    type.a:
    name1: value
    changed: uiNode.schema
    name2: value
    changed: dataNode.schema

pool:
    {datas}

nodes:
    uiNode: {}
    dataNode: {}
    stateNode: {}

data choose commit
```

## TO FIX

### setState always slow one step

### working mode can control on each separate node [Fixed]
