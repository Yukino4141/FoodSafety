package com.itheima.server.service.impl;

import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.entity.ScanHistory;
import com.itheima.pojo.vo.ProductVO;
import com.alibaba.fastjson.JSON;
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
     * 查询当前用户的扫描历史（分页）
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    @Override
    public PageResult getMyHistory(Integer page, Integer pageSize) {
        Long userId = BaseContext.getCurrentId();
        log.info("查询扫描历史，用户ID: {}, 页码: {}, 每页大小: {}", userId, page, pageSize);

        // 1. 使用PageHelper进行分页
        PageHelper.startPage(page, pageSize);
        
        // 2. 查询历史记录
        Page<ScanHistory> scanHistoryPage = (Page<ScanHistory>) scanHistoryMapper.listByUserId(userId);

        // 3. 根据商品ID查询商品信息并转换为VO
        List<ProductVO> productVOList = scanHistoryPage.getResult().stream()
                .map(scanHistory -> {
                    Product product = productMapper.getById(scanHistory.getProductId());
                    if (product == null) {
                        return null;
                    }
                    return convertToVO(product);
                })
                .filter(vo -> vo != null)
                .collect(Collectors.toList());

        return new PageResult(scanHistoryPage.getTotal(), productVOList);
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
        List<String> ingredientList = parseIngredientList(jsonIngredients);
        if (ingredientList != null) {
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
    private List<String> parseIngredientList(String raw) {
        if (raw == null || raw.isEmpty()) {
            return null;
        }
        String trimmed = raw.trim();
        try {
            if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
                List<String> arr = JSON.parseArray(trimmed, String.class);
                if (arr != null) {
                    return arr.stream().map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toList());
                }
            }
        } catch (Exception e) {
            log.warn("解析配料 JSON 失败，降级为分隔符拆分: {}", raw);
        }
        return Arrays.stream(trimmed.split(","))
                .map(String::trim)
                .map(s -> s.replaceAll("^\\[?\\\"?", "").replaceAll("\\\"?\\]?$", ""))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

    }

    /**
     * 获取今日扫码数
     * @return 今日扫码数
     */
    @Override
    public Integer getTodayScans() {
        return scanHistoryMapper.getTodayScans();
    }
}
