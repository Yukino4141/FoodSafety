package com.itheima.server.mapper;

import com.itheima.pojo.entity.ProductInventory;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ProductInventoryMapper {
    void insert(ProductInventory inventory);

    List<ProductInventory> listByUserId(Long userId);

    void updateStatus(ProductInventory inventory);

    @org.apache.ibatis.annotations.Select("select * from product_inventory where id = #{id} and user_id = #{userId} limit 1")
    ProductInventory getByIdAndUser(Long id, Long userId);

    @org.apache.ibatis.annotations.Update("update product_inventory set purchase_date = #{purchaseDate}, expiry_date = #{expiryDate}, status = #{status} where id = #{id} and user_id = #{userId}")
    int update(ProductInventory inventory);

    @org.apache.ibatis.annotations.Delete("delete from product_inventory where id = #{id} and user_id = #{userId}")
    int deleteByIdAndUser(Long id, Long userId);
}
