package com.itheima.server.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.ProductPageQueryDTO;
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.mapper.ProductMapper;
import com.itheima.server.service.ScanHistoryService;
import com.itheima.server.service.UserProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 用户端商品服务实现类
 */
@Service
@Slf4j
public class UserProductServiceImpl implements UserProductService {

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private ScanHistoryService scanHistoryService;

    /**
     * 扫码查询商品详情
     * @param barcode 条形码
     * @return 商品视图对象（含安全状态）
     */
    @Override
    public ProductVO scanByBarcode(String barcode) {
        log.info("用户扫码查询，条形码: {}", barcode);

        // 1. 根据条形码查询商品
        Product product = productMapper.getByBarcode(barcode);

        // 2. 如果商品不存在，抛出异常
        if (product == null) {
            log.warn("商品未收录，条形码: {}", barcode);
            throw new RuntimeException("该商品未收录，敬请期待！");
        }

        // 3. 转换为 VO 对象
        ProductVO productVO = convertToVO(product);

        // 4. 异步记录扫描历史
        try {
            scanHistoryService.recordScanHistory(product.getId());
        } catch (Exception e) {
            log.error("记录扫描历史失败", e);
            // 不影响主流程，继续返回
        }

        return productVO;
    }



    /**
     * 关键词搜索商品列表（分页）
     * @param name 商品名称关键词
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    @Override
    public PageResult searchList(String name, Integer page, Integer pageSize) {
        log.info("用户搜索商品，关键词: {}, 页码: {}, 每页大小: {}", name, page, pageSize);

        // 1. 使用PageHelper进行分页
        PageHelper.startPage(page, pageSize);
        
        // 2. 根据名称模糊查询
        Page<Product> productPage = (Page<Product>) productMapper.listByName(name);

        // 3. 转换为 VO 列表
        List<ProductVO> productVOList = productPage.getResult().stream()
                .map(this::convertToVO)
                .collect(Collectors.toList());

        return new PageResult(productPage.getTotal(), productVOList);
    }

    /**
     * 将 Product 实体转换为 ProductVO
     * @param product 商品实体
     * @return 商品视图对象
     */
    private ProductVO convertToVO(Product product) {
        ProductVO productVO = new ProductVO();
        BeanUtils.copyProperties(product, productVO);

        // 1. 将配料字符串转为列表
        String jsonIngredients = product.getJsonIngredients();
        if (jsonIngredients != null && !jsonIngredients.isEmpty()) {
            List<String> ingredientList = Arrays.asList(jsonIngredients.split(","));
            productVO.setIngredientList(ingredientList);
        }

        // 2. 根据风险等级设置安全状态
        Integer riskLevel = product.getRiskLevel();
        if (riskLevel != null) {
            if (riskLevel == 0) {
                productVO.setSafetyStatus("SAFE");
            } else if (riskLevel == 1) {
                productVO.setSafetyStatus("RISK");
            } else {
                productVO.setSafetyStatus("DANGER");
            }
        }

        return productVO;
    }
}
