/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { DataNode, Request } from "../../../../src";
// import reqConfig from "./config/request";
import reqConfig from "../../../config/request";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const request = new Request(reqConfig);

describe("Given all the DataNode validation plugins", () => {
  before(() => {});
  describe("the given validaton plugin ", async () => {
    it("should validate all given number rule", async () => {
      let dataNode = new DataNode("foo:bar", request);
      await dataNode.loadData();
      // const schema = dataNode.getSchema("baz");
      // console.log(schema);
    });
  });
});
