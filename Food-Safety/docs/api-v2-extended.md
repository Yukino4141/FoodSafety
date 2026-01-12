# 食安卫士 V2.0 API（补全与设计稿）

> 标记说明：
> - [done] 已在当前后端实现（括号给出关键代码文件）。
> - [todo] 尚未实现，已给出接口设计与业务要点。
> - [plan] 建议增加的接口或逻辑。
>
> 统一响应：`{ code: 1|0, msg: string, data: any }`；鉴权：管理端请求头 `token`，C 端请求头 `authentication`（登录/注册除外）。时间格式：`yyyy-MM-dd HH:mm:ss`（日期 `yyyy-MM-dd`）。分页：`page`（默认1）、`pageSize`（默认10）。

## 1. 全局与数据字典
- 传输协议：HTTP/HTTPS，JSON；上传使用 `multipart/form-data`。
- 关键枚举：
  - RiskLevel: 0 安全 / 1 中风险 / 2 高风险。
  - SafetyStatus: SAFE / RISK / DANGER（后端按 riskLevel 转换）。
  - InventoryStatus: 1 正常 / 2 临期 / 3 已过期 / 4 已消耗。
  - TaskType: SCAN(+10)、POST(+50)、SHARE(+20)；按日限流由积分服务控制（现实现为简单累加）。
- 错误码建议：
  - 40401 商品未收录（扫码时返回，提示可 AI 识别）。
  - 400xx 参数校验，401 未登录/Token 失效，403 无权限，500xx 系统异常。

## 2. C 端（/user/**）
### 2.1 用户/画像/家庭
- [done] POST /user/user/login — 微信登录，入参 `{code}`；返 `{id, openid, token}`（UserController）。
- [done] GET /user/profile — 获取画像（ProfileController）。
- [done] POST /user/profile — Upsert 画像，入参 `allergens[], dietType, healthTags[]`，返最新画像。
- [done] POST /user/family — 新增家庭成员，入参 `{name, age, healthTags[]}`（FamilyMemberController）。
- [done] GET /user/family/list — 查询成员列表；用于切换视角（FamilyMemberController.list）。
- [done] PUT /user/family/{id} — 更新昵称/年龄/健康标签（FamilyMemberController.update）。
- [done] DELETE /user/family/{id} — 删除成员（FamilyMemberController.delete）。
- [plan] PATCH /user/family/{id}/activate — 设置当前使用的成员画像，后续扫码/AI 分析按该画像计算。

### 2.2 商品
- [done] GET /user/product/scan/{barcode} — 扫码详情，含个性化风险、收藏状态、积分加成与扫描记录（UserProductController.scan）。
- [done] GET /user/product/list — 名称模糊分页搜索（UserProductController.list）。
- [done] POST /user/product/favorite — 收藏/取消收藏，入参 `{productId}`，返 true/false（UserProductController.favorite）。
- [done] GET /user/product/favorite/list — 我的收藏分页列表，按 createTime 倒序（UserProductController.favoriteList）。
- [plan] GET /user/product/{id} — 商品详情（按 ID）；复用 scan 转换逻辑，无积分与历史写入。
- [plan] POST /user/product/feedback-missing — 上报未收录商品，入参 `{barcode, name?, images?}`；用于运营补录队列。

### 2.3 扫描历史
- [done] GET /user/history/list — 我的扫码历史分页（ScanHistoryController.list）。
- [done] DELETE /user/history/clear — 清空历史（ScanHistoryController.clear）。
- [done] DELETE /user/history/{id} — 删除单条历史（ScanHistoryController.deleteOne）。

### 2.4 库存与保质期
- [done] POST /user/inventory — 加入库存，入参 `{productId, purchaseDate?, expiryDate}`（InventoryController.add）。
- [done] GET /user/inventory/list — 库存分页，可按 status 过滤（InventoryController.list）。
- [done] PUT /user/inventory/{id} — 修改过期日、购买日或状态；更新 remainingDays 和 status（InventoryController.update）。
- [done] PATCH /user/inventory/{id}/consume — 标记已消耗，status=4（InventoryController.consume）。
- [done] DELETE /user/inventory/{id} — 移除记录（InventoryController.delete）。
- [plan] GET /user/inventory/alerts — 仅返回临期/已过期列表；用于消息推送。
- [plan] GET /user/inventory/stats — 统计：总数、临期数、过期数、近7天到期数。

### 2.5 社区互动
- [done] POST /user/community/post — 发布帖子，入参 `{title, content, images[]}`（CommunityController.publish）。
- [done] GET /user/community/feed — 帖子流，`sort=latest|hot`（CommunityController.feed）。
- [done] POST /user/community/like — 点赞/取消点赞 `{postId, isLike}`（CommunityController.like）。
- [done] GET /user/community/{id} — 帖子详情，含点赞数、评论数、是否我点赞（CommunityController.detail）。
- [done] GET /user/community/my-posts — 我的帖子分页（CommunityController.myPosts）。
- [done] POST /user/community/comment — 发表评论 `{postId, content}`；返回评论 ID（CommunityController.comment）。
- [done] GET /user/community/comment/list — 评论分页 `{postId, page, pageSize}`（CommunityController.commentList）。
- [plan] POST /user/community/report — 举报帖子/评论 `{targetId, type=POST|COMMENT, reason}`。
- [plan] DELETE /user/community/{id} — 作者删除自己的帖子；软删。

### 2.6 AI 工具
- [done] POST /user/ai/ocr — 上传图片 OCR，form-data `file`，返 `{imageUrl, rawText, ingredients[]}`（AiController.ocr）。
- [done] POST /user/ai/analyze — AI 健康分析，入参 `{ingredients[], targetUser}`，返 `{score, riskLevel, summary, suggestion}`（AiController.analyze）。
- [plan] POST /user/ai/ingredients/normalize — 将用户手输配料标准化/去重，便于后续风险匹配。

## 3. 管理端（/admin/**）
### 3.1 管理员账号
- [done] POST /admin/employee/login — 管理员登录，返 `{id, userName, name, token}`（AdminEmployeeController.login）。
- [done] POST /admin/employee/logout — 登出（前端清 Token）。
- [plan] GET /admin/employee/profile — 查询当前管理员信息。

### 3.2 商品录入与维护
- [done] POST /admin/product — 新增商品，触发 AI 风险检测（AdminProductController.save）。
- [done] PUT /admin/product — 修改商品，若配料变更则重测风险（AdminProductController.update）。
- [done] DELETE /admin/product?ids=1,2 — 批量删除（AdminProductController.delete）。
- [done] GET /admin/product/page — 条件分页查询（AdminProductController.page）。
- [done] POST /admin/product/check-risk — 输入配料字符串返回风险评估（测试用）。
- [todo] GET /admin/product/{id} — 单条详情（含配料、OCR 原文、创建人）。
- [plan] POST /admin/product/import — 批量导入（支持 Excel/CSV）；失败行返回。
- [plan] GET /admin/product/export — 导出当前查询结果。
- [plan] POST /admin/product/{id}/rerun-risk — 重新跑 AI 风险并落库。

### 3.3 社区审核
- [todo] GET /admin/community/pending — 待审核帖子列表；支持 `page,pageSize,keyword`。
- [todo] POST /admin/community/{id}/approve — 审核通过；可写审核人、时间。
- [todo] POST /admin/community/{id}/reject — 审核拒绝，入参 `{reason}`；可通知作者。
- [plan] DELETE /admin/community/{id} — 运营删除违规内容。

### 3.4 用户与积分（建议）
- [plan] GET /admin/user/page — 用户分页，含近7日扫码/发帖数。
- [plan] GET /admin/user/{id}/points — 用户积分流水分页；过滤 `taskType`、时间。
- [plan] POST /admin/user/{id}/ban — 封禁/解封。

### 3.5 文件上传
- [done] POST /admin/common/upload — OSS 上传，限制 jpg/png/jpeg, <=5MB（CommonController.upload）。

### 3.6 仪表盘
- [done] GET /admin/dashboard — 返回 `{totalUsers, todayScans, pendingPosts}`（AdminDashboardController.dashboard）。
- [plan] 扩展指标：今日新增用户、今日发帖、近7日趋势、库存临期 Top10。

## 4. 业务与积分补充
- 扫码：+10 分；每天限 N 次（当前代码未限流，需在积分服务或切面完成去重/计数）。
- 发帖：+50 分；社区审核后再记分更合理。
- 收藏、点赞：不计分，仅更新计数。
- 建议新增 Redis/DB 防重表：`user_points_daily(taskType,date)`，超过阈值不再累加。

## 5. 开发落地建议（按优先级）
1) 家庭成员列表/编辑/删除/切换
- Mapper: 扩充 `FamilyMemberMapper` (update, delete, getById, listByUserId with status)。
- Service/Controller: 新增 GET/PUT/DELETE、activate 接口；保存 "currentMemberId" 到用户表或上下文。

2) 收藏列表与商品详情
- 新增 `ProductFavoriteMapper.listByUserId`；Controller 增加 `/favorite/list`；返回分页 ProductVO。(已完成收藏列表)
- 商品详情 `/user/product/{id}` 复用 `convertToVO`，不写历史/积分。

3) 库存管理完善
- Mapper: `update`, `delete`, `updateStatus` 已有，补充按 id 更新/删除。(已完成更新/删除/消耗)
- Controller: PUT `/user/inventory/{id}`，PATCH `/consume`，DELETE `/user/inventory/{id}`，GET `/alerts`。(已完成前三项)

4) 社区评论/详情/我的帖子
- 新建 Comment 表/Mapper/DTO/VO；Controller 增加 comment 接口；帖子的详情查询带评论总数和是否点赞。(已完成)

5) 管理端社区审核与用户积分查询
- 新建审核状态字段 `community_post.status(pending/approved/rejected)`；Mapper 支持条件分页；Controller 增加审核接口。
- 积分流水 Mapper + 查询接口，供运营查看。

6) 数据校验与限流
- 为发帖/评论/扫码接口增加简单防刷：同用户 3 秒内重复提交拒绝；或接入 Redis 计数。

7) 文档与前后端对齐
- 前端常量与枚举保持与本稿一致；headers 统一：C 端 `authentication`，管理端 `token`。

---

## 6. 新增/完善接口详细规范（已实现）

### 6.1 家庭成员
- 接口：GET /user/family/list（JSON，鉴权）
  - 响应：`{code,msg,data:[{id,name,age,healthTags,createTime,updateTime}]}`
- 接口：PUT /user/family/{id}（JSON，鉴权）
  - 入参：`{name, age, healthTags[]}`，仅允许本人资源。
  - 响应：`{code:1,msg:"success",data:null}`
- 接口：DELETE /user/family/{id}（鉴权）
  - 响应：`{code:1,msg:"success",data:null}`

### 6.2 收藏列表
- 接口：GET /user/product/favorite/list?page=1&pageSize=10（鉴权）
  - 说明：按收藏时间倒序；内部基于 product_favorite -> product 组装 ProductVO 并应用个人过敏原判定。
  - 响应：`{code:1,data:{total,records:[ProductVO...]}}`，其中 ProductVO 含 `isFavorite=true`、`safetyStatus` 等。

### 6.3 扫描历史
- 接口：DELETE /user/history/{id}（鉴权）
  - 说明：仅删除当前用户的记录。
  - 响应：`{code:1,msg:"删除成功",data:null}`

### 6.4 库存管理
- 接口：PUT /user/inventory/{id}（JSON，鉴权）
  - 入参：`{purchaseDate, expiryDate, productId?}`（productId 不变更），服务端重算 `status`。
  - 响应：`{code:1,msg:"success"}`
- 接口：PATCH /user/inventory/{id}/consume（鉴权）
  - 作用：标记 status=4 已消耗。
  - 响应：`{code:1,msg:"success"}`
- 接口：DELETE /user/inventory/{id}（鉴权）
  - 响应：`{code:1,msg:"success"}`

### 6.5 社区扩展
- 接口：GET /user/community/{id}（鉴权）
  - 响应：`{code:1,data:PostVO}`，PostVO 增加字段 `commentCount, liked`，`liked` 基于 post_like。
- 接口：GET /user/community/my-posts?page&pageSize（鉴权）
  - 响应：分页 PostVO 列表，含 liked/commentCount。
- 接口：POST /user/community/comment（JSON，鉴权）
  - 入参：`{postId, content}`；状态直接置为通过。
  - 响应：`{code:1,data:<commentId>}`
- 接口：GET /user/community/comment/list?postId&page&pageSize（鉴权）
  - 响应：`{code:1,data:{total,records:[{id,postId,userId,content,createTime}]}}`
- 点赞变更：POST /user/community/like 使用 post_like 表防重；返回 `success`，同时更新社区帖子 likeCount。

如需进一步细化到 SQL/Mapper 层的字段或前端请求示例，可在对应接口下展开。当前实现的关键代码参考：
- 用户登录: server/controller/user/UserController.java
- 商品扫码/收藏: server/controller/user/UserProductController.java
- 库存: server/controller/user/InventoryController.java
- 社区: server/controller/user/CommunityController.java
- AI: server/controller/user/AiController.java
- 管理端商品: server/controller/admin/AdminProductController.java
- 仪表盘: server/controller/admin/AdminDashboardController.java
- 文件上传: server/controller/admin/CommonController.java
