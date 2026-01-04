package com.itheima.server.service;

/**
 * 帖子评论服务接口
 */
public interface PostCommentService {

    /**
     * 获取待审核帖子数
     * @return 待审核帖子数
     */
    Integer getPendingPosts();
}