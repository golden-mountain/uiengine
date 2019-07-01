import React from "react";
import _ from "lodash";
import { Table, Input, Button, Popconfirm, Form } from "antd";
import { A10Modal } from "./Modal";

import { UIEngineContext } from "UIEngine";

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
    this.columns = [
      {
        title: "name",
        dataIndex: "name",
        width: "30%",
        editable: true
      },
      {
        title: "age",
        dataIndex: "age"
      },
      {
        title: "address",
        dataIndex: "address"
      },
      {
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
      }
    ];

    const dataSource = props.value;
    // console.log(dataSource);
    this.state = {
      // dataSource: [
      //   {
      //     key: '0',
      //     name: 'Edward King 0',
      //     age: '32',
      //     address: 'London, Park Lane no. 0',
      //   },
      //   {
      //     key: '1',
      //     name: 'Edward King 1',
      //     age: '32',
      //     address: 'London, Park Lane no. 1',
      //   },
      // ],
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
    const newData = [...this.state.dataSource];
    const index = newData.findIndex(item => row.key === item.key);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row
    });
    const dataSource = { dataSource: newData };
    this.setState(dataSource);
    this.props.modelmanager
      .getStateController()
      .setDataOnNode(this.props.dataSource, dataSource);
  };

  closeModal = () => {
    this.setState({ show_popup: false });
  };

  render() {
    const { dataSource } = this.state;
    const { modal } = this.props;
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
          Full Fill a Port
        </Button>
        <Table
          components={components}
          rowClassName={() => "editable-row"}
          bordered
          dataSource={dataSource}
          columns={columns}
        />
        {this.state.show_popup ? (
          <A10Modal {...modal} close={this.closeModal.bind(this)} />
        ) : null}
      </div>
    );
  }
}
