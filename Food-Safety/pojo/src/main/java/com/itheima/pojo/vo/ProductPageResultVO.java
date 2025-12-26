package com.itheima.pojo.vo;

import lombok.Data;
import java.util.List;

@Data
public class ProductPageResultVO {
    private Long total;
    private List<ProductVO> records;
}