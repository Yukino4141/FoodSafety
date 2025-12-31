package com.itheima.server.service;

import com.itheima.pojo.dto.ProfileDTO;
import com.itheima.pojo.vo.ProfileVO;

public interface UserProfileService {
    ProfileVO getProfile();

    ProfileVO upsertProfile(ProfileDTO dto);
}
