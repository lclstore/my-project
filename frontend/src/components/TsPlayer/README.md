# TsPlayer 视频播放器组件

一个用于播放TS格式视频的React组件，基于HLS.js库实现，支持多种浏览器环境。

## 功能特性

- 支持播放TS格式的视频文件
- 自动将TS文件转换为M3U8格式进行播放
- 支持视频时长变化的回调处理
- 提供错误处理和加载状态显示
- 支持自定义样式
- 针对不同浏览器环境做了兼容处理

## 使用方式

### 基本使用

```jsx
import TsPlayer from '../components/TsPlayer/TsPlayer';

function VideoPlayer() {
  return (
    <div style={{ width: '600px', height: '400px' }}>
      <TsPlayer url="https://example.com/video.ts" />
    </div>
  );
}
```

### 完整参数使用

```jsx
import TsPlayer from '../components/TsPlayer/TsPlayer';

function VideoPlayer() {
  // 处理视频时长变化
  const handleDurationChange = (e) => {
    console.log('视频时长:', e.target.duration);
  };

  // 处理错误
  const handleError = (errorMsg) => {
    console.error('播放器错误:', errorMsg);
  };

  return (
    <div style={{ width: '600px', height: '400px' }}>
      <TsPlayer 
        url="https://example.com/video.ts"
        onDurationChange={handleDurationChange}
        onError={handleError}
        style={{ borderRadius: '8px' }}
      />
    </div>
  );
}
```

## API

### 属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| url | string | '' | 视频URL地址，支持TS格式 |
| onDurationChange | function | - | 视频时长变化的回调函数 |
| onError | function | - | 错误处理回调函数 |
| style | object | {} | 自定义视频元素样式 |

### 样式类名

组件内部使用了以下CSS类名，可以通过覆盖这些类来自定义样式：

- `.ts-player-container`: 播放器容器
- `.ts-player-video`: 视频元素
- `.ts-player-loading`: 加载状态显示元素
- `.ts-player-error`: 错误信息显示元素

## 实现原理

TsPlayer组件利用HLS.js库来实现对TS视频文件的播放。组件的工作流程如下：

1. 接收一个TS文件URL作为输入
2. 将TS文件转换为M3U8格式（通过生成一个简单的M3U8播放列表）
3. 使用HLS.js库加载并播放M3U8内容
4. 对于Safari等原生支持HLS的浏览器，直接使用浏览器自身的能力播放

组件还实现了以下优化：

- 使用React.memo减少不必要的重渲染
- 适当使用useCallback缓存函数
- 在组件卸载时清理资源（销毁HLS实例和释放blob URL）
- 提供加载和错误状态的视觉反馈

## 内部状态管理

组件内部管理了以下几个关键状态：

- `loading`: 视频加载状态，显示加载提示
- `error`: 错误状态，显示错误信息
- `videoRef`: 视频元素引用
- `hlsRef`: HLS实例引用
- `durationReported`: 时长是否已经报告的标记

## HLS配置参数

HLS.js实例使用了以下配置参数：

```js
{
  maxBufferLength: 30,
  maxMaxBufferLength: 60
}
```

这些参数用于优化视频缓冲性能。

## CSS模块与响应式设计

组件使用CSS模块进行样式隔离，并包含响应式设计：

- 默认视频容器最小高度为200px
- 在小屏幕设备（宽度<=768px）上最小高度调整为150px
- 错误信息在小屏幕上字体大小减小为12px

## 兼容性

- 现代浏览器: Chrome, Firefox, Edge等（通过HLS.js支持）
- Safari: 使用原生HLS播放支持
- 移动端: 支持iOS和Android的主流浏览器

## 错误处理

组件处理了以下几种错误情况：

1. HLS.js加载或解析错误
2. 浏览器不支持HLS格式
3. 播放器创建失败

每种错误都会通过onError回调传递给父组件，并在界面上显示错误信息。

## 注意事项

- 确保提供的URL是有效的TS格式视频文件
- 视频元素默认设置为100%的宽高，确保父容器具有适当的尺寸
- 组件不会自动播放视频，用户需要点击播放按钮来开始播放
- 界面文本（加载提示、错误信息）使用英文显示 