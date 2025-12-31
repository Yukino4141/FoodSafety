package com.itheima.server.controller.user;

import com.itheima.common.result.PageResult;
import com.itheima.common.result.Result;
import com.itheima.pojo.dto.FavoriteDTO;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.service.UserProductService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 用户端-商品控制器
 */
@RestController
@RequestMapping("/user/product")
@Api(tags = "C端-商品接口")
@Slf4j
public class UserProductController {

    @Autowired
    private UserProductService userProductService;

    /**
     * 扫码查询商品详情
     * @param barcode 条形码
     * @return 商品视图对象（含安全状态）
     */
    @GetMapping("/scan/{barcode}")
    @ApiOperation("扫码查询商品详情")
    public Result<ProductVO> scan(@PathVariable String barcode) {
        log.info("扫码查询商品，条形码: {}", barcode);
        
        ProductVO productVO = userProductService.scanByBarcode(barcode);
        
        return Result.success(productVO);
    }

    /**
     * 关键词搜索商品列表（分页）
     * @param name 商品名称关键词
     * @param page 页码，默认1
     * @param pageSize 每页大小，默认10
     * @return 分页结果
     */
    @GetMapping("/list")
    @ApiOperation("关键词搜索商品")
    public Result<PageResult> list(
            @RequestParam String name,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        log.info("搜索商品，关键词: {}, 页码: {}, 每页大小: {}", name, page, pageSize);
        
        PageResult pageResult = userProductService.searchList(name, page, pageSize);
        
        return Result.success(pageResult);
    }

    /**
     * 收藏/取消收藏
     * @param dto 收藏请求
     * @return 当前收藏状态
     */
    @PostMapping("/favorite")
    @ApiOperation("收藏/取消收藏")
    public Result<Boolean> favorite(@RequestBody FavoriteDTO dto) {
        boolean favor = userProductService.toggleFavorite(dto.getProductId());
        return Result.success(favor);
    }
}
