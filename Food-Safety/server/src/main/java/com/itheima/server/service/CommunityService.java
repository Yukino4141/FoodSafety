package com.itheima.server.service;

import com.itheima.common.result.PageResult;
import com.itheima.pojo.dto.LikeDTO;
import com.itheima.pojo.dto.PostDTO;

public interface CommunityService {
    void publish(PostDTO dto);

    PageResult feed(Integer page, Integer pageSize, String sort);

    void like(LikeDTO dto);
}
