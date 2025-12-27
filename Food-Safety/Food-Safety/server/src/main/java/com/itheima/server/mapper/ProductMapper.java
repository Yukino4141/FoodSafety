package com.itheima.server.mapper;

import com.itheima.pojo.dto.ProductPageQueryDTO;
import com.itheima.pojo.entity.Product;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

import java.util.List;

/**
 * 商品 Mapper 接口
 */
@Mapper
public interface ProductMapper {
    /**
     * 插入商品（管理端新增商品）
     * @param product 商品实体
     */
    void insert(Product product);

    /**
     * 根据 ID 删除商品（管理端删除商品）
     * @param id 商品ID
     */
    void deleteById(Long id);

    /**
     * 批量删除商品
     * @param ids 商品ID列表
     */
    void deleteByIds(List<Long> ids);

    /**
     * 更新商品信息（管理端修改商品）
     * @param product 商品实体
     */
    void update(Product product);

    /**
     * 根据条形码查询商品（用户端扫码）
     * @param barcode 条形码
     * @return 商品实体
     */
    @Select("SELECT * FROM product WHERE barcode = #{barcode}")
    Product getByBarcode(String barcode);

    /**
     * 根据 ID 查询商品
     * @param id 商品ID
     * @return 商品实体
     */
    @Select("SELECT * FROM product WHERE id = #{id}")
    Product getById(Long id);

    /**
     * 根据商品名称模糊搜索（用户端关键词搜索）
     * @param name 商品名称关键词
     * @return 商品列表
     */
    List<Product> listByName(String name);

    /**
     * 分页查询商品（管理端商品列表）
     * @param dto 查询条件
     * @return 商品列表
     */
    List<Product> pageQuery(ProductPageQueryDTO dto);
}
