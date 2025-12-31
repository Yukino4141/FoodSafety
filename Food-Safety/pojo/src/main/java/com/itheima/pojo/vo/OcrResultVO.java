package com.itheima.pojo.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OcrResultVO implements Serializable {
    private String imageUrl;
    private String rawText;
    private List<String> ingredients;
}
