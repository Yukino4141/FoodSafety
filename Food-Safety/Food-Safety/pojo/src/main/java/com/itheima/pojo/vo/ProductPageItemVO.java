package com.itheima.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 商品分页查询单项VO
 * 用于分页查询中的单条商品数据展示
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductPageItemVO {
    private Long id;
    private String barcode;
    private String name;
    private String image;
    private String jsonIngredients;
    private Integer riskLevel;
    private String riskMsg;
    private String safetyStatus; // 安全状态：SAFE/RISK/DANGER
    private Long createUser;
    private String createUserName; // 创建人姓名
    private String createTime;
    private String updateTime;

    // 可以添加一些转换方法
    public String getRiskLevelText() {
        if (riskLevel == null) return "未知";
        return riskLevel == 0 ? "安全" : "风险";
    }

    public String getSafetyStatusText() {
        if (safetyStatus == null) return "未知";
        switch (safetyStatus) {
            case "SAFE": return "安全";
            case "RISK": return "风险";
            case "DANGER": return "危险";
            default: return "未知";
        }
    }
}