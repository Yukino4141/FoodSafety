# Food-Safety（食品安全管理平台）

一个面向普通用户的食品安全与健康分析平台，包含后端服务（Spring Boot）、领域模型、通用库与一个基于微信小程序的前端（foodSafety）。V2.0 版本扩展了社区模块、AI 能力（OCR / 健康分析 / 配料速查）、积分切面与定时任务。

## 主要特性

- 商品、库存、用户与家庭成员管理
- 基于 OCR 的配料识别（图片上传 -> 文字抽取）
- AI 健康分析：根据配料和目标人群返回结构化 JSON（score、riskLevel、riskMsg 等）
- 配料速查：单条配料风险查询 API
- 社区（帖子/评论/审核）与积分自动化（切面）
- 定时任务：保质期扫描、报表生成等
- 微信小程序前端，支持分享、历史记录展示与 AI 分析交互

## 目录概览

- Food-Safety/
  - common/      — 通用模块（常量、异常、工具类、AiProperties、敏感词工具等）
  - pojo/        — DTO/Entity/VO（V2.0 包含社区与 AI 相关 DTO）
  - server/      — Spring Boot 后端（controller、service、mapper、task、config）
  - foodSafety/  — 微信小程序前端代码（JS/HTML/CSS 结构）
  - README.md
  - LICENSE

（详细目录请参考仓库中的模块结构）

## 快速开始

前提条件
- JDK 11+（或 17，根据 pom.xml）
- Maven 3.6+
- MySQL（或其他你配置的数据源）
- 若使用 AI 能力：准备 AI 服务的 API Key / Endpoint（配置在 application.yml 中的 AiProperties）

后端（Server）
1. 克隆仓库：
   git clone https://github.com/Yukino4141/FoodSafety.git

2. 编译构建：
   cd Food-Safety
   mvn -T 1C clean install

3. 运行 server 模块（示例）：
   cd Food-Safety/server
   mvn spring-boot:run
   或者打包后使用 java -jar target/server-*.jar

前端（微信小程序）
1. 使用微信开发者工具打开 foodSafety 目录（或将其导入到你的小程序项目）
2. 在 foodSafety 的配置（如 app.js 或 config 文件）中将 baseURL 指向后端地址（例如 http://localhost:8080）
3. 在小程序开发者工具中编译并预览

数据库与初始化
- 请在 server/src/main/resources 下查看是否包含 SQL 初始化脚本（mapper 或 migration）
- 如使用 Flyway 或 MyBatis 提供的 SQL，请按项目 README 或脚本手动执行初始化表结构与种子数据

## 关键配置（示例）

在 server 模块的 application.yml 中需配置的数据项（示例）：

- 数据源
  spring:
    datasource:
      url: jdbc:mysql://localhost:3306/food_safety?useSSL=false&serverTimezone=UTC
      username: root
      password: your_password

- AiProperties（在 common 或 server 的 properties 下有对应类）
  ai:
    service:
      key: YOUR_AI_API_KEY
      endpoint: https://api.your-ai-provider.com

- 定时任务 cron（如果需要调整 InventoryTask、ReportTask）
  tasks:
    inventory:
      cron: "0 0 2 * * ?"   # 每日凌晨 2 点

请参考项目中的 properties 类（AiProperties 等）以获取完整字段名与类型。

## 常用 API 端点（后端示例）

（基于当前代码：Server 中的 AiController 暴露了以下端点）

- POST /user/ai/ocr
  - 描述：上传配料表图片进行 OCR
  - 参数：multipart file
  - 返回：OcrResultVO（识别文本、配料提取等）

- POST /user/ai/analyze
  - 描述：AI 健康分析
  - 参数：AiAnalyzeDTO（配料列表、目标人群等）
  - 返回：AiAnalyzeVO（score、riskLevel、riskMsg 等结构化数据）

- POST /user/ai/ingredient-check
  - 描述：配料速查（单个配料风险）
  - 参数：IngredientQueryDTO { ingredient }
  - 返回：IngredientRiskVO

其他模块（示例）
- /user/product、/user/inventory、/user/community 等（参见 server/controller 目录下的各个控制器）

## 关于 AI 输出格式（重要）

服务端（AiServiceImpl）强制模型返回严格 JSON，常见返回字段示例：
- score: 整数 0-100（数值越大越安全）
- riskLevel: 0=安全,1=中风险,2=高风险
- riskMsg: 风险说明文本
示例： {"score":80,"riskLevel":0,"riskMsg":"未检测到异常成分"}

此约定便于后端解析并直接转为前端展示数据（ProductVO 中使用了 safetyStatus、riskMsg 等字段供前端渲染）。

## 前端注意点

- 小程序全局配置（foodSafety/app.js）包含 baseURL、风险关键字、状态映射等，请根据部署环境修改 baseURL 与 env。
- 分享相关：部分页面实现了 onShareAppMessage 与 onShareTimeline（例如 ai-analyze、detail），请检查分享信息是否需要本地化或更改文案与图片。
- 前端使用的 product VO 字段：
  - ingredientList（List<String>）用于在页面以标签形式展示配料
  - safetyStatus: "SAFE" / "RISK" 用于渲染颜色/图标

## 开发与贡献

建议流程
1. Fork 并 clone 本仓库
2. 新建分支：feature/xxx 或 fix/xxx
3. 提交并创建 Pull Request，描述改动目的与测试步骤
4. 保持单元测试通过；若修改数据库结构请同步添加迁移脚本

代码规范
- 遵循项目现有命名与风格
- 后端接口说明清晰，Controller 层带有 Swagger 注解（可配置 swagger/openapi）

## 已知/应确认的项（请开发者核对）
- application.yml 中 AiProperties 字段名与实际代码中的属性是否完全一致
- 小程序 baseURL（foodSafety/app.js）是否已替换为真实后端地址
- 是否需要在 README 中附上数据库初始化脚本或样例数据（如果项目没有自动迁移）
- 是否希望添加英文版 README 或更详细的接口文档（可以生成 swagger 文档并链接）

## 版本历史（简要）
- V1.0：基础用户、商品、库存与订单框架
- V1.2：用户画像、家庭成员与库存管理增强
- V2.0：社区模块（帖子/评论/审核）、AI（OCR/健康分析/配料速查）、积分切面、定时任务与报表（当前分支 feature/v2.0-B 基于此）

## 联系与支持

如需协作或有问题，请通过 GitHub Issues 提问，或联系仓库维护者：
- Yukino4141
- Email: 2013174093yukino@gmail.com

## 许可证

本项目采用 MIT 许可证。详见 LICENSE 文件。
