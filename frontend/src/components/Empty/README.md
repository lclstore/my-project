# Empty 空状态组件

用于展示无数据时的占位内容。

## 参数说明
| 参数   | 说明           | 类型   | 默认值         |
| ------ | -------------- | ------ | -------------- |
| title  | 空状态标题     | string | ''             |
| img    | 自定义图片地址 | string | 默认内置图片   |

## 使用示例
```jsx
import Empty from './index'

// 基本用法
<Empty title="暂无内容" />

// 自定义图片
<Empty title="没有找到相关数据" img="/your/image/path.png" />
``` 