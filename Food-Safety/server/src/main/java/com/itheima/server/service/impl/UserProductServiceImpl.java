package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.entity.ProductFavorite;
import com.itheima.pojo.entity.UserProfile;
import com.itheima.pojo.entity.UserPoints;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.mapper.ProductFavoriteMapper;
import com.itheima.server.mapper.ProductMapper;
import com.itheima.server.mapper.UserPointsMapper;
import com.itheima.server.mapper.UserProfileMapper;
import com.itheima.server.service.ScanHistoryService;
import com.itheima.server.service.UserProductService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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

    @Autowired
    private UserProfileMapper userProfileMapper;

    @Autowired
    private ProductFavoriteMapper productFavoriteMapper;

    @Autowired
    private UserPointsMapper userPointsMapper;

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

        // 3.1 个性化风险判断
        applyPersonalRisk(productVO, product);

        // 3.2 收藏状态
        productVO.setIsFavorite(isFavorite(product.getId()));

        // 4. 异步记录扫描历史
        try {
            scanHistoryService.recordScanHistory(product.getId());
        } catch (Exception e) {
            log.error("记录扫描历史失败", e);
            // 不影响主流程，继续返回
        }

        // 5. 积分奖励（简单累加）
        try {
            Long userId = BaseContext.getCurrentId();
            UserPoints points = UserPoints.builder()
                    .userId(userId)
                    .points(10)
                    .taskType("SCAN")
                    .remark("扫码积分")
                    .createTime(LocalDateTime.now())
                    .build();
            userPointsMapper.insert(points);
        } catch (Exception e) {
            log.warn("积分记录失败", e);
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

    @Override
    public boolean toggleFavorite(Long productId) {
        Long userId = BaseContext.getCurrentId();
        ProductFavorite existing = productFavoriteMapper.getByUserAndProduct(userId, productId);
        if (existing == null) {
            ProductFavorite favorite = ProductFavorite.builder()
                    .userId(userId)
                    .productId(productId)
                    .createTime(LocalDateTime.now())
                    .build();
            productFavoriteMapper.insert(favorite);
            return true;
        } else {
            productFavoriteMapper.delete(existing.getId());
            return false;
        }
    }

    @Override
    public PageResult favoriteList(Integer page, Integer pageSize) {
        Long userId = BaseContext.getCurrentId();
        PageHelper.startPage(page, pageSize);
        Page<ProductFavorite> favPage = (Page<ProductFavorite>) productFavoriteMapper.listByUserId(userId);
        List<ProductVO> records = favPage.getResult().stream()
                .map(fav -> {
                    Product product = productMapper.getById(fav.getProductId());
                    if (product == null) {
                        return null;
                    }
                    ProductVO vo = convertToVO(product);
                    applyPersonalRisk(vo, product);
                    vo.setIsFavorite(true);
                    return vo;
                })
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toList());
        return new PageResult(favPage.getTotal(), records);
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

        // 2. 营养成分 JSON 字符串转对象
        if (product.getNutritionInfo() != null && !product.getNutritionInfo().isEmpty()) {
            try {
                Map<String, Object> nutrition = JSON.parseObject(product.getNutritionInfo());
                productVO.setNutritionInfo(nutrition);
            } catch (Exception e) {
                productVO.setNutritionInfo(product.getNutritionInfo());
            }
        }

        // 3. 根据风险等级设置安全状态
        Integer riskLevel = product.getRiskLevel();
        if (riskLevel != null) {
            productVO.setSafetyStatus(riskLevel == 0 ? "SAFE" : "RISK");
            productVO.setRiskLevel(riskLevel);
        }

        return productVO;
    }

    private void applyPersonalRisk(ProductVO vo, Product product) {
        Long userId = BaseContext.getCurrentId();
        UserProfile profile = userProfileMapper.getByUserId(userId);
        if (profile == null || profile.getAllergens() == null) {
            return;
        }
        List<String> allergens = JSON.parseArray(profile.getAllergens(), String.class);
        if (allergens == null || allergens.isEmpty()) {
            return;
        }
        List<String> ingredients = vo.getIngredientList();
        if (ingredients == null || ingredients.isEmpty()) {
            return;
        }
        boolean hit = allergens.stream().anyMatch(allergen ->
                ingredients.stream().anyMatch(ing -> ing != null && ing.contains(allergen)));
        if (hit) {
            vo.setSafetyStatus("RISK");
            vo.setRiskLevel(2);
            vo.setRiskMsg("警告：含有您设置的过敏原【" + allergens.get(0) + "】");
        }
    }

    private boolean isFavorite(Long productId) {
        Long userId = BaseContext.getCurrentId();
        ProductFavorite favorite = productFavoriteMapper.getByUserAndProduct(userId, productId);
        return favorite != null;
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
}
