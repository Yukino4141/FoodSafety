package com.itheima.server.service;

import com.itheima.common.result.PageResult;
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
     * 关键词搜索商品列表（分页）
     * @param name 商品名称关键词
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    PageResult searchList(String name, Integer page, Integer pageSize);
}
