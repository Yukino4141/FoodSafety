package com.itheima.server.service.impl;

import com.alibaba.fastjson.JSON;
import com.github.pagehelper.Page;
import com.github.pagehelper.PageHelper;
import com.itheima.common.context.BaseContext;
import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.ProductDTO;
import com.itheima.pojo.dto.ProductPageQueryDTO;
import com.itheima.pojo.entity.Employee;  // 确保导入了Employee类
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.vo.ProductPageItemVO;
import com.itheima.pojo.vo.ProductVO;
import com.itheima.server.mapper.ProductMapper;
import com.itheima.server.service.EmployeeService;
import com.itheima.server.service.ProductService;
import com.itheima.server.service.AiService;
import com.itheima.pojo.dto.AiAnalysisResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductMapper productMapper;

    @Autowired
    private EmployeeService employeeService;
    
    @Autowired
    private AiService aiService;

    // 风险成分黑名单（按照接口文档）
    private static final List<String> RISK_BLACKLIST = Arrays.asList(
            "代可可脂", "反式脂肪酸", "苯甲酸钠",
            "山梨酸钾", "人工色素", "阿斯巴甜", "安赛蜜"
    );

    // 日期格式化器
    private static final DateTimeFormatter DATE_TIME_FORMATTER =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    /**
     * 商品分页查询（使用PageHelper）
     */
    @Override
    public PageResult<ProductPageItemVO> pageQuery(ProductPageQueryDTO dto) {
        log.info("商品分页查询，参数：{}", dto);

        // 参数校验和默认值设置
        if (dto.getPage() == null || dto.getPage() < 1) {
            dto.setPage(1);
        }
        if (dto.getPageSize() == null || dto.getPageSize() < 1) {
            dto.setPageSize(10);
        }

        // 设置分页参数
        PageHelper.startPage(dto.getPage(), dto.getPageSize());

        // 执行查询
        List<Product> productList = productMapper.pageQuery(dto);

        // 将PageHelper的List强转为Page，以获取分页信息
        Page<Product> page = (Page<Product>) productList;

        // 转换为VO列表
        List<ProductPageItemVO> voList = page.stream()
                .map(this::convertToPageItemVO)
                .collect(Collectors.toList());

        // 构建分页结果
        return PageResult.<ProductPageItemVO>builder()
                .total(page.getTotal())
                .records(voList)
                .page(dto.getPage())
                .pageSize(dto.getPageSize())
                .pages(page.getPages())
                .build();
    }

    /**
     * 风险检测方法 - 核心逻辑
     */
    @Override
    public ProductVO checkRisk(String ingredients) {
        log.info("执行风险检测，配料表：{}", ingredients);

        ProductVO result = new ProductVO();

        // 调用AI服务进行风险检测
        AiAnalysisResult aiResult = aiService.analyzeIngredients(ingredients);
        
        result.setRiskLevel(aiResult.getRiskLevel());
        result.setRiskMsg(aiResult.getRiskMsg());
        log.info("AI风险检测完成，评分：{}，风险等级：{}，风险信息：{}", 
                aiResult.getScore(), aiResult.getRiskLevel(), aiResult.getRiskMsg());

        return result;
    }

    /**
     * 新增商品
     */
    @Override
    @Transactional
    public void save(ProductDTO productDTO) {
        log.info("开始新增商品，条形码：{}，商品名称：{}",
                productDTO.getBarcode(), productDTO.getName());

        // 1. 验证必填字段
        if (!StringUtils.hasText(productDTO.getBarcode())) {
            throw new RuntimeException("条形码不能为空");
        }
        if (!StringUtils.hasText(productDTO.getName())) {
            throw new RuntimeException("商品名称不能为空");
        }
        if (!StringUtils.hasText(productDTO.getJsonIngredients())) {
            throw new RuntimeException("配料表不能为空");
        }

        // 2. 检查条形码是否已存在
        Product existingProduct = productMapper.getByBarcode(productDTO.getBarcode());
        if (existingProduct != null) {
            throw new RuntimeException(productDTO.getBarcode() + " 已存在");
        }

        // 3. 风险检测逻辑
        ProductVO riskResult = checkRisk(productDTO.getJsonIngredients());
        Integer riskLevel = riskResult.getRiskLevel();
        String riskMsg = riskResult.getRiskMsg();

        // 4. 转换为实体对象
        Product product = new Product();
        BeanUtils.copyProperties(productDTO, product);
        product.setRiskLevel(riskLevel);
        product.setRiskMsg(riskMsg);

        // 5. 从Token获取创建人ID
        Long createUser = BaseContext.getCurrentId();
        if (createUser == null) {
            log.error("无法从Token获取创建人ID，请检查Token是否有效");
            throw new RuntimeException("用户未登录或Token无效");
        }
        product.setCreateUser(createUser);

        // 6. 自动生成创建时间和更新时间
        LocalDateTime now = LocalDateTime.now();
        product.setCreateTime(now);
        product.setUpdateTime(now);

        // 7. 保存到数据库 - 修改点
        log.info("准备保存商品到数据库，条形码：{}，风险等级：{}",
                product.getBarcode(), product.getRiskLevel());

        try {
            // 注意：insert方法返回void，但会通过keyProperty自动填充product.id
            productMapper.insert(product);

            // 插入成功后，product.getId()会被自动填充
            if (product.getId() != null) {
                log.info("商品保存成功，ID：{}，条形码：{}，风险等级：{}",
                        product.getId(), product.getBarcode(), product.getRiskLevel());
            } else {
                // 理论上不会走到这里，但如果出现，记录警告
                log.warn("商品保存成功但未获取到ID，条形码：{}", product.getBarcode());
            }
        } catch (Exception e) {
            log.error("商品保存失败，条形码：{}，错误：{}",
                    product.getBarcode(), e.getMessage(), e);
            throw new RuntimeException("商品保存失败：" + e.getMessage());
        }
    }

    /**
     * 修改商品
     */
    @Override
    @Transactional
    public void update(ProductDTO productDTO) {
        log.info("修改商品，ID：{}", productDTO.getId());

        // 验证参数
        validateProductDTO(productDTO, true);

        // 检查商品是否存在
        Product existingProduct = productMapper.getById(productDTO.getId());
        if (existingProduct == null) {
            throw new RuntimeException("商品不存在");
        }

        // 更新商品信息
        Product product = convertToEntity(productDTO);

        // 如果修改了配料表，重新进行风险检测
        if (productDTO.getJsonIngredients() != null &&
                !productDTO.getJsonIngredients().equals(existingProduct.getJsonIngredients())) {
            ProductVO riskResult = checkRisk(productDTO.getJsonIngredients());
            product.setRiskLevel(riskResult.getRiskLevel());
            product.setRiskMsg(riskResult.getRiskMsg());
        } else {
            // 保持原有的风险等级
            product.setRiskLevel(existingProduct.getRiskLevel());
            product.setRiskMsg(existingProduct.getRiskMsg());
        }

        // 设置更新时间
        product.setUpdateTime(LocalDateTime.now());

        // 更新数据库
        productMapper.update(product);

        log.info("商品修改成功，ID：{}", productDTO.getId());
    }

    /**
     * 批量删除
     */
    @Override
    @Transactional
    public void deleteByIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new RuntimeException("请选择要删除的商品");
        }

        log.info("批量删除商品，ID列表：{}", ids);

        // 验证商品是否存在
        for (Long id : ids) {
            Product product = productMapper.getById(id);
            if (product == null) {
                throw new RuntimeException("商品ID " + id + " 不存在");
            }
        }

        // 执行删除
        productMapper.deleteByIds(ids);

        log.info("批量删除成功，删除数量：{}", ids.size());
    }

    /**
     * 风险检测测试方法
     */
    @Override
    public ProductVO checkRiskForTest(String ingredients) {
        return checkRisk(ingredients);
    }

    /**
     * 根据条形码查询商品
     */
    @Override
    public Product getByBarcode(String barcode) {
        return productMapper.getByBarcode(barcode);
    }

    /**
     * 根据名称模糊查询
     */
    @Override
    public List<Product> listByName(String name) {
        return productMapper.listByName(name);
    }

    // ============= 私有辅助方法 =============

    /**
     * 验证ProductDTO参数
     */
    private void validateProductDTO(ProductDTO productDTO, boolean isUpdate) {
        if (!isUpdate) {
            // 新增时验证必填字段
            if (!StringUtils.hasText(productDTO.getBarcode())) {
                throw new RuntimeException("条形码不能为空");
            }
            if (!StringUtils.hasText(productDTO.getName())) {
                throw new RuntimeException("商品名称不能为空");
            }
            if (!StringUtils.hasText(productDTO.getJsonIngredients())) {
                throw new RuntimeException("配料表不能为空");
            }
        } else {
            // 修改时验证ID
            if (productDTO.getId() == null) {
                throw new RuntimeException("商品ID不能为空");
            }
        }

        // 通用验证
        if (StringUtils.hasText(productDTO.getBarcode()) &&
                productDTO.getBarcode().length() > 32) {
            throw new RuntimeException("条形码长度不能超过32位");
        }

        if (StringUtils.hasText(productDTO.getName()) &&
                productDTO.getName().length() > 100) {
            throw new RuntimeException("商品名称长度不能超过100位");
        }
    }

    /**
     * 将ProductDTO转换为Product实体
     */
    private Product convertToEntity(ProductDTO dto) {
        Product product = new Product();
        BeanUtils.copyProperties(dto, product);
        return product;
    }

    /**
     * 将Product实体转换为ProductVO
     */
    private ProductVO convertToProductVO(Product product) {
        ProductVO vo = new ProductVO();
        BeanUtils.copyProperties(product, vo);

        // 将配料表字符串拆分为数组
        if (StringUtils.hasText(product.getJsonIngredients())) {
            vo.setIngredientList(parseIngredientList(product.getJsonIngredients()));
        }

        // 设置安全状态
        vo.setSafetyStatus(convertRiskLevelToSafetyStatus(product.getRiskLevel()));

        return vo;
    }

    private List<String> parseIngredientList(String raw) {
        if (!StringUtils.hasText(raw)) {
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
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }

    /**
     * 将Product实体转换为分页ItemVO
     */
    private ProductPageItemVO convertToPageItemVO(Product product) {
        ProductPageItemVO vo = new ProductPageItemVO();
        BeanUtils.copyProperties(product, vo);

        // 设置安全状态
        vo.setSafetyStatus(convertRiskLevelToSafetyStatus(product.getRiskLevel()));

        // 获取创建人姓名
        if (product.getCreateUser() != null) {
            try {
                Employee employee = employeeService.getById(product.getCreateUser());
                if (employee != null) {
                    vo.setCreateUserName(employee.getName());
                } else {
                    vo.setCreateUserName("未知");
                }
            } catch (Exception e) {
                log.warn("获取创建人信息失败，ID：{}", product.getCreateUser());
                vo.setCreateUserName("未知");
            }
        }

        // 格式化时间
        if (product.getCreateTime() != null) {
            vo.setCreateTime(product.getCreateTime().format(DATE_TIME_FORMATTER));
        }
        if (product.getUpdateTime() != null) {
            vo.setUpdateTime(product.getUpdateTime().format(DATE_TIME_FORMATTER));
        }

        return vo;
    }

    /**
     * 风险等级转换为安全状态
     * 0 -> SAFE, 1 -> RISK, 其他 -> DANGER
     */
    private String convertRiskLevelToSafetyStatus(Integer riskLevel) {
        if (riskLevel == null) {
            return "UNKNOWN";
        }

        switch (riskLevel) {
            case 0:
                return "SAFE";
            case 1:
                return "RISK";
            default:
                return "DANGER";
        }
    }
}