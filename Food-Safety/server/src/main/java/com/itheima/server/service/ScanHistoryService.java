package com.itheima.server.service;

import com.itheima.common.result.PageResult;
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
     * 查询当前用户的扫描历史（分页）
     * @param page 页码
     * @param pageSize 每页大小
     * @return 分页结果
     */
    PageResult getMyHistory(Integer page, Integer pageSize);

    /**
     * 清空当前用户的扫描历史
     */
    void clearMyHistory();
}
