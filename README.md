Food-Safety
├── common                                      // [通用模块]
│   ├── src/main/java/com/itheima/common/
│   │   ├── constant/                           // 常量 (新增 CommunityConstant, PointConstant)
│   │   ├── context/                            // 上下文 (BaseContext)
│   │   ├── enumeration/                        // 枚举 (新增 TaskType, HealthTag)
│   │   ├── exception/                          // 自定义异常
│   │   ├── properties/                         // 配置属性 (新增 AiProperties)
│   │   ├── result/                             // 统一返回
│   │   └── utils/                              // 工具类 (新增 AiUtil, SensitiveWordUtil)
│   └── pom.xml
│
├── pojo                                        // [数据模型模块]
│   ├── src/main/java/com/itheima/pojo/
│   │   ├── dto/                                // 数据传输对象
│   │   │   ├── community/                      // [V2.0新增] 社区相关 (PostDTO, CommentDTO)
│   │   │   ├── user/                           // 用户相关 (ProfileDTO, FamilyMemberDTO)
│   │   │   ├── product/                        // 商品相关 (InventoryDTO)
│   │   │   └── ai/                             // [V2.0新增] AI分析相关 (OcrDTO)
│   │   ├── entity/                             // 数据库实体
│   │   │   ├── CommunityPost.java              // [V2.0] 帖子表
│   │   │   ├── PostComment.java                // [V2.0] 评论表
│   │   │   ├── UserPoints.java                 // [V2.0] 积分表
│   │   │   ├── UserProfile.java                // [V1.2] 用户画像表
│   │   │   ├── FamilyMember.java               // [V1.2] 家庭成员表
│   │   │   ├── ProductInventory.java           // [V1.2] 库存表
│   │   │   └── ... (原有的 User, Product)
│   │   └── vo/                                 // 视图对象
│   │       ├── community/                      // (PostVO, CommentVO)
│   │       ├── ai/                             // (AiAnalysisVO)
│   │       └── ...
│   └── pom.xml
│
└── server                                      // [核心服务模块]
    ├── src/main/java/com/itheima/server/
    │   ├── aspect/                             // [V2.0新增] 切面层
    │   │   └── PointsAspect.java               // 积分切面 (发帖/扫码后自动加分)
    │   │
    │   ├── config/                             // 配置类
    │   │   ├── WebMvcConfiguration.java
    │   │   └── AiConfiguration.java            // [V2.0新增] AI模型配置
    │   │
    │   ├── controller/                         // 控制层 (按业务拆分)
    │   │   ├── admin/                          // 管理端接口
    │   │   │   ├── AdminProductController.java
    │   │   │   └── AdminPostController.java    // [V2.0] 社区内容审核
    │   │   └── app/                            // C端用户接口 (原 user 包重命名为 app 更贴切)
    │   │       ├── ai/                         // [V2.0] AI模块
    │   │       │   ├── OcrController.java      // OCR识别
    │   │       │   └── AiAnalyzeController.java// 健康分析
    │   │       ├── community/                  // [V2.0] 社区模块
    │   │       │   ├── PostController.java
    │   │       │   └── CommentController.java
    │   │       ├── member/                     // [V1.2] 成员与画像模块
    │   │       │   ├── ProfileController.java
    │   │       │   └── FamilyController.java
    │   │       ├── product/                    // 商品与库存模块
    │   │       │   ├── ProductController.java  // 扫码、搜索
    │   │       │   └── InventoryController.java// [V1.2] 库存管理
    │   │       └── user/                       // 基础用户模块
    │   │           └── UserController.java     // 登录、积分查询
    │   │
    │   ├── handler/                            // 全局处理器
    │   │
    │   ├── interceptor/                        // 拦截器
    │   │
    │   ├── mapper/                             // 持久层
    │   │   ├── CommunityPostMapper.java
    │   │   ├── UserPointsMapper.java
    │   │   └── ...
    │   │
    │   ├── service/                            // 业务层接口
    │   │   ├── AiService.java
    │   │   ├── CommunityService.java
    │   │   ├── PointsService.java
    │   │   └── ...
    │   │
    │   ├── service/impl/                       // 业务层实现
    │   │   ├── AiServiceImpl.java              // 对接百度/阿里大模型
    │   │   ├── CommunityServiceImpl.java
    │   │   ├── PointsServiceImpl.java
    │   │   └── ...
    │   │
    │   └── task/                               // [V2.0新增] 定时任务
    │       ├── InventoryTask.java              // 保质期临期扫描
    │       └── ReportTask.java                 // 周/月报生成
    │
    └── src/main/resources/
        ├── mapper/                             // MyBatis XML
        │   ├── CommunityPostMapper.xml
        │   └── ...
        └── application.yml
