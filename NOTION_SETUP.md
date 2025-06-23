# Notion 集成设置指南

本指南将帮助您将知识库应用与 Notion 数据库集成，实现数据同步。

## 步骤 1: 创建 Notion 集成

1. 访问 [Notion Integrations](https://www.notion.so/my-integrations)
2. 点击 "New integration"
3. 填写集成信息：
   - Name: `Knowledge Base App`
   - Logo: (可选)
   - Associated workspace: 选择您的工作区
4. 点击 "Submit" 创建集成
5. **复制 Internal Integration Token**（以 `secret_` 开头）

## 步骤 2: 创建 Notion 数据库

### 创建问答知识库数据库

1. 在 Notion 中创建一个新页面
2. 添加一个数据库，命名为 "Knowledge Base"
3. 确保数据库包含以下属性：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| Title | 标题 | 问题标题 |
| Content | 长文本 | 问题的详细回答 |
| Category | 选择 | 分类（strategy/product/technology） |
| Tags | 多选 | 标签（可选） |
| Created | 创建时间 | 自动生成 |

4. 创建 Category 选择选项：
   - strategy (战略)
   - product (产品) 
   - technology (技术)

### 创建阅读列表数据库（可选）

1. 创建另一个数据库，命名为 "Reading List"
2. 确保包含以下属性：

| 属性名 | 类型 | 说明 |
|--------|------|------|
| Title | 标题 | 阅读材料标题 |
| Text | 长文本 | 完整的文本内容 |
| Link | URL | 外部链接（可选） |
| Type | 选择 | required/optional |
| Category | 选择 | 分类（strategy/product/technology） |
| Created | 创建时间 | 自动生成 |

## 步骤 3: 共享数据库给集成

1. 在数据库页面，点击右上角的 "Share" 按钮
2. 在弹出窗口中，点击 "Invite"
3. 搜索并选择您创建的集成 "Knowledge Base App"
4. 确保权限设置为 "Can edit"
5. 点击 "Invite"

## 步骤 4: 获取数据库 ID

1. 在浏览器中打开您的 Notion 数据库
2. 复制 URL 中的数据库 ID
   - URL 格式：`https://www.notion.so/xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - 数据库 ID 就是 URL 中最后一段 32 位字符串

## 步骤 5: 配置环境变量

1. 在项目根目录创建 `.env.local` 文件（如果还没有的话）
2. 添加以下环境变量：

```bash
# Notion 配置
NOTION_API_KEY=your_integration_token_here
NOTION_DATABASE_ID=your_database_id_here

# 如果您有单独的阅读列表数据库
NOTION_READING_DATABASE_ID=your_reading_database_id_here
```

3. 将 `your_integration_token_here` 替换为步骤 1 中复制的集成令牌
4. 将 `your_database_id_here` 替换为步骤 4 中获取的数据库 ID

## 步骤 6: 重启应用

配置完成后，重启您的 Next.js 应用：

```bash
npm run dev
```

## 验证集成

如果配置正确，您应该看到：

1. 页面顶部显示绿色提示："已连接到 Notion 数据库"
2. 用户信息显示 "Notion 同步" 标签
3. 在 Notion 中添加的数据会自动显示在应用中
4. 在应用中创建的内容会同步到 Notion

## 故障排除

### 常见问题

1. **"Notion integration not available"**
   - 检查环境变量是否正确设置
   - 确认集成令牌以 `secret_` 开头
   - 确认数据库 ID 是 32 位字符串

2. **"Database not found"**
   - 确认数据库已共享给集成
   - 检查数据库 ID 是否正确

3. **"Permission denied"**
   - 确认集成有 "Can edit" 权限
   - 重新邀请集成到数据库

4. **数据格式问题**
   - 确认数据库属性名称和类型正确
   - 检查 Category 选择选项是否创建

### 调试技巧

1. 查看浏览器控制台的错误信息
2. 检查 Next.js 服务器日志
3. 使用 Notion API 测试工具验证连接

## 数据同步说明

- **从 Notion 到应用**：应用会自动读取 Notion 数据库内容
- **从应用到 Notion**：在应用中创建或编辑的内容会同步到 Notion
- **实时同步**：每次切换标签页或刷新页面时会重新加载数据
- **冲突处理**：应用中的修改会覆盖 Notion 中的内容

## 注意事项

1. 请妥善保管您的 Notion 集成令牌
2. 不要将 `.env.local` 文件提交到版本控制系统
3. 定期备份您的 Notion 数据库
4. 大量数据可能影响加载速度 