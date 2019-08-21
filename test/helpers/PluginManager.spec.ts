/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { PluginManager } from "../../src";

chai.use(chaiSpies);
const expect = chai.expect;

class PluginInjector {
  name = "plugin-demo";
}
const callSeq: any = [];
const plugins = {
  external_plugin_1: {
    type: "foo",
    priority: 3,
    callback: () => {
      callSeq.push(1);
      return 1;
    },
    name: "anyname1"
  },
  external_plugin_2: {
    type: "foo",
    priority: 2,
    callback: () => {
      callSeq.push(2);
      return 2;
    },
    name: "anyname2"
  },
  external_plugin_3: {
    type: "baz",
    priority: 1,
    callback: () => {
      callSeq.push(3);
      return 3;
    },
    name: "anyname3"
  }
};
const injector = new PluginInjector();

describe("Given an instance of my PluginManager library", () => {
  before(() => {});
  describe("the given plugins", () => {
    // it("constructor: plugins should initialized the caller & plugins", () => {
    //   expect(manager.getPlugins()).to.deep.equal(plugins);
    // });

    it("getPlugins: should get plugins by type or without type", () => {
      const manager = new PluginManager(injector, plugins);
      let fooPlugins = manager.getPlugins("foo");
      expect(_.keys(fooPlugins).length).to.equal(2);
      fooPlugins = manager.getPlugins("baz");
      expect(_.keys(fooPlugins).length).to.equal(1);

      // get all
      fooPlugins = manager.getPlugins();
      let expectedPlugins = {
        foo: {
          anyname1: plugins.external_plugin_1,
          anyname2: plugins.external_plugin_2
        },
        baz: { anyname3: plugins.external_plugin_3 }
      };
      expect(fooPlugins).to.deep.equal(fooPlugins);

      // get single
      fooPlugins = manager.getPlugins("foo", "anyname1");
      expect(fooPlugins).to.deep.equal(plugins.external_plugin_1);
    });

    it("loadPlugins: should append new loaded plugins and store them by type", () => {
      PluginManager.unloadPlugins();
      const manager = new PluginManager(injector, plugins);
      const extPlugins = {
        external_plugin_4: {
          type: "bar",
          initialize: false,
          callback: () => {
            return "string";
          }
        }
      };
      const allPlugins = manager.loadPlugins(extPlugins);
      expect(_.keys(allPlugins).length).to.equal(3);
      const barPlugin = manager.getPlugins("bar");
      expect(_.keys(barPlugin).length).to.equal(1);

      // name could empty, then use the key
      expect(barPlugin).to.have.property("external_plugin_4");
    });

    it("unloadPlugins: should remove a specific type of plugins", () => {
      PluginManager.unloadPlugins();
      const manager = new PluginManager(injector, plugins);
      const extPlugins = {
        external_plugin_4: {
          type: "bar",
          initialize: false,
          callback: () => {
            return "string";
          }
        }
      };
      manager.loadPlugins(extPlugins);
      let allPlugins = manager.getPlugins();
      // before remove
      expect(_.keys(allPlugins).length).to.equal(3);

      // after remove a type
      PluginManager.unloadPlugins("bar");
      allPlugins = manager.getPlugins();
      expect(_.keys(allPlugins).length).to.equal(2);

      // remove a single plugin
      PluginManager.unloadPlugins("foo", "anyname1");
      allPlugins = manager.getPlugins("foo");
      expect(_.keys(allPlugins).length).to.equal(1);
    });

    it("executePlugins: should execute specific type of plugins", async () => {
      PluginManager.unloadPlugins();
      const manager = new PluginManager(injector, plugins);
      manager.loadPlugins(plugins);
      const result = await manager.executePlugins("foo");
      const expectedResult = {
        anyname1: 1,
        anyname2: 2
      };
      expect(result).to.deep.equal(expectedResult);

      // execute order
      const expectOrder = [2, 1];
      expect(expectOrder).to.deep.equal(callSeq);
    });
  });

  // clear plugins
  after(() => {
    PluginManager.unloadPlugins();
  });
});
