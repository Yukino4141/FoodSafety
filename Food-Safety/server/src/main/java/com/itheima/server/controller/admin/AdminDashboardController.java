package com.itheima.server.controller.admin;

import com.itheima.common.result.Result;
import com.itheima.server.service.PostCommentService;
import com.itheima.server.service.ScanHistoryService;
import com.itheima.server.service.UserService;
import com.itheima.pojo.vo.DashboardVO;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/admin")
@Api(tags = "管理端-仪表盘接口")
@Slf4j
public class AdminDashboardController {

    @Autowired
    private UserService userService;
    
    @Autowired
    private ScanHistoryService scanHistoryService;
    
    @Autowired
    private PostCommentService postCommentService;

    @GetMapping("/dashboard")
    @ApiOperation("仪表盘数据")
    public Result<DashboardVO> dashboard() {
        // 获取真实数据
        Integer totalUsers = userService.getTotalUsers();
        Integer todayScans = scanHistoryService.getTodayScans();
        Integer pendingPosts = postCommentService.getPendingPosts();
        
        DashboardVO vo = new DashboardVO(totalUsers, todayScans, pendingPosts);
        log.info("返回仪表盘数据: {}", vo);
        return Result.success(vo);
    }
}
