package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;
import java.util.List;

@Data
public class AiAnalyzeDTO implements Serializable {
    private List<String> ingredients;
    private String targetUser;
}
