package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class ProductPageQueryDTO implements Serializable {
    private int page;
    private int pageSize;
    private String name;    // 商品名称模糊查询
    private String barcode; // 条码精确查询
}