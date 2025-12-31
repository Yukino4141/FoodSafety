package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class PostDTO implements Serializable {
    private String title;
    private String content;
    private List<String> images;
}
