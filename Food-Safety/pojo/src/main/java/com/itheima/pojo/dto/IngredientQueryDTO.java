package com.itheima.pojo.dto;

import lombok.Data;

/**
 * 配料速查请求DTO
 */
@Data
public class IngredientQueryDTO {
    /**
     * 配料名称
     */
    private String ingredient;
}
