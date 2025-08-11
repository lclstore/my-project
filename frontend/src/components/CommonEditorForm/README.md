# CommonEditorForm 通用编辑表单组件

CommonEditorForm 是一个功能强大的通用表单编辑器组件，用于创建和编辑各种类型的表单数据。它支持基础表单和高级表单两种模式，能够处理复杂的表单布局、数据验证和提交逻辑。

## 功能特性

- **多模式支持**：提供基础表单（BasicForm）和高级表单（AdvancedForm）两种模式
- **自动数据加载**：根据ID自动从服务器加载表单数据
- **字段类型丰富**：支持输入框、下拉选择、日期选择器、开关、文件上传等多种表单控件
- **表单状态管理**：内置表单状态跟踪，支持脏数据检测
- **表单验证**：支持必填项验证和自定义验证规则
- **折叠面板**：支持将表单分组展示在可折叠的面板中
- **拖拽排序**：支持对列表项进行拖拽排序
- **动态表单**：支持动态添加、删除、复制表单项
- **数据联动**：支持表单字段之间的数据联动
- **自定义布局**：支持左右布局和自定义布局配置
- **头部按钮管理**：自动处理表单头部的操作按钮

## 基本用法

```jsx
import CommonEditor from '@/components/CommonEditorForm';

// 基础表单示例
const BasicFormExample = () => {
  // 定义表单字段配置
  const fields = [
    {
      name: 'name',
      label: '名称',
      type: 'input',
      required: true,
    },
    {
      name: 'description',
      label: '描述',
      type: 'textarea',
    },
    {
      name: 'status',
      label: '状态',
      type: 'select',
      options: [
        { label: '启用', value: 'ENABLED' },
        { label: '禁用', value: 'DISABLED' },
      ],
      defaultValue: 'ENABLED',
    }
  ];

  // 定义表单配置
  const config = {
    title: '创建项目',
    formName: 'projectForm',
    layout: 'vertical',
    navigateAfterSave: true,
    afterSaveUrl: '/projects',
  };

  // 处理保存逻辑
  const handleSave = (data, id, utils) => {
    console.log('保存数据:', data);
    utils.messageApi.success('保存成功!');
    utils.navigate('/projects');
  };

  return (
    <CommonEditor
      formType="basic"
      fields={fields}
      config={config}
      onSave={handleSave}
      moduleKey="projects"
    />
  );
};

export default BasicFormExample;
```

## 高级用法

```jsx
import CommonEditor from '@/components/CommonEditorForm';

// 高级表单示例
const AdvancedFormExample = () => {
  // 定义表单字段配置，包含折叠面板
  const fields = [
    {
      name: 'basicInfo',
      label: '基本信息',
      type: 'panel',
      fields: [
        {
          name: 'name',
          label: '名称',
          type: 'input',
          required: true,
        },
        {
          name: 'type',
          label: '类型',
          type: 'select',
          options: [
            { label: '类型1', value: 'TYPE1' },
            { label: '类型2', value: 'TYPE2' },
          ],
        }
      ]
    },
    {
      name: 'items',
      label: '项目列表',
      type: 'structureList',
      isShowAdd: true,
      dataList: [],
      required: true,
    }
  ];

  // 定义表单配置
  const config = {
    title: '高级表单示例',
    formName: 'advancedForm',
  };

  // 折叠面板配置
  const collapseFormConfig = {
    isAccordion: true,
    defaultActiveKeys: 'all',
  };

  return (
    <CommonEditor
      formType="advanced"
      fields={fields}
      config={config}
      collapseFormConfig={collapseFormConfig}
      moduleKey="advancedExample"
    />
  );
};

export default AdvancedFormExample;
```

## API说明

### CommonEditor 主组件属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| formType | string | 'basic' | 表单类型，可选值：'basic'(基础表单) 或 'advanced'(高级表单) |
| config | object | {} | 表单全局配置 |
| id | string/number | 来自URL参数 | 编辑项ID，覆盖URL中的ID |
| initialValues | object | {} | 表单初始值 |
| changeHeader | boolean | true | 是否更新头部按钮 |
| setFormRef | function | - | 获取表单引用的函数 |
| renderFormFooter | function | - | 自定义表单底部渲染函数 |
| isDuplicate | boolean | false | 是否为复制模式 |
| isBack | boolean | true | 是否显示返回按钮 |
| collapseFormConfig | object | { isAccordion: true, disableDuplicate: false } | 折叠表单配置 |
| fields | array | [] | 表单字段配置数组 |
| moduleKey | string | - | 模块标识 |
| operationName | string | - | 操作名称 |
| gutter | number | 30 | 字段间距 |
| onSave | function | - | 保存回调函数 |
| validate | function | - | 自定义验证函数 |
| formValidate | function | - | 表单验证函数 |
| initFormData | function | - | 自定义数据获取函数 |
| getDataAfter | function | - | 数据获取后处理函数 |
| saveBeforeTransform | function | - | 保存前数据处理函数 |
| onFormValuesChange | function | - | 表单值变更回调函数 |
| watchFormFieldChange | object/function | - | 监听特定字段变化的回调 |
| fieldsToValidate | array | ['name'] | 需要验证的字段 |
| enableDraft | boolean | false | 是否启用草稿功能 |

### 配置对象（config）属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| title | string | - | 表单标题 |
| formName | string | 'basicForm'/'advancedForm' | 表单名称 |
| layout | string | 'vertical' | 表单布局方式，可选值：'horizontal', 'vertical', 'inline' |
| navigateAfterSave | boolean | false | 保存后是否导航到其他页面 |
| afterSaveUrl | string | -1 | 保存后导航的URL |
| saveSuccessMessage | string | '保存成功!' | 保存成功后显示的消息 |
| onFormChange | function | - | 表单变更时的回调函数 |
| onDataLoaded | function | - | 数据加载完成后的回调函数 |
| oneColumnKeys | array | [] | 需要单列显示的字段名称数组 |

### 字段配置（field）属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| name | string | - | 字段名称（唯一标识） |
| label | string | - | 字段标签 |
| type | string | 'input' | 字段类型，详见下方支持的字段类型列表 |
| required | boolean | false | 是否为必填字段 |
| rules | array | [] | 验证规则数组 |
| placeholder | string | - | 占位文本 |
| disabled | boolean | false | 是否禁用 |
| layoutRegion | string | - | 布局区域，可选值：'left', 'right' |
| fields | array | - | 嵌套字段数组（用于panel类型） |
| options | array | - | 选项数组（用于select, radio类型） |
| props | object | - | 传递给表单控件的属性 |
| render | function | - | 自定义渲染函数 |

### 支持的字段类型

- **input**: 文本输入框
- **textarea**: 多行文本输入框
- **number**: 数字输入框
- **select**: 下拉选择框
- **radio**: 单选框
- **checkbox**: 复选框
- **switch**: 开关
- **date**: 日期选择器
- **dateRange**: 日期范围选择器
- **upload**: 文件上传
- **password**: 密码输入框
- **panel**: 分组面板
- **structureList**: 结构列表（可添加、删除、排序）

## 导出组件

以下组件可通过CommonEditorForm模块导入：

```jsx
import CommonEditor, { BasicForm, AdvancedForm, CollapseForm, CommonList } from '@/components/CommonEditorForm';
```

- **CommonEditor**: 主组件，整合了所有功能
- **BasicForm**: 基础表单组件
- **AdvancedForm**: 高级表单组件
- **CollapseForm**: 折叠面板表单组件
- **CommonList**: 通用列表组件（用于高级表单的左侧列表） 