package com.itheima.server.service;

import com.itheima.pojo.entity.Product;
import com.itheima.pojo.vo.ProductVO;

import java.util.List;

/**
 * 用户端商品服务接口
 */
public interface UserProductService {

    /**
     * 扫码查询商品详情
     * @param barcode 条形码
     * @return 商品视图对象（含安全状态）
     */
    ProductVO scanByBarcode(String barcode);

    /**
     * 关键词搜索商品列表
     * @param name 商品名称关键词
     * @return 商品列表
     */
    List<ProductVO> searchList(String name);
}
