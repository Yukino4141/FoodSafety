package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class LikeDTO implements Serializable {
    private Long postId;
    private Boolean isLike;
}
