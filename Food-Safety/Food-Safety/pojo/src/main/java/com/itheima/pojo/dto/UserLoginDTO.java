package com.itheima.pojo.dto;

import lombok.Data;
import java.io.Serializable;

@Data
public class UserLoginDTO implements Serializable {
    private String code; // 微信授权码
    private String userInfo; // 可选：微信用户RawData(用于更新头像昵称)
}