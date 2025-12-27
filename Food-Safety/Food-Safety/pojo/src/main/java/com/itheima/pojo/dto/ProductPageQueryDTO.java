package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ProductPageQueryDTO implements Serializable {
    private Integer page = 1;
    private Integer pageSize = 10;
    private String name;    // 商品名称模糊查询
    private String barcode; // 条码精确查询
}