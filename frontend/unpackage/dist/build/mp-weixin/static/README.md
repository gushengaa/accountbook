# 静态资源目录

此目录用于存放静态资源文件。

## 目录结构

```
static/
├── tabbar/          # TabBar 图标
│   ├── home.png
│   ├── home-active.png
│   ├── add.png
│   ├── add-active.png
│   ├── statistics.png
│   ├── statistics-active.png
│   ├── profile.png
│   └── profile-active.png
├── logo.png         # 应用 Logo
└── default-avatar.png # 默认头像
```

## 图标说明

### TabBar 图标
- 尺寸：建议 81x81px
- 格式：PNG，支持透明背景
- 命名：普通状态和激活状态分别命名

### Logo
- 尺寸：建议 512x512px
- 格式：PNG

### 默认头像
- 尺寸：建议 200x200px
- 格式：PNG

## 注意事项

1. 图片文件大小尽量控制在 100KB 以内
2. 使用合适的图片格式（PNG 用于图标，JPG 用于照片）
3. 考虑不同设备的像素密度（@2x, @3x）



