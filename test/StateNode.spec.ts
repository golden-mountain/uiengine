/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, DataNode, StateNode } from "../src";
// import reqConfig from "./config/request";
import stateNodeBasicLayout from "./layouts/state-node-basic.json";
import { visible } from "../src/plugins/state";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;

describe("Given an instance of my StateNode library", () => {
  before(() => {});
  describe("the given layoutNode and DataNode ", () => {
    it("constructor: StateNode should initialized on UINode creation", () => {
      const uiNode = new UINode({});
      const stateNode = uiNode.getStateNode();
      expect(stateNode).is.instanceOf(StateNode);
      const plugins = stateNode.getPlugins();
      expect(plugins).to.have.property("visible");
    });

    it("renewState: should renee all state data", () => {
      const uiNode = new UINode({});
      const stateNode = uiNode.getStateNode();
      const state = stateNode.renewStates();
      expect(state).to.have.property("visible");
      expect(stateNode.getState()).to.have.property("visible");
      expect(stateNode.getState("visible")).is.not.undefined;
    });

    it("loadPlugins: should renee all state data", () => {
      const uiNode = new UINode({});
      const stateNode = uiNode.getStateNode();
      const plugins = stateNode.loadPlugins();
      // have buildin plugin value
      expect(plugins).to.have.property("visible");
    });
  });
});

describe("Given all the default plugins", () => {
  before(() => {});
  describe("the given plugins ", () => {
    it("visiblization should be caculated ", () => {
      const uiNode = new UINode(stateNodeBasicLayout);
      const stateNode = uiNode.getStateNode();
      const visibles = stateNode.getState("visible");
      //   expect(_.get(visible, ''))
    });
  });
});
