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

    @org.apache.ibatis.annotations.Insert("insert into post_comment(post_id, user_id, content, create_time) values(#{postId}, #{userId}, #{content}, #{createTime})")
    @org.apache.ibatis.annotations.Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(com.itheima.pojo.entity.PostComment comment);

    @org.apache.ibatis.annotations.Select("select * from post_comment where post_id = #{postId} order by create_time desc")
    java.util.List<com.itheima.pojo.entity.PostComment> listByPostId(Long postId);

    @org.apache.ibatis.annotations.Select("select count(*) from post_comment where post_id = #{postId}")
    Long countByPostId(Long postId);

    @org.apache.ibatis.annotations.Delete("delete from post_comment where post_id = #{postId}")
    int deleteByPostId(Long postId);
}