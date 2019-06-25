/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { UINode, StateNode, Cache, PluginManager } from "../src";

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
      const plugins = stateNode.getPluginManager().getPlugins("state");
      expect(plugins).to.have.property("visible");
    });

    it("renewState: should renew all state data", async () => {
      const uiNode = new UINode({});
      const stateNode = uiNode.getStateNode();
      const state = await stateNode.renewStates();
      expect(state).to.have.property("visible");
      expect(stateNode.getState()).to.have.property("visible");
      expect(stateNode.getState("visible")).is.not.undefined;
    });

    it("loadPlugins: should renew all state data", () => {
      const uiNode = new UINode({});
      const stateNode = uiNode.getStateNode();
      stateNode.getPluginManager().loadPlugins();
      let plugins = stateNode.getPluginManager().getPlugins("state");

      // have buildin plugin value
      expect(plugins).to.have.property("visible");
      expect(plugins).to.have.property("valid");

      // append plugins
      const plugin = {
        type: "any",
        initialize: false,
        callback: () => {},
        name: "anyname"
      };
      const externalPlugins = {
        external_plugin_1: plugin,
        external_plugin_2: plugin,
        external_plugin_3: plugin
      };
      stateNode.getPluginManager().loadPlugins(externalPlugins);

      plugins = stateNode.getPluginManager().getPlugins("any");
      expect(Object.keys(plugins).length).to.equal(1);
      expect(plugins).to.have.property("anyname");
      expect(plugins).to.not.have.property("external_plugin_1");
    });
  });

  after(() => {
    Cache.clearCache();
    PluginManager.unloadPlugins();
  });
});
