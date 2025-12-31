package com.itheima.server.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;

/**
 * 帖子评论 Mapper 接口
 */
@Mapper
public interface PostCommentMapper {

    /**
     * 获取待审核帖子数
     * @return 待审核帖子数
     */
    @Select("SELECT COUNT(*) FROM community_post")
    Integer getPendingPosts();
}