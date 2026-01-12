package com.itheima.server.service;

import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.LikeDTO;
import com.itheima.pojo.dto.PostDTO;
import com.itheima.pojo.dto.CommentDTO;
import com.itheima.pojo.vo.CommentVO;
import com.itheima.pojo.vo.PostVO;

public interface CommunityService {
    void publish(PostDTO dto);

    PageResult feed(Integer page, Integer pageSize, String sort);

    void like(LikeDTO dto);

    PostVO detail(Long id);

    PageResult myPosts(Integer page, Integer pageSize);

    Long comment(CommentDTO dto);

    PageResult commentList(Long postId, Integer page, Integer pageSize);
}
