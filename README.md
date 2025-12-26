[README.md](https://github.com/user-attachments/files/24344200/README.md)
# Food-Safety（食品安全管理平台）


一个面向社区和家庭用户的食品安全与健康管理平台，包含商品/库存管理、社区互动、积分体系以及 AI 助力的 OCR 与健康分析功能。项目分为三个主要模块：common（通用库）、pojo（数据模型）、server（服务端）。适合学习微服务分层、MyBatis 持久化、以及结合 AI 服务的典型企业级 Java 项目结构。

---

## 主要特性

- 商品与库存管理：扫码、库存增减、临期监控
- 社区模块（V2.0）：帖子、评论、内容审核、积分奖励
- 积分体系：贴子发布、扫码等行为触发积分（切面实现）
- AI 能力（V2.0）：OCR 识别、健康分析（对食物/成分做检测与提示）
- 定时任务：保质期扫描、报告生成（周/月表）
- 统一异常 / 返回结构与通用工具类支持

---

## 项目结构（概要）

项目采用典型的模块化多子工程结构，便于拆分与复用：

Food-Safety
├── common                                      // 通用模块（工具、常量、枚举、属性、异常、统一返回）  
├── pojo                                        // 数据模型（DTO、Entity、VO）  
└── server                                      // 核心服务（控制器、服务、Mapper、配置、任务）

详细目录（高亮新增/版本信息）：

```text
Food-Safety
├── common
│   ├── src/main/java/com/itheima/common/
│   │   ├── constant/           // 常量 (新增 CommunityConstant, PointConstant)
│   │   ├── context/            // 上下文 (BaseContext)
│   │   ├── enumeration/        // 枚举 (新增 TaskType, HealthTag)
│   │   ├── exception/          // 自定义异常
│   │   ├── properties/         // 配置属性 (新增 AiProperties)
│   │   ├── result/             // 统一返回
│   │   └── utils/              // 工具类 (新增 AiUtil, SensitiveWordUtil)
│   └── pom.xml
│
├── pojo
│   ├── src/main/java/com/itheima/pojo/
│   │   ├── dto/
│   │   │   ├── community/      // [V2.0新增] PostDTO, CommentDTO
│   │   │   ├── user/           // ProfileDTO, FamilyMemberDTO
│   │   │   ├── product/        // InventoryDTO
│   │   │   └── ai/             // [V2.0新增] OcrDTO
│   │   ├── entity/
│   │   │   ├── CommunityPost.java
│   │   │   ├── PostComment.java
│   │   │   ├── UserPoints.java
│   │   │   ├── UserProfile.java
│   │   │   ├── FamilyMember.java
│   │   │   ├── ProductInventory.java
│   │   │   └── ... (User, Product 等)
│   │   └── vo/
│   │       ├── community/      // PostVO, CommentVO
│   │       ├── ai/             // AiAnalysisVO
│   │       └── ...
│   └── pom.xml
│
└── server
    ├── src/main/java/com/itheima/server/
    │   ├── aspect/             // [V2.0新增] PointsAspect.java
    │   ├── config/             // WebMvcConfiguration, AiConfiguration
    │   ├── controller/
    │   │   ├── admin/          // 管理端：AdminProductController, AdminPostController（社区审核）
    │   │   └── app/
    │   │       ├── ai/         // OcrController, AiAnalyzeController
    │   │       ├── community/  // PostController, CommentController
    │   │       ├── member/     // ProfileController, FamilyController
    │   │       ├── product/    // ProductController, InventoryController
    │   │       └── user/       // UserController（登录、积分）
    │   ├── mapper/             // CommunityPostMapper, UserPointsMapper...
    │   ├── service/            // AiService, CommunityService, PointsService...
    │   ├── service/impl/       // AiServiceImpl（对接大模型）、CommunityServiceImpl...
    │   └── task/               // InventoryTask（保质期扫描）、ReportTask（报表）
    └── src/main/resources/
        ├── mapper/
        └── application.yml
```

---

## 模块说明

- common：项目的基础库，放置常量、通用返回对象、全局异常、工具类（含 AI/敏感词支持）以及公共配置属性。
- pojo：领域模型层，包含 DTO/Entity/VO。V2.0 扩展了社区与 AI 相关的数据传输对象。
- server：后端服务实现，包含控制器、service、mapper、切面、定时任务与配置类。MyBatis 用于持久化，切面用于积分自动化。

---

## 关键功能示例（简要）

- 发帖或扫码后自动增加积分：通过 PointsAspect 切面拦截相应方法，调用 PointsService 增加积分并记录 UserPoints。
- OCR 识别与健康分析：AiService 对接百度/阿里/自有模型，OcrController 提供图片上传并返回识别结果，AiAnalyzeController 提供基于识别结果的健康提示与标签（HealthTag）。
- 保质期扫描任务：InventoryTask 定时扫描 ProductInventory，发现临期或过期商品触发报警/汇总报表。

---

## 快速开始

前提条件：

- JDK 11+ 或 17（根据 pom 配置）
- Maven 3.6+
- 配置好数据库（MySQL）与 application.yml 中的连接信息
- 若使用 AI 能力，请在配置文件中填写相应的大模型/服务密钥（AiProperties）

构建与运行（示例）：

1. 克隆仓库
   git clone https://github.com/Yukino4141/FoodSafety.git

2. 进入模块并编译
   cd FoodSafety
   mvn -T 1C clean install

3. 启动 server 模块
   cd server
   mvn spring-boot:run

4. 常见数据库初始化
   - 在 resources/mapper 或项目根目录查找初始化脚本（如果提供）
   - 或手动运行项目提供的 Flyway / MyBatis SQL 文件

注：如果需要本地调试 AI 接口，请先将 AiProperties 的密钥及 endpoint 填入 application.yml。

---

## 配置项（重要）

- application.yml（server 模块）：
  - 数据源（spring.datasource.*）
  - MyBatis mapper 路径
  - AiProperties：ai.service.key、ai.endpoint（用于 OCR/分析）
  - 任务调度 cron（InventoryTask、ReportTask）

（具体字段请参考 code 中的 properties 类和示例配置）

---

## 贡献指南

欢迎贡献！建议流程：

1. Fork 本仓库
2. 新建分支：feature/描述 或 fix/描述
3. 提交代码并创建 Pull Request，描述改动目的与测试步骤
4. 保持单元测试通过，若修改数据库结构请同步更新迁移脚本

代码风格：遵循项目现有风格与命名约定，方法/类注释清晰。

---

## 版本与里程碑

- V1.0：基础用户、商品、库存与订单框架
- V1.2：用户画像、家庭成员与库存管理增强
- V2.0：社区模块（帖子/评论/审核）、AI（OCR/健康分析）、积分切面、定时任务与报表

---

## 联系与支持

如需进一步协作或有问题，请通过 GitHub Issues 提问，或联系仓库维护者（Yukino4141 邮箱：2013174093yukino@gmail.com）。

---

## License

本项目采用 MIT 许可证。欲了解详情，请查看 LICENSE 文件。
