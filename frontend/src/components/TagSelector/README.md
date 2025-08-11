# TagSelector 标签选择器

TagSelector 是一个自定义标签选择器组件，提供类似 Tag 的视觉选项，可以替代 Ant Design 的 Select 组件。支持单选和多选模式，并且可以在 Form.Item 中作为表单控件使用。

## 功能特性

- 支持单选和多选模式
- 自定义背景色
- 可在 Form.Item 中使用
- 支持禁用状态

## 基本用法

```jsx
import { Form } from 'antd';
import TagSelector from '@/components/TagSelector';

// 单选模式示例
const SingleModeExample = () => {
  const options = [
    { value: 'option1', label: 'option1' },
    { value: 'option2', label: 'option2' },
    { value: 'option3', label: ' option3' }
  ];

  return (
    <Form>
      <Form.Item name="singleSelect" label="Single Select">
        <TagSelector 
          options={options} 
          mode="single" 
        />
      </Form.Item>
    </Form>
  );
};

// 多选模式示例
const MultiModeExample = () => {
  const options = [
    { value: 'option1', label: 'option1' },
    { value: 'option2', label: 'option2' },
    { value: 'option3', label: 'option3' }
  ];

  return (
    <Form>
      <Form.Item name="multiSelect" label="Multiple Select">
        <TagSelector 
          options={options} 
          mode="multiple" 
        />
      </Form.Item>
    </Form>
  );
};
```

## API

### TagSelector Props

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| options | 选项列表，可以是简单数组或对象数组 | array | `[]` |
| value | 组件的值 | string \| number \| array | - |
| defaultValue | 默认值 | string \| number \| array | - |
| onChange | 值变化时的回调函数 | function(value) | - |
| mode | 设置选择模式 | `'single'` \| `'multiple'` | `'single'` |
| disabled | 是否禁用 | boolean | `false` |
| backgroundColor | 选项背景色 | string | - |
| form | Form 实例，用于表单验证 | FormInstance | - |
| fieldConfig | 字段配置对象，用于表单验证 | object | `{}` |

### options 数组项属性

options 数组可以是简单的字符串/数字数组，也可以是对象数组。对象数组时支持以下属性：

| 参数 | 说明 | 类型 | 是否必须 |
| --- | --- | --- | --- |
| value | 选项值 | string \| number | 是 |
| label | 选项显示文本 | string | 否 |
| name | 如果没有 label，则使用 name 作为显示文本 | string | 否 |

## 注意事项

组件已针对表单验证进行优化，可以配合 Form.Item 的 rules 属性使用 