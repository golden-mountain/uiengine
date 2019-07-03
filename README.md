# UI Engine

## TODO: DEBUG TOOL

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
```
