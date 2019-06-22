/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { PluginManager } from "../src";

chai.use(chaiSpies);
const expect = chai.expect;

class PluginInjector {
  name = "plugin-demo";
}

const plugins = {
  external_plugin_1: {
    type: "foo",
    initialize: false,
    callback: () => {
      return 1;
    },
    name: "anyname1"
  },
  external_plugin_2: {
    type: "foo",
    initialize: false,
    callback: () => {
      return 2;
    },
    name: "anyname2"
  },
  external_plugin_3: {
    type: "baz",
    initialize: false,
    callback: () => {},
    name: "anyname3"
  }
};
const injector = new PluginInjector();
const manager = new PluginManager(injector, plugins);

describe("Given an instance of my PluginManager library", () => {
  before(() => {});
  describe("the given plugins", () => {
    // it("constructor: plugins should initialized the caller & plugins", () => {
    //   expect(manager.getPlugins()).to.deep.equal(plugins);
    // });

    it("getPlugins: should get plugins by type or no type", () => {
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
      manager.unloadPlugins("bar");
      allPlugins = manager.getPlugins();
      expect(_.keys(allPlugins).length).to.equal(2);

      // remove a single plugin
      manager.unloadPlugins("foo", "anyname1");
      allPlugins = manager.getPlugins("foo");
      expect(_.keys(allPlugins).length).to.equal(1);
    });

    it("executePlugins: should execute specific type of plugins", async () => {
      manager.loadPlugins(plugins);
      const result = await manager.executePlugins("foo");
      const expectedResult = {
        anyname1: 1,
        anyname2: 2
      };
      expect(result).to.deep.equal(expectedResult);
    });
  });
});
