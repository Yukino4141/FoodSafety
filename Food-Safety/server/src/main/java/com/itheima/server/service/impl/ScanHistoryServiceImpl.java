package com.itheima.server.service.impl;

import com.itheima.common.context.BaseContext;
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.entity.ScanHistory;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.mapper.ProductMapper;
import com.itheima.server.mapper.ScanHistoryMapper;
import com.itheima.server.service.ScanHistoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 扫描历史服务实现类
 */
@Service
@Slf4j
public class ScanHistoryServiceImpl implements ScanHistoryService {

    @Autowired
    private ScanHistoryMapper scanHistoryMapper;

    @Autowired
    private ProductMapper productMapper;

    /**
     * 记录扫描历史
     * @param productId 商品ID
     */
    @Override
    public void recordScanHistory(Long productId) {
        Long userId = BaseContext.getCurrentId();
        
        ScanHistory scanHistory = ScanHistory.builder()
                .userId(userId)
                .productId(productId)
                .scanTime(LocalDateTime.now())
                .build();

        scanHistoryMapper.insert(scanHistory);
        log.info("记录扫描历史，用户ID: {}, 商品ID: {}", userId, productId);
    }

    /**
     * 查询当前用户的扫描历史
     * @return 商品列表（带历史信息）
     */
    @Override
    public List<ProductVO> getMyHistory() {
        Long userId = BaseContext.getCurrentId();
        log.info("查询扫描历史，用户ID: {}", userId);

        // 1. 查询历史记录
        List<ScanHistory> scanHistories = scanHistoryMapper.listByUserId(userId);

        // 2. 根据商品ID查询商品信息
        List<ProductVO> productVOList = scanHistories.stream()
                .map(scanHistory -> {
                    Product product = productMapper.getById(scanHistory.getProductId());
                    if (product == null) {
                        return null;
                    }
                    return convertToVO(product);
                })
                .filter(vo -> vo != null)
                .collect(Collectors.toList());

        return productVOList;
    }

    /**
     * 清空当前用户的扫描历史
     */
    @Override
    public void clearMyHistory() {
        Long userId = BaseContext.getCurrentId();
        scanHistoryMapper.deleteByUserId(userId);
        log.info("清空扫描历史，用户ID: {}", userId);
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
