/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { Request, Cache, DataMapper } from "../src";
import reqConfig from "./config/request";
import dataSchemaJson from "./data/schema/foo.json";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const request = new Request(reqConfig);

const schemaPath = "foo.json";

describe("Given all the DataMapper", () => {
  before(() => {});
  describe("the given source", () => {
    it("loadSchema: schema should be loaded from remote", async () => {
      Cache.clearDataSchemaCache();
      const dataMapper = new DataMapper(schemaPath, request);
      expect(dataMapper.source).to.equal(schemaPath);
      let schema = await dataMapper.loadSchema();
      expect(schema).to.deep.equal(dataSchemaJson);

      // load from cache
      schema = await dataMapper.loadSchema();
      expect(schema).to.deep.equal(dataSchemaJson);
    });

    it("getDataEntryPoing: should return the data api path", async () => {
      const dataMapper = new DataMapper(schemaPath, request);
      let path = dataMapper.getDataEntryPoint("get");
      let dataPathPrefix = reqConfig.dataPathPrefix;
      let expectedPath = `${dataPathPrefix}${schemaPath}`;
      expect(path).to.deep.equal(expectedPath);
      // load from cache
      path = dataMapper.getDataEntryPoint("get");
      expect(path).to.deep.equal(expectedPath);

      // delete path
      path = dataMapper.getDataEntryPoint("delete");
      dataPathPrefix = reqConfig.dataPathPrefix;
      expectedPath = `${dataPathPrefix}foo/{foo.name}`;
      expect(path).to.deep.equal(expectedPath);
    });
  });
});
