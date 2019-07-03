/* global describe, it, before */

import chai from "chai";
import chaiSpies from "chai-spies";
import _ from "lodash";

import { DataPool } from "../../src";

// const uiNodeLayout = {};
// chai.expect();
chai.use(chaiSpies);
const expect = chai.expect;
const expectedValue = { foo: "bar", baz: { any: "value" } };
const dataPartialOne = { foo: "bar" };
const dataPartialTwo = { any: "value" };

describe("Given all the DataPool", () => {
  before(() => {
    const dataPool = DataPool.getInstance();
    dataPool.clear();
  });
  describe("the given data", () => {
    it("set: should set pool's data whatever given the path or not", () => {
      const dataPool = DataPool.getInstance();
      dataPool.set(dataPartialOne);
      expect(dataPool.data).to.deep.equal(dataPartialOne);

      // instance set
      const dataPool2 = DataPool.getInstance();
      expect(dataPool).to.equal(dataPool2);
      dataPool2.set(dataPartialTwo, "baz");
      console.log(dataPool2.data);
      expect(dataPool2.data).to.deep.equal(expectedValue);
    });

    it("get: should get given paths of data", () => {
      const dataPool = DataPool.getInstance();
      expect(dataPool.get(["foo"], false)).to.deep.equal(["bar"]);
      const expectedData = [{ foo: "bar" }, { baz: dataPartialTwo }];
      expect(dataPool.get(["foo", "baz"])).to.deep.equal(expectedData);
    });

    it("clear: should clear all the data whatever given path or not", () => {
      const dataPool = DataPool.getInstance();
      dataPool.clear("foo");
      expect(dataPool.data).to.deep.equal({ baz: dataPartialTwo });
      dataPool.clear();
      expect(dataPool.data).to.deep.equal({});
    });
  });

  after(() => {});
});
