package com.itheima.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 配料风险查询结果VO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientRiskVO {
    /**
     * 配料名称
     */
    private String ingredient;
    
    /**
     * 安全分数 0-100，分数越高越安全
     */
    private Integer score;
    
    /**
     * 风险等级: 0=低风险(安全), 1=中风险, 2=高风险
     */
    private Integer riskLevel;
    
    /**
     * 风险等级文字
     */
    private String riskLevelText;
    
    /**
     * 配料说明
     */
    private String description;
    
    /**
     * 健康建议
     */
    private String suggestion;
}
