/* global describe, it, before */

import chai from "chai";
import reqConfig from "../config/request";
import { Workflow, NodeController } from "../../src";
import stateTestJSON from "../layouts/state-test.json";
import { IWorkflow } from "../../typings";

const expect = chai.expect;

let workflow: IWorkflow;

describe("Given an instance of Workflow library", () => {
  before(() => {});
  describe("the given action from user side", () => {
    it("activeLayout: could active loaded or not loaded layout and show it out", () => {});

    it("deactiveLayout: could deactive the current active layout", () => {});

    it("removeNodes: could remove nodes from current actived layout", () => {});

    it("refreshNodes: could refresh the load already rendered", () => {});

    it("assignPropsToNode: could assign new props to selected nodes and refresh nodes", () => {});

    it("updateData: could update data and re-render the correspond node", () => {});

    it("updateState: could update state and re-render the correspond node", () => {});
  });
});
