/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import {
  DataEngine,
  Request,
  Cache,
  PluginManager,
  parseSchemaPath
} from "../../src";
import reqConfig from "../config/request";
import dataJson from "../data/foo.json";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const request = Request.getInstance();
request.setConfig(reqConfig);

const schemaPath = "foo.bar";

describe("Given all the DataEngine", () => {
  before(() => {
    Cache.clearDataCache();
  });
  describe("the given source", () => {
    it("constructor: should return the schema path with request info appended", async () => {
      // const dataEngine = new DataEngine(request);
      // expect(dataEngine.cacheID).to.equal("any-root-name");
    });

    it("parseSchemaPath: should return the schema path with request info appended", async () => {
      let dataEngine = DataEngine.getInstance();
      dataEngine.setRequest(request);
      // with :
      let path = parseSchemaPath("any.test:bar");
      expect(path).to.be.deep.equal("any.test.json");

      // without :
      path = parseSchemaPath("any.test.bar");
      expect(path).to.be.deep.equal("any.json");
    });

    // it("loadData: data should be loaded from remote and be cached", async () => {
    //   Cache.clearDataCache();
    //   let dataEngine = new DataEngine(schemaPath, request);
    //   await dataEngine.loadData();
    //   expect(dataEngine.errorInfo).to.be.undefined;
    //   expect(dataEngine.data).to.deep.equal(dataJson);
    //   // cache test
    //   let result = await dataEngine.loadData();
    //   expect(result).to.deep.equal(dataJson);

    //   // give a source
    //   result = await dataEngine.loadData("foo.bar.baz");
    //   expect(result).to.deep.equal(dataJson);
    // });

    it("sendRequest: request agent for all api request methods", async () => {
      let dataEngine = DataEngine.getInstance();
      dataEngine.setRequest(request);

      // use default source
      await dataEngine.sendRequest({ source: schemaPath });
      expect(dataEngine.errorInfo).to.be.null;
      expect(dataEngine.data).to.deep.equal(dataJson);

      // use customize source
      const dataSource = { source: "foo.bar.baz" };
      await dataEngine.sendRequest(dataSource, { str: "query-string-1" });
      expect(dataEngine.errorInfo).to.be.null;
      expect(dataEngine.data).to.deep.equal(dataJson);

      // cache test
      const spy = chai.spy(Cache.setData);
      await dataEngine.sendRequest(dataSource, { str: "query-string-1" });
      expect(spy).to.not.be.called;

      // use undefined request method
      await dataEngine.sendRequest(dataSource, null, "nothing");
      let errorInfo = {
        status: 1001,
        code: "Method nothing did not defined on Request"
      };
      expect(dataEngine.errorInfo).to.be.deep.equal(errorInfo);
      expect(dataEngine.data).to.be.empty;

      // load empty path
      await dataEngine.sendRequest({ source: "any.wrong.place" });
      expect(dataEngine.data).to.be.empty;
      errorInfo = {
        status: 2001,
        code: `Schema for any.wrong.place not found`
      };
      expect(dataEngine.errorInfo).to.deep.equal(errorInfo);

      // blocked by before plugins
      const plugins = {
        before_blocker: {
          type: "data.request.before",
          initialize: false,
          callback: () => {
            return false;
          },
          name: "before_blocker"
        }
      };
      dataEngine.pluginManager.loadPlugins(plugins);
      await dataEngine.sendRequest({ source: "foo.bar.baz" });
      errorInfo = {
        status: 1001,
        code: "Plugins blocked the commit"
      };
      expect(dataEngine.errorInfo).to.be.deep.equal(errorInfo);
      expect(dataEngine.data).to.be.empty;
    });
  });

  after(() => {
    Cache.clearCache();
    PluginManager.unloadPlugins();
  });
});
