/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
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

// let remoteUINode: any;
// let localUINode: any;

const creatLocalUINode = () => {
  return new UINode(uiNodeLayout);
};

const createRemoteUINode = () => {
  const request = new Request(reqConfig);
  return new UINode({}, request);
};

describe("Given an instance of my UINode library", () => {
  before(() => {});
  describe("the given layout schema ", () => {
    it("getSchema: if schema is object, should same as constructor param", () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      const localUINode = creatLocalUINode();
      expect(localUINode.getSchema()).to.deep.equal(uiNodeLayout);
    });

    it("loadRemoteLayout: if schema is string, should load from remote and same as the loaded", async () => {
      // expect(uiNode.schema).to.be.equal(uinodeLayout);
      const remoteUINode = createRemoteUINode();
      const promise = remoteUINode.loadRemoteLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      promise
        .then((res: any) => {
          // console.log(remoteUINode.getSchema());
          expect(remoteUINode.getSchema()).to.deep.equal(uiNodeLayout);
        })
        .catch((e: any) => {
          console.log(e.message);
        });
    });

    it("getDataNode: if datasource is not empty, should return a correct DataNode", async () => {
      const remoteUINode = createRemoteUINode();
      remoteUINode.loadData(`${reqConfig.dataPathPrefix}/basic.json`);
      const dataNode = remoteUINode.getDataNode();
      expect(dataNode).to.have.property("getData");
      // dataNode
      //   .getData()
      //   .then((v: any) => {
      //     expect(dataNode.getData()).to.deep.equal(dataNodeJson);
      //   })
      //   .catch(function(e: any) {
      //     console.log(e.message);
      //   });
    });

    it("replaceLayout: if bring a new schema on this node, this uiNode should replaced with new", () => {
      const localUINode = creatLocalUINode();
      // local schema
      const newLocalUINode = localUINode.replaceLayout(stateTestLayout);
      const updateLayout = (node: any, node2: any, replacedLayout: any) => {
        expect(node).to.equal(node2);
        expect(node.getSchema()).to.deep.equal(replacedLayout);
        expect(node.getErrorInfo()).to.deep.equal({});
      };
      updateLayout(newLocalUINode, localUINode, stateTestLayout);

      // remote schema
      const remoteUINode = createRemoteUINode();
      const newRemoteUINode = remoteUINode.replaceLayout(
        `${reqConfig.layoutSchemaPrefix}uinode-basic.json`
      );
      expect(newRemoteUINode).to.equal(remoteUINode);
      newRemoteUINode
        .getSchema()
        .then((v: any) => {
          // expect(newRemoteUINode.getSchema()).to.deep.equal(uiNodeLayout);
          updateLayout(newRemoteUINode, remoteUINode, uiNodeLayout);
        })
        .catch((e: any) => {
          console.log(e.message);
        });
    });

    it("updateLayout: loadLayout should be called", () => {
      const localUINode = creatLocalUINode();
      const spy = chai.spy.on(localUINode, "loadLayout");
      const remoteSpy = chai.spy.on(localUINode, "loadRemoteLayout");
      const assignSchemaSpy = chai.spy.on(localUINode, "assignSchema");
      // const constructorSpy = chai.spy.on(localUINode, "constructor");
      localUINode.updateLayout();
      expect(localUINode.getSchema()).to.deep.equal(uiNodeLayout);
      expect(spy).to.have.been.called.once;
      expect(remoteSpy).to.have.not.been.called();
      expect(assignSchemaSpy).to.have.been.called.exactly(1);
      expect(spy).to.have.been.called.with.exactly(localUINode.getSchema());
      // constructor called
      // expect(constructorSpy).to.have.been.called.exactly(1);
    });

    it("getNode: should return correct sub node", () => {
      const localUINode = creatLocalUINode();
      const subNode: UINode = localUINode.getNode("children[1]");
      expect(subNode).to.be.instanceOf(UINode);
      expect(subNode.getSchema()).to.deep.equal(uiNodeLayout.children[1]);
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
