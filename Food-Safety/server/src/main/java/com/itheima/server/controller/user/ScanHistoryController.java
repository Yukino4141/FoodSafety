package com.itheima.server.controller.user;

import com.itheima.common.result.PageResult;
import com.itheima.common.result.Result;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.service.ScanHistoryService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户端-扫描历史控制器
 */
@RestController
@RequestMapping("/user/history")
@Api(tags = "C端-扫描历史接口")
@Slf4j
public class ScanHistoryController {

    @Autowired
    private ScanHistoryService scanHistoryService;

    /**
     * 查询我的扫描历史（分页）
     * @param page 页码，默认1
     * @param pageSize 每页大小，默认10
     * @return 分页结果
     */
    @GetMapping("/list")
    @ApiOperation("查询我的扫描历史")
    public Result<PageResult> list(
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        log.info("查询扫描历史，页码: {}, 每页大小: {}", page, pageSize);
        
        PageResult pageResult = scanHistoryService.getMyHistory(page, pageSize);
        
        return Result.success(pageResult);
    }

    /**
     * 清空我的扫描历史
     * @return 成功标识
     */
    @DeleteMapping("/clear")
    @ApiOperation("清空我的扫描历史")
    public Result<String> clear() {
        log.info("清空扫描历史");
        
        scanHistoryService.clearMyHistory();
        
        return Result.success("清空成功");
    }
}
