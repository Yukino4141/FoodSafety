package com.itheima.pojo.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 商品详情VO - 用于用户端扫码查询、搜索、历史记录返回
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDetailVO implements Serializable {
    private Long id;
    private String barcode;
    private String name;
    private String image;
    private List<String> ingredientList;  // 配料列表(数组格式)
    private String safetyStatus;          // SAFE/RISK/DANGER
    private String riskMsg;               // 风险提示
    private Integer riskLevel;            // 0/1/2
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
