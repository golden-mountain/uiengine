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
      dataPool.set(dataPartialOne, "foo");
      let expectedValue: any = { foo: { foo: { foo: "bar" } } };
      expect(dataPool.data).to.deep.equal(expectedValue);

      // instance set
      const dataPool2 = DataPool.getInstance();
      expect(dataPool).to.equal(dataPool2);
      dataPool2.set(dataPartialTwo, "baz");
      expectedValue = {
        foo: { foo: { foo: "bar" } },
        baz: { baz: { any: "value" } }
      };
      expect(dataPool2.data).to.deep.equal(expectedValue);
    });

    it("get: should get given paths of data", () => {
      const dataPool = DataPool.getInstance();
      expect(dataPool.get(["foo"], false)).to.deep.equal([{ foo: "bar" }]);
      const expectedData = [
        { foo: { foo: { foo: "bar" } } },
        { baz: { baz: dataPartialTwo } }
      ];
      expect(dataPool.get(["foo", "baz"])).to.deep.equal(expectedData);
    });

    it("clear: should clear all the data whatever given path or not", () => {
      const dataPool = DataPool.getInstance();
      dataPool.clear("foo");
      let expectedValue = { foo: {}, baz: { baz: dataPartialTwo } };
      expect(dataPool.data).to.deep.equal(expectedValue);
      dataPool.clear();
      expect(dataPool.data).to.deep.equal({});
    });
  });

  after(() => {});
});
