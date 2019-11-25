/* global describe, it, before */
import chai from "chai";
import engine from "../../src/helpers/APIEngine";
import * as plugins from "../../src/plugins";

const expect = chai.expect;

describe("Given an instance of Register's plugin apis library", () => {
  before(() => {});
  describe("the given response ", () => {
    it("get:should same as json file state-test.json", () => {
      // register plugin
      engine.register.plugin.set(plugins);
      // expect(engine.plugin()).to.deep.equal(plugins)
      // get plugins registered, if empty params given, get all
      // engine.register.plugin.get();
      // engine.register.plugin.get('plugin-id');`
    });
  });
});
