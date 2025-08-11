# FormLabel 表单标签组件

## 组件简介

`FormLabel` 是一个用于表单项的标签组件，支持必填/选填标识、提示信息（含上传文件类型/大小说明）、自定义样式等功能。常用于配合 Ant Design 的表单控件。

## 属性说明

| 属性名         | 类型         | 是否必填 | 默认值    | 说明                                   |
| -------------- | ------------ | -------- | --------- | -------------------------------------- |
| field          | object       | 否       | {}        | 字段配置对象，详见下方说明             |
| className      | string       | 否       | -         | 自定义类名                             |
| labelStyle     | object       | 否       | -         | 自定义标签样式（应用于最外层div）      |
| labelClassName | string       | 否       | -         | 自定义标签类名                         |
| ...props       | any          | 否       | -         | 其他透传到最外层 div 的属性            |

### field 对象常用属性

| 属性名           | 类型     | 是否必填 | 说明                                   |
| ---------------- | -------- | -------- | -------------------------------------- |
| label            | string   | 是       | 标签文本                               |
| required         | boolean  | 否       | 是否必填                               |
| optionalTip      | string   | 否       | 选填提示文本，默认"(Optional)"         |
| tooltip          | string   | 否       | 鼠标悬浮提示内容                       |
| tooltipPlacement | string   | 否       | 提示气泡位置，默认"right"              |
| trigger          | string   | 否       | 提示触发方式，默认"hover"              |
| type             | string   | 否       | 字段类型，若为"upload"会显示上传说明   |
| acceptedFileTypes| string   | 否       | 上传类型（如"jpg,png"）                |
| maxFileSize      | number   | 否       | 上传文件最大体积（单位：KB）           |

## 使用示例

```jsx
import FormLabel from './FormLabel';

<FormLabel
  field={{
    label: 'Avatar',
    required: true,
    type: 'upload',
    acceptedFileTypes: 'jpg,png',
    maxFileSize: 2048,
  }}
  labelStyle={{ color: 'red', fontWeight: 'bold' }} // 自定义标签样式
/>
```

## 组件特性

- 若无 `field.label`，组件将不渲染
- 若 `type` 为 `upload`，会自动根据 `acceptedFileTypes` 和 `maxFileSize` 生成上传说明
- 若 `field.required` 为 `false`，会显示"(Optional)"或自定义 `optionalTip`
- 组件支持完整的属性类型校验（PropTypes）
- 文件大小自动转换为合适的单位（KB/MB/GB）

## 注意事项

- `labelStyle` 用于自定义最外层div的样式，避免与外部style冲突
- `labelClassName` 用于自定义最外层div的类名，避免与外部className冲突
- 其他属性会透传到最外层 div，可用于自定义样式或事件
- 组件已内置了常用的默认值，如提示文本、触发方式等 