/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { DataEngine, Request, Cache, DataMapper } from "../src";
import reqConfig from "./config/request";
import dataSchemaJson from "./data/schema/foo.json";
import dataJson from "./data/foo.json";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const request = new Request(reqConfig);

const schemaPath = "foo.bar";

describe("Given all the DataEngine", () => {
  before(() => {});
  describe("the given source", () => {
    it("constructor: should return the schema path with request info appended", async () => {
      const dataEngine = new DataEngine(schemaPath, request);
      expect(dataEngine.source).to.equal(schemaPath);
      expect(dataEngine.schemaPath).to.be.deep.equal("foo.json");
    });

    it("parseSchemaPath: should return the schema path with request info appended", async () => {
      const dataEngine = new DataEngine(schemaPath, request);
      // with :
      let path = dataEngine.parseSchemaPath("any.test:bar");
      expect(path).to.be.deep.equal("any.test.json");

      // without :
      path = dataEngine.parseSchemaPath("any.test.bar");
      expect(path).to.be.deep.equal("any.json");
    });

    it("loadData: data should be loaded from remote and be cached", async () => {
      Cache.clearDataCache();
      let dataEngine = new DataEngine(schemaPath, request);
      await dataEngine.loadData();
      expect(dataEngine.data).to.deep.equal(dataJson);
      // cache test
      let result = await dataEngine.loadData();
      expect(result).to.deep.equal(dataJson);

      // give a source
      result = await dataEngine.loadData("foo.bar.baz");
      expect(result).to.deep.equal(dataJson);
    });
  });
});
