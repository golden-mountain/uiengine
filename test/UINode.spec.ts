/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, Request } from "../src";
import reqConfig from "./config/request";
// import defaultSchema from "./config/default-schema";
// import { IUINode } from "../typings/UINode";
// import { IDataNode } from "../typings/DataNode";

import uiNodeLayout from "./layouts/uinode-basic.json";
import stateTestLayout from "./layouts/state-test.json";
import dataNodeJson from "./data/foo.json";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

const request = new Request(reqConfig);
describe("Given an instance of my UINode library", () => {
  before(() => {});
  describe("the given layout schema ", () => {
    it("getSchema: if schema is object, should same as constructor param", () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      const localUINode = new UINode(uiNodeLayout);
      expect(localUINode.getSchema()).to.deep.equal(uiNodeLayout);
    });

    it("loadRemoteLayout: if schema is string, should load from remote and same as the loaded", async () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      const remoteUINode = new UINode({}, request);
      let schema = await remoteUINode.loadRemoteLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      // console.log(remoteUINode.getSchema());
      expect(schema).to.deep.equal(uiNodeLayout);

      // load from cache
      const spy = chai.spy.on(request, "get");
      schema = await remoteUINode.loadRemoteLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      expect(spy).to.have.not.been.called;
      expect(schema).to.deep.equal(uiNodeLayout);

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
      const localUINode = new UINode(uiNodeLayout);
      // await localUINode.loadLayout();
      // local schema
      await localUINode.replaceLayout(stateTestLayout);
      expect(localUINode.getSchema()).to.deep.equal(stateTestLayout);
      expect(localUINode.getErrorInfo()).to.deep.equal({});

      // remote schema
      const remoteUINode = new UINode({}, request);
      const schema = await remoteUINode.replaceLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      expect(remoteUINode.getSchema()).to.deep.equal(uiNodeLayout);
    });

    it("updateLayout: loadLayout should be called", () => {
      const localUINode = new UINode(uiNodeLayout);
      const spy = chai.spy.on(localUINode, "loadLayout");
      // localUINode.loadLayout();
      localUINode.updateLayout();
      expect(localUINode.getSchema()).to.deep.equal(uiNodeLayout);
      expect(spy).to.have.been.called.exactly(1);
    });

    it("getNode: should return correct sub node", async () => {
      const localUINode = new UINode(uiNodeLayout);
      await localUINode.loadLayout();
      const subNode: UINode = localUINode.getNode("children[1]");
      expect(subNode).to.be.instanceOf(UINode);
      expect(subNode.getSchema()).to.deep.equal(uiNodeLayout.children[1]);
    });

    const expectedResult = [
      [
        {
          component: "p",
          datasource: "foo:bar.baz.0.name"
        },
        {
          component: "p",
          datasource: "foo:bar.baz.0.age"
        }
      ],
      [
        {
          component: "p",
          datasource: "foo:bar.baz.1.name"
        },
        {
          component: "p",
          datasource: "foo:bar.baz.1.age"
        }
      ]
    ];

    it("genLiveLayout: follow schema's template field and given data, auto generate layouts", async () => {
      const localUINode = new UINode({});
      const schema = await localUINode.genLiveLayout(
        uiNodeLayout.children[1],
        dataNodeJson.foo.bar.baz
      );

      expect(localUINode.getLiveSchema().children).to.deep.equal(
        expectedResult
      );
    });

    it("assignSchema: if assign a schema to this node, data & schema should loaded", async () => {
      const schemaWithLiveNode: any = uiNodeLayout.children[1];
      const localUINode = new UINode(schemaWithLiveNode);
      await localUINode.loadLayout();
      // data shource loaded
      const data = localUINode.getDataNode().getData();
      const datasource = localUINode.getSchema().datasource.replace(":", ".");
      expect(data).to.deep.equal(_.get(dataNodeJson, datasource));

      // liveschema loaded
      const liveschema: any = localUINode.getLiveSchema();
      expect(liveschema.children).to.deep.equal(expectedResult);

      // children generated
      const children = localUINode.getChildren();
      const firstChildren = children[0][0] as UINode;
      await firstChildren.loadLayout();
      expect(firstChildren).is.instanceOf(UINode);

      // expect first children schema
      const firstchildrenSchema: any = firstChildren.getSchema();
      expect(firstchildrenSchema).to.deep.equal(expectedResult[0][0]);

      // expect first children name is Rui
      const firstNodeData = firstChildren.getDataNode().getData();
      expect(firstNodeData).to.equal("Rui");
    });

    it("loadLayout: should load remote/given layout, and rootSchemas is assigned", async () => {
      // use given layout from constructor
      const schemaPath = `${reqConfig.layoutSchemaPrefix}uinode-basic.json`;
      const uinode = new UINode({}, request);
      const schema = await uinode.loadLayout(schemaPath);
      expect(schema).to.deep.equal(uiNodeLayout);
      const rootSchemas = {
        [schemaPath]: schema
      };
      expect(uinode.getRootSchemas()).to.deep.equal(rootSchemas);
    });
  });
});

// describe("Given an instance of my Dog library", () => {
//   before(() => {
//     // lib = new Dog();
//   });
//   describe("when I need the name", () => {
//     // it("should return the name", () => {
//     //   expect(lib.name).to.be.equal("Dog");
//     // });
//   });
// });
