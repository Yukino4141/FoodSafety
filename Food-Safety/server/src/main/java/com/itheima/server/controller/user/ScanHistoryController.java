package com.itheima.server.controller.user;

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
     * 查询我的扫描历史
     * @return 商品列表
     */
    @GetMapping("/list")
    @ApiOperation("查询我的扫描历史")
    public Result<List<ProductVO>> list() {
        log.info("查询扫描历史");
        
        List<ProductVO> productVOList = scanHistoryService.getMyHistory();
        
        return Result.success(productVOList);
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
