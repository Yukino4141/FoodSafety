package com.itheima.common.constant;

/**
 * 食品安全系统消息常量
 */
public class FoodMessageConstant {
    // 商品相关
    public static final String PRODUCT_NOT_FOUND = "该商品未收录，敬请期待！";
    public static final String PRODUCT_ALREADY_EXISTS = "商品已存在";
    
    // 风险检测
    public static final String RISK_INGREDIENT_TEMPLATE = "检测到风险成分：%s";
    
    // 微信登录
    public static final String WECHAT_LOGIN_FAILED = "微信登录失败，请重试";
    
    // 扫描历史
    public static final String HISTORY_CLEARED = "清空成功";
    
    // 通用消息
    public static final String SUCCESS = "success";
    public static final String SYSTEM_ERROR = "系统繁忙，请稍后重试";
    
    // 账号相关
    public static final String ACCOUNT_NOT_FOUND = "账号不存在";
    public static final String PASSWORD_ERROR = "密码错误";
    public static final String ACCOUNT_LOCKED = "账号已锁定";
}
