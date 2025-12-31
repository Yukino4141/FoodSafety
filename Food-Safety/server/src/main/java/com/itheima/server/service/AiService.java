package com.itheima.server.service;

import com.itheima.pojo.dto.AiAnalysisResult;

/**
 * AI服务接口
 */
public interface AiService {
    /**
     * 分析商品配料表的安全性
     * @param ingredients 配料表
     * @return 分析结果
     */
    AiAnalysisResult analyzeIngredients(String ingredients);
}
