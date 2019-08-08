# UI Engine

## Directories

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

## Start the Example

```
cd examples/adc
npm install
npm start
```

## TODO:

### extension for core nodes

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

### working mode can control on each separate node
