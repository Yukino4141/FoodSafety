package com.itheima.server.service.impl;

import com.itheima.server.mapper.PostCommentMapper;
import com.itheima.server.service.PostCommentService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * 帖子评论服务实现类
 */
@Service
@Slf4j
public class PostCommentServiceImpl implements PostCommentService {

    @Autowired
    private PostCommentMapper postCommentMapper;

    /**
     * 获取待审核帖子数
     * @return 待审核帖子数
     */
    @Override
    public Integer getPendingPosts() {
        return postCommentMapper.getPendingPosts();
    }
}