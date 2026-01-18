package com.itheima.server.service;

import com.itheima.pojo.dto.AiAnalyzeDTO;
import com.itheima.pojo.dto.AiAnalysisResult;
import com.itheima.pojo.vo.AiAnalyzeVO;
import com.itheima.pojo.vo.IngredientRiskVO;
import com.itheima.pojo.vo.OcrResultVO;
import org.springframework.web.multipart.MultipartFile;

/**
 * AI 服务接口
 */
public interface AiService {

    /** OCR 识别配料表 */
    OcrResultVO ocr(MultipartFile file);

    /** 对配料表做综合分析 */
    AiAnalyzeVO analyze(AiAnalyzeDTO dto);

    /**
     * 分析商品配料表安全性（简化版，供新增功能调用）
     * @param ingredients 配料表（逗号分隔或 JSON 数组字符串）
     */
    AiAnalysisResult analyzeIngredients(String ingredients);

    /**
     * 配料速查 - 查询单个配料的风险等级
     * @param ingredient 配料名称
     * @return 配料风险信息
     */
    IngredientRiskVO checkIngredientRisk(String ingredient);
}

