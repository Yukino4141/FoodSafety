package com.itheima.server.mapper;

import com.itheima.pojo.entity.ProductFavorite;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

@Mapper
public interface ProductFavoriteMapper {

    @Select("SELECT * FROM product_favorite WHERE user_id = #{userId} AND product_id = #{productId} LIMIT 1")
    ProductFavorite getByUserAndProduct(Long userId, Long productId);

    void insert(ProductFavorite favorite);

    void delete(Long id);
}
