package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class ProfileDTO implements Serializable {
    private List<String> allergens;
    private String dietType;
    private List<String> healthTags;
}
