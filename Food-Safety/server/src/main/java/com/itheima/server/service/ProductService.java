package com.itheima.server.service;

import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.ProductDTO;
import com.itheima.pojo.dto.ProductPageQueryDTO;
import com.itheima.pojo.entity.Product;
import com.itheima.pojo.vo.ProductPageItemVO;
import com.itheima.pojo.vo.ProductVO;

import java.util.List;

/**
 * 商品服务接口
 */
public interface ProductService {

    /**
     * 新增商品
     * @param productDTO 商品信息
     */
    void save(ProductDTO productDTO);

    /**
     * 商品分页查询
     * @param dto 查询条件
     * @return 分页结果
     */
    PageResult<ProductPageItemVO> pageQuery(ProductPageQueryDTO dto);

    /**
     * 修改商品
     * @param productDTO 商品信息
     */
    void update(ProductDTO productDTO);

    /**
     * 批量删除商品
     * @param ids 商品ID列表
     */
    void deleteByIds(List<Long> ids);

    /**
     * 风险检测
     * @param ingredients 配料表
     * @return 检测结果
     */
    ProductVO checkRisk(String ingredients);

    /**
     * 风险检测测试方法
     * @param ingredients 配料表
     * @return 检测结果
     */
    ProductVO checkRiskForTest(String ingredients);

    /**
     * 根据条形码查询商品
     * @param barcode 条形码
     * @return 商品信息
     */
    Product getByBarcode(String barcode);


    /**
     * 根据名称模糊查询
     * @param name 商品名称
     * @return 商品列表
     */
    List<Product> listByName(String name);
}