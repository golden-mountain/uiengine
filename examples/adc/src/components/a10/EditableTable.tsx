import React from "react";
import _ from "lodash";
import { Table, Input, Button, Popconfirm, Form } from "antd";
import { A10Modal } from "./Modal";

import { UIEngineContext } from "UIEngine";
import { IUINode } from "UIEngine/typings";

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
    this.setState({ editing }, () => {
      if (editing) {
        this.input.focus();
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
    const { children, dataIndex, record, title } = this.props;
    const { editing } = this.state;
    return editing ? (
      <Form.Item style={{ margin: 0 }}>
        {form.getFieldDecorator(dataIndex, {
          rules: [
            {
              required: true,
              message: `${title} is required.`
            }
          ],
          initialValue: record[dataIndex]
        })(
          <Input
            ref={node => (this.input = node)}
            onPressEnter={this.save}
            onBlur={this.save}
          />
        )}
      </Form.Item>
    ) : (
      <div
        className="editable-cell-value-wrap"
        style={{ paddingRight: 24 }}
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
    // console.log(this.props.uinode.dataNode.data);

    this.columns = this.props.uinode
      .getChildren([0])
      .children.map((node: any) => {
        return {
          title: node.props.title,
          dataIndex: node.schema.datasource.split(".").pop(),
          node,
          width: "30%",
          editable: true
        };
      });

    this.columns.push({
      title: "operation",
      dataIndex: "operation",
      render: (text: any, record: any) =>
        this.state.dataSource.length >= 1 ? (
          <Popconfirm
            title="Sure to delete?"
            onConfirm={() => this.handleDelete(record.key)}
          >
            <div>Delete</div>
          </Popconfirm>
        ) : null
    });

    this.state = {
      dataSource: this.props.uinode.dataNode.data,
      show_popup: false
    };
  }

  handleDelete = (key: any) => {
    const dataSource = [...this.state.dataSource];
    this.setState({ dataSource: dataSource.filter(item => item.key !== key) });
  };

  handleAdd = () => {};
  openModal = () => {
    if (_.has(this.props, "modal.layout")) {
      this.setState({ show_popup: true });
    } else {
      console.error("popup layout not provided on schema");
    }
  };

  handleSave = (row: any) => {
    const newData = this.props.uinode.dataNode.data;
    const dataSource = { dataSource: newData };
    this.setState(dataSource);
  };

  closeModal = () => {
    this.setState({
      show_popup: false,
      dataSource: this.props.uinode.dataNode.data
    });
  };

  render() {
    const { dataSource } = this.state;
    const { modal, uinode } = this.props;
    const components = {
      body: {
        row: EditableFormRow,
        cell: EditableCell
      }
    };
    const columns = this.columns.map((col: any) => {
      if (!col.editable) {
        return col;
      }
      return {
        ...col,
        onCell: (record: any) => ({
          record,
          editable: col.editable,
          dataIndex: col.dataIndex,
          title: col.title,
          handleSave: this.handleSave
        })
      };
    });
    return (
      <div>
        <Button
          onClick={this.handleAdd}
          type="primary"
          style={{ marginBottom: 16 }}
        >
          Add a row
        </Button>

        <Button
          onClick={this.openModal}
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
        {this.state.show_popup ? (
          <A10Modal
            {...modal}
            close={this.closeModal.bind(this)}
            uinode={uinode}
          />
        ) : null}
      </div>
    );
  }
}
