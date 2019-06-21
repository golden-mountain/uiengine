/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request, Cache } from "../src";
import reqConfig from "./config/request";
// import defaultSchema from "./config/default-schema";
// import { IUINode } from "../typings/UINode";
// import { IDataNode } from "../typings/DataNode";

import uiNodeLayout from "./layouts/uinode-basic.json";
import stateTestLayout from "./layouts/state-node-basic.json";
import dataNodeJson from "./data/foo.json";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

const expectedResult = [
  [
    {
      component: "p",
      datasource: "foo:bar.baz.0.name",
      _index: 0
    },
    {
      component: "p",
      datasource: "foo:bar.baz.0.age",
      _index: 0
    }
  ],
  [
    {
      component: "p",
      datasource: "foo:bar.baz.1.name",
      _index: 1
    },
    {
      component: "p",
      datasource: "foo:bar.baz.1.age",
      _index: 1
    }
  ]
];

const request = new Request(reqConfig);
describe("Given an instance of my UINode library", () => {
  before(() => {});
  describe("the given layout schema ", () => {
    it("getSchema: if schema is object, should same as constructor param", () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      let copyLayout = _.cloneDeep(uiNodeLayout);
      const localUINode = new UINode(copyLayout);
      expect(localUINode.getSchema()).to.deep.equal(copyLayout);
    });

    it("loadRemoteLayout: if schema is string, should load from remote and same as the loaded", async () => {
      let copyLayout = _.cloneDeep(uiNodeLayout);

      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      const remoteUINode = new UINode({}, request);
      let schema = await remoteUINode.loadRemoteLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      // console.log(remoteUINode.getSchema());
      expect(schema).to.deep.equal(copyLayout);

      // load from cache
      const spy = chai.spy.on(request, "get");
      schema = await remoteUINode.loadRemoteLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      expect(spy).to.have.not.been.called;
      expect(schema).to.deep.equal(copyLayout);

      // error loading
      await remoteUINode.loadRemoteLayout(
        `${reqConfig.layoutSchemaPrefix}not-exist.json`
      );
      expect(remoteUINode.getErrorInfo().status).to.equal(400);
    });

    it("getDataNode: if datasource is not empty, should return a correct DataNode", async () => {
      const remoteUINode = new UINode({}, request);
      remoteUINode.loadData("foo:bar");
      const dataNode = remoteUINode.getDataNode();
      expect(dataNode).to.have.property("loadData");
    });

    it("replaceLayout: if bring a new schema on this node, this uiNode should replaced with new", async () => {
      let copyLayout = _.cloneDeep(uiNodeLayout);

      const localUINode = new UINode(copyLayout);
      // await localUINode.loadLayout();
      // local schema
      let schema = await localUINode.replaceLayout(stateTestLayout);
      // console.log(localUINode.getSchema(), "<<<<<<<<<<<<<<<<");
      expect(localUINode.getSchema()).to.deep.equal(stateTestLayout);
      expect(localUINode.getErrorInfo()).to.deep.equal({});

      // remote schema
      const remoteCopyLayout = _.cloneDeep(uiNodeLayout);
      const remoteUINode = new UINode({}, request);
      schema = await remoteUINode.replaceLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      // console.log(remoteUINode.getSchema());
      const liveChildren = _.get(schema, "children[1].children");
      expect(liveChildren).to.deep.equal(expectedResult);
    });

    it("updateLayout: loadLayout should be called", () => {
      let copyLayout = _.cloneDeep(uiNodeLayout);

      const localUINode = new UINode(copyLayout);
      const spy = chai.spy.on(localUINode, "loadLayout");
      // localUINode.loadLayout();
      localUINode.updateLayout();
      expect(localUINode.getSchema()).to.deep.equal(copyLayout);
      expect(spy).to.have.been.called.exactly(1);
    });

    it("getNode: should return correct sub node", async () => {
      let copyLayout = _.cloneDeep(uiNodeLayout);

      const localUINode = new UINode(copyLayout);
      const schema = await localUINode.loadLayout();
      // try to get child node
      const subNode: UINode = localUINode.getNode("children[1]");
      expect(subNode).to.be.instanceOf(UINode);
      expect(subNode.getSchema()).to.deep.equal(copyLayout.children[1]);
    });

    it("genLiveLayout: follow schema's template field and given data, auto generate layouts", async () => {
      let copyLayout = _.cloneDeep(uiNodeLayout);

      const localUINode = new UINode({});
      const schema = await localUINode.genLiveLayout(
        copyLayout.children[1],
        dataNodeJson.foo.bar.baz
      );

      expect(schema.children).to.deep.equal(expectedResult);
    });

    it("assignSchema: if assign a schema to this node, data & schema should loaded", async () => {
      let copyLayout = _.cloneDeep(uiNodeLayout);

      const schemaWithLiveNode: any = copyLayout.children[1];
      const localUINode = new UINode(schemaWithLiveNode);
      const schema = await localUINode.loadLayout();
      // data shource loaded
      const data = localUINode.getDataNode().getData();
      const datasource = localUINode.getSchema().datasource.replace(":", ".");
      expect(data).to.deep.equal(_.get(dataNodeJson, datasource));

      // liveschema loaded
      const liveschema: any = localUINode.getSchema();
      expect(liveschema.children).to.deep.equal(expectedResult);

      // children generated
      const children = localUINode.getChildren([1]);
      const firstChildren = children[0] as UINode;

      expect(firstChildren).is.instanceOf(UINode);

      // expect first children schema
      const firstchildrenSchema: any = firstChildren.getSchema();
      expect(firstchildrenSchema).to.deep.equal(expectedResult[1][0]);

      // expect first children name is Lifang
      const firstNodeData = firstChildren.getDataNode().getData();
      expect(firstNodeData).to.equal("Lifang");
    });

    it("loadLayout: should load remote/given layout, and rootSchemas is assigned", async () => {
      // use given layout from constructor
      const schemaPath = `${reqConfig.layoutSchemaPrefix}uinode-basic`;
      const uinode = new UINode({}, request);
      let schema = await uinode.loadLayout(`${schemaPath}.json`);
      const liveChildren = _.get(uinode, "children[1]");
      schema = liveChildren.getSchema().children;
      expect(schema).to.deep.equal(expectedResult);

      // root schemas exists
      const path = `${schemaPath}-json`;
      expect(Cache.getLayoutSchema(path)).to.deep.equal(uinode.getSchema());
    });

    it("searchNodes: should return right node by given prop", async () => {
      let copyLayout = _.cloneDeep(stateTestLayout);
      const localUINode = new UINode(copyLayout, request, "test-root-name");
      await localUINode.loadLayout();
      let nodes = localUINode.searchNodes({
        // datasource: "foo:bar.baz.$.age"
        datasource: "foo:bar"
      });
      expect(nodes.length).to.equal(1);

      nodes = localUINode.searchNodes({
        datasource: "foo:bar.baz.0.age"
      });
      expect(nodes.length).to.equal(1);

      nodes = localUINode.searchNodes({
        component: "lib:DemoLiveElement",
        datasource: "foo:bar.baz"
      });
      expect(nodes.length).to.equal(1);

      // multiple condition find
      nodes = localUINode.searchNodes({
        datasource: "foo:bar.baz.0.age",
        component: "p"
      });
      expect(nodes.length).to.equal(1);

      // negtive cases
      nodes = localUINode.searchNodes({
        datasource: "foo:bar.baz.0.age",
        component: "div" // not match this line
      });
      expect(nodes.length).to.equal(0);

      // from subnode search
      const childNode = localUINode.getChildren([1, 0])[1];
      // console.log(childNode.getSchema());
      nodes = childNode.searchNodes({
        component: "lib:DemoElement2",
        id: "id-of-demo-element-1",
        datasource: "foo:bar.name"
      });
      expect(nodes.length).to.equal(1);
    });
  });
});
