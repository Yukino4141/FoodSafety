package com.itheima.pojo.dto;

import lombok.Data;

import java.io.Serializable;

@Data
public class CommentDTO implements Serializable {
    private Long postId;
    private String content;
}
