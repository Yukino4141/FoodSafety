package com.itheima.server.controller.admin;

import com.itheima.common.result.Result;
import com.itheima.pojo.dto.ProductDTO;
import com.itheima.pojo.dto.ProductPageQueryDTO;
import com.itheima.pojo.vo.ProductPageItemVO;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.service.ProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/admin/product")
public class AdminProductController {

    @Autowired
    private ProductService productService;

    /**
     * 新增商品
     * 接口信息：
     * - 路径: /admin/product
     * - 方法: POST
     * - 鉴权: 需要管理端Token
     * - 请求头: token: <JWT令牌>
     */
    @PostMapping
    public Result<Void> save(@Valid @RequestBody ProductDTO productDTO) {
        log.info("新增商品，条形码：{}，商品名称：{}",
                productDTO.getBarcode(), productDTO.getName());

        try {
            productService.save(productDTO);
            log.info("商品新增成功，条形码：{}", productDTO.getBarcode());
            return Result.success();
        } catch (RuntimeException e) {
            log.error("商品新增失败，条形码：{}，错误：{}",
                    productDTO.getBarcode(), e.getMessage());
            return Result.error(e.getMessage());
        } catch (Exception e) {
            log.error("商品新增异常，条形码：{}", productDTO.getBarcode(), e);
            return Result.error("系统繁忙，请稍后重试");
        }
    }

    /**
     * 商品分页查询
     */
    @GetMapping("/page")
    public Result<com.itheima.common.result.PageResult<ProductPageItemVO>> page(
            ProductPageQueryDTO productPageQueryDTO) {
        log.info("商品分页查询：page={}, pageSize={}, name={}, barcode={}",
                productPageQueryDTO.getPage(), productPageQueryDTO.getPageSize(),
                productPageQueryDTO.getName(), productPageQueryDTO.getBarcode());

        com.itheima.common.result.PageResult<ProductPageItemVO> result =
                productService.pageQuery(productPageQueryDTO);
        return Result.success(result);
    }

    /**
     * 根据ID查询商品
     */
    @GetMapping("/{id}")
    public Result<ProductVO> getById(@PathVariable Long id) {
        log.info("根据ID查询商品：{}", id);
        ProductVO productVO = productService.getById(id);
        return Result.success(productVO);
    }

    /**
     * 修改商品
     */
    @PutMapping
    public Result<Void> update(@RequestBody ProductDTO productDTO) {
        log.info("修改商品：{}", productDTO);
        productService.update(productDTO);
        return Result.success();
    }

    /**
     * 批量删除商品
     */
    @DeleteMapping
    public Result<Void> delete(@RequestParam String ids) {
        log.info("批量删除商品：{}", ids);

        List<Long> idList = Arrays.stream(ids.split(","))
                .map(Long::parseLong)
                .collect(Collectors.toList());

        productService.deleteByIds(idList);
        return Result.success();
    }

    /**
     * 风险检测测试接口（用于调试）
     */
    @PostMapping("/check-risk")
    public Result<ProductVO> checkRisk(@RequestParam String ingredients) {
        log.info("风险成分检测：{}", ingredients);
        ProductVO productVO = productService.checkRiskForTest(ingredients);
        return Result.success(productVO);
    }
}