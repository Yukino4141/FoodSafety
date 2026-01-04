package com.itheima.server.service;

import com.itheima.pojo.dto.EmployeeLoginDTO;
import com.itheima.pojo.entity.Employee;
import com.itheima.pojo.vo.EmployeeLoginVO;

/**
 * 员工服务接口
 */
public interface EmployeeService {

    /**
     * 员工登录
     * @param employeeLoginDTO 登录参数
     * @return 登录结果
     */
    EmployeeLoginVO login(EmployeeLoginDTO employeeLoginDTO);

    /**
     * 根据ID查询员工
     * @param id 员工ID
     * @return 员工信息
     */
    Employee getById(Long id);

    /**
     * 根据用户名查询员工
     * @param username 用户名
     * @return 员工信息
     */
    Employee getByUsername(String username);

    /**
     * 检查员工状态
     * @param employee 员工信息
     * @return true: 正常 false: 异常
     */
    boolean checkStatus(Employee employee);
}