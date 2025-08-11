# NumberStepper 数值步进器组件

数值步进器组件用于通过加减按钮调整数值，适用于需要精确调整数值的场景。

## 功能特点

- 支持最小值和最大值限制
- 可自定义步长
- 支持值格式化显示
- 支持与Form组件集成
- 完全可访问性支持
- 自定义样式和按钮属性

 
## 使用方法

### 基本使用

```jsx
import { NumberStepper } from '../components';

const Example = () => {
  const [value, setValue] = useState(0);
  
  return (
    <NumberStepper 
      value={value} 
      onChange={setValue} 
      min={0} 
      max={100} 
      step={5}
    />
  );
};
```

### 带格式化的步进器

```jsx
<NumberStepper 
  value={percent} 
  onChange={setPercent}
  min={0}
  max={100}
  step={10}
  formatter={(value) => `${value}%`}
/>
```

### 在表单中使用

```jsx
import { Form } from 'antd';

<Form.Item 
  name="quantity" 
  label="数量"
  rules={[{ required: true, message: '请输入数量' }]}
>
  <NumberStepper min={1} max={999} />
</Form.Item>
```

### 自定义样式

```jsx
<NumberStepper 
  value={value}
  onChange={setValue}
  className="custom-stepper"
  buttonProps={{ 
    size: "small",
    shape: "circle"
  }}
/>
```

## API

| 参数 | 说明 | 类型 | 默认值 |
| --- | --- | --- | --- |
| value | 当前值 | number | - |
| onChange | 值变化时的回调函数 | function(value, { form, name }) | - |
| min | 最小值 | number | -Infinity |
| max | 最大值 | number | Infinity |
| step | 步长 | number | 1 |
| name | 表单字段名称 | string | - |
| form | 表单实例 | object | - |
| formatter | 格式化函数 | function(value) | (val) => val |
| id | 组件ID，用于表单关联 | string | - |
| className | 自定义类名 | string | '' |
| buttonProps | 按钮的额外属性 | object | {} |

## 可访问性

组件支持完全的键盘导航和屏幕阅读器支持：

- 使用 `role="group"` 标记组件为一个功能组
- 使用 `aria-label` 提供组件功能描述
- 按钮具有合适的 `aria-label` 属性
- 当前值通过 `aria-live="polite"` 实时通知屏幕阅读器

## 注意事项

1. 当 `value` 为 undefined 时，组件会自动将值设置为 `min`
2. 当值达到 `min` 或 `max` 时，对应的减少或增加按钮会被禁用
3. 步进器适合调整精确数值，对于大范围滑动选择，建议使用 Slider 组件 