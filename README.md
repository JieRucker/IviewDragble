## 当前版本：v1.0.0

## 容器
```bush
  <div id="viewElement" style="width: 600px;height: 450px;"></div>
```

## 使用方法

```bush
// 恢复图片状态视点
jImageDrag = new JImageDrag({
    viewElement: '#viewElement', //主容器节点
    dragElement: '#viewPic', //图片节点
    isCallView: true, //恢复视点
    recoverView: initObj, //视点参数
    width: document.body.clientWidth - 80, //容器宽
    height: 450, //容器高
    isGlobal: true,
    zoom_delta: 1.03, // 缩放值
    zoom_max: GLOBAL_ZOOM_MAX, // 最大缩放值
    globalElement: '#viewElement',
});

// 比较两张图片
comparePicDragbleFirst = new JImageDrag({
    viewElement: '#imageView0',
    dragElement: '#pic0',
    isGlobal: true,
    zoom_delta: Base.isPc() ? 1.1 : 1.03,
    globalElement: '#compareElement',
    width: document.body.clientWidth / 2 - 20,
    height: document.body.clientHeight - 264,
    zoom_max: GLOBAL_ZOOM_MAX
});

comparePicDragbleSecond = new JImageDrag({
    viewElement: '#imageView1',
    dragElement: '#pic1',
    isGlobal: true,
    zoom_delta: Base.isPc() ? 1.1 : 1.03,
    globalElement: '#compareElement',
    width: document.body.clientWidth / 2 - 20,
    height: document.body.clientHeight - 264,
    zoom_max: GLOBAL_ZOOM_MAX,
});

// 普通显示
jImageDrag = new JImageDrag({
    viewElement: '#viewElement', //主容器节点
    dragElement: '#viewPic', //图片节点
    width: document.body.clientWidth - 80, //容器宽
    height: 450, //容器高
    isGlobal: true, // 全局拖拽开关
    zoom_delta: 1.03, // 缩放值
    zoom_max: GLOBAL_ZOOM_MAX, // 最大缩放值
    globalElement: '#viewElement' // 拖拽域
});
```

## 功能

支持图片拖拽、恢复状态视点、等比例缩放
