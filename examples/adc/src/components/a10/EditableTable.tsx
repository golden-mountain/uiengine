import React from "react";
import _ from "lodash";
import { Table, Input, Button, Popconfirm, Form, Icon } from "antd";
// import { A10Modal } from "./Modal";

import {
  UIEngineContext,
  NodeController,
  ComponentWrapper,
  DataPool
} from "uiengine";
import { IWorkingMode } from "../../../../../typings";
const EditableContext = React.createContext({});

const EditableRow = (props: any) => (
  <EditableContext.Provider value={props.form}>
    <tr {...props} />
  </EditableContext.Provider>
);

const EditableFormRow = Form.create()(EditableRow);

class EditableCell extends React.Component<any, any> {
  state = {
    editing: false
  };
  private form: any;
  private input: any;

  toggleEdit = () => {
    const editing = !this.state.editing;
    this.setState({ editing: true }, () => {
      if (editing) {
        try {
          this.input.focus();
        } catch {}
      }
    });
  };

  save = (e: any) => {
    const { record, handleSave } = this.props;
    this.form.validateFields((error: any, values: any) => {
      if (error && error[e.currentTarget.id]) {
        return;
      }
      this.toggleEdit();
      handleSave({ ...record, ...values });
    });
  };

  renderCell = (form: any) => {
    this.form = form;
    const { children, dataIndex, record, title, index } = this.props;
    if (!record.uinode) return;

    let editing: any = this.state.editing;

    const uiNode = record.uinode.children[index];
    return editing ? (
      <Form.Item style={{ margin: 0 }}>
        {/* {form.getFieldDecorator(dataIndex, {
          rules: [
            {
              required: true,
              message: `${title} is required.`
            }
          ],
          initialValue: record[dataIndex]
        })( */}
        <ComponentWrapper
          uiNode={uiNode}
          ref={node => (this.input = node)}
          onPressEnter={this.save}
          onBlur={this.save}
        />
        {/* )} */}
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24, width: "100%", height: "30px" }}
        onClick={this.toggleEdit}
      >
        {children}
      </div>
    );
  };

  render() {
    const {
      editable,
      dataIndex,
      title,
      record,
      index,
      handleSave,
      children,
      ...restProps
    } = this.props;
    return (
      <td {...restProps}>
        {editable ? (
          <EditableContext.Consumer>{this.renderCell}</EditableContext.Consumer>
        ) : (
          children
        )}
      </td>
    );
  }
}

export class EditableTable extends React.Component<any, any> {
  private columns: any;
  static contextType = UIEngineContext;

  constructor(props: any) {
    super(props);
    this.state = {
      dataSource: this.props.uinode.dataNode.data || [],
      showPopup: false,
      dataKey: 0
    };

    this.columns = props.uinode.schema.$children.map((node: any) => {
      const datasource =
        typeof node.datasource === "string"
          ? node.datasource
          : node.datasource.source;
      return {
        title: node.props.title,
        dataIndex: datasource.split(".").pop(),
        schema: node,
        width: "30%",
        editable: true
      };
    });

    this.columns.push({
      title: "operation",
      dataIndex: "operation",
      render: (text: any, record: any, index: number) =>
        this.props.uinode.dataNode.data.length >= 1 ? (
          <>
            <Icon
              type="edit"
              theme="twoTone"
              twoToneColor="#428BCA"
              style={{ paddingRight: "10px" }}
              onClick={() => this.handleEdit(index)}
            />

            <Popconfirm
              title="Are you sure to delete?"
              onConfirm={() => this.handleDelete(index)}
            >
              <Icon type="delete" theme="twoTone" twoToneColor="red" />
            </Popconfirm>
          </>
        ) : null
    });
  }

  handleEdit = (key: any) => {
    // this.setState({ dataKey: key, showPopup: true });
    const {
      modal: { connect }
    } = this.props;
    const workingMode = {
      mode: "edit-pool",
      options: {
        key,
        source: connect
      }
    };
    this.openModal(workingMode);
  };

  handleDelete = async (key: any) => {
    await this.props.uinode.dataNode.deleteData(key);
  };

  handleAdd = async () => {
    this.props.uinode.dataNode.createRow();
  };

  handleAdvanceAdd = async () => {
    const {
      modal: { connect }
    } = this.props;
    const workingMode = {
      mode: "new",
      options: {
        source: connect
      }
    };
    this.openModal(workingMode);
  };

  handleCancel = () => {
    const nodeController = NodeController.getInstance();
    const {
      modal: { layout, connect }
    } = this.props;

    // if (_.has(connect, "source")) {
    //   const dataPool = DataPool.getInstance();
    //   dataPool.clear(_.get(connect, "source"));
    // }
    nodeController.hideUINode(layout, true);
  };

  openModal = (workingMode?: IWorkingMode) => {
    if (_.has(this.props, "modal.layout")) {
      const {
        modal: { layout },
        modal
      } = this.props;

      const options = {
        ...modal,
        onClose: this.handleCancel,
        // visible: true,
        parentNode: this.props.uinode
      };
      // const workflow = Workflow.getInstance();
      this.context.controller.setWorkingMode(layout, workingMode);
      this.context.controller.workflow.activeLayout(layout, options);
    } else {
      console.error("popup layout not provided on schema");
    }
  };

  handleSave = (row: any) => {
    const newData = this.props.uinode.dataNode.data;
    const dataSource = { dataSource: newData };
    this.setState(dataSource);
  };

  render() {
    // const { dataSource } = this.state;
    let dataSource = _.cloneDeep(this.props.uinode.dataNode.data);
    // console.log("data Source changed,", this.props.state);
    // const { modal, uinode } = this.props;
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell
      }
    };
    // add the key for each dataSource
    if (dataSource && dataSource.length) {
      dataSource.forEach((record: any, index: number) => {
        record.key = index;
        record.uinode = this.props.uinode.children[index];
      });
    }
    const columns = this.columns.map((col: any, index: number) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record: any) => {
          return {
            record,
            editable: col.editable,
            dataIndex: col.dataIndex,
            title: col.title,
            handleSave: this.handleSave,
            index: index
          };
        }
      };
    });
    return (
      <div>
        <Button
          onClick={this.handleAdd}
          type="primary"
          style={{ marginBottom: 16, marginRight: 10 }}
        >
          Add a row
        </Button>

        <Button
          onClick={this.handleAdvanceAdd}
          type="danger"
          style={{ marginBottom: 16 }}
        >
          Advance Create...
        </Button>
        <Table
          components={components}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={dataSource}
          columns={columns}
        />
      </div>
    );
  }
}
