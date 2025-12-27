package com.itheima.server.service;

import com.itheima.pojo.vo.ProductVO;

import java.util.List;

/**
 * 扫描历史服务接口
 */
public interface ScanHistoryService {

    /**
     * 记录扫描历史
     * @param productId 商品ID
     */
    void recordScanHistory(Long productId);

    /**
     * 查询当前用户的扫描历史
     * @return 商品列表（带历史信息）
     */
    List<ProductVO> getMyHistory();

    /**
     * 清空当前用户的扫描历史
     */
    void clearMyHistory();
}
