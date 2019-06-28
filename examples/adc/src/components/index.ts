import { EditableTable } from "./a10/EditableTable";

import {
  DemoInput,
  DemoSelect,
  FormContainer,
  DemoTable,
  DemoTd,
  DemoTr,
  DemoFormItem,
  DemoForm,
  DemoModal,
  DemoTabPane
} from "./demo";

import "antd/dist/antd.css";

// import * as antd from 'antd';
import {
  Row,
  Col,
  Form,
  Cascader,
  Input,
  Checkbox,
  InputNumber,
  Radio,
  Select,
  Switch,
  Button,
  AutoComplete,
  Icon,
  Tooltip,
  Tabs
} from "antd";

export default {
  a10: {
    EditableTable
  },

  demo: {
    DemoInput,
    DemoSelect,
    FormContainer,
    DemoTable,
    DemoTd,
    DemoTr,
    DemoFormItem,
    DemoForm,
    DemoModal,
    DemoTabPane
  },
  antd: {
    Row,
    Col,
    Form,
    FormItem: Form.Item,
    Cascader,
    Input,
    Checkbox,
    CheckboxGroup: Checkbox.Group,
    InputNumber,
    Radio,
    RadioGroup: Radio.Group,
    Select,
    Switch,
    Button,
    AutoComplete,
    AutoCompleteOption: AutoComplete.Option,
    Icon,
    Tooltip,
    Tabs,
    TabPane: Tabs.TabPane
  }
};
