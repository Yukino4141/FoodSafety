package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class FamilyMemberDTO implements Serializable {
    private String name;
    private Integer age;
    private List<String> healthTags;
}
