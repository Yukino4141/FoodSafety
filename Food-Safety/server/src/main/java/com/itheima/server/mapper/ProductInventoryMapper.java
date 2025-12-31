package com.itheima.server.mapper;

import com.itheima.pojo.entity.ProductInventory;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface ProductInventoryMapper {
    void insert(ProductInventory inventory);

    List<ProductInventory> listByUserId(Long userId);

    void updateStatus(ProductInventory inventory);
}
