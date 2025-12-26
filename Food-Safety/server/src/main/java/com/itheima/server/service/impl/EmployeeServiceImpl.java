package com.itheima.server.service.impl;

import com.itheima.common.untils.JwtUtil;
import com.itheima.common.untils.Md5Util;
import com.itheima.pojo.dto.EmployeeLoginDTO;
import com.itheima.pojo.entity.Employee;
import com.itheima.pojo.vo.EmployeeLoginVO;
import com.itheima.server.mapper.EmployeeMapper;
import com.itheima.server.service.EmployeeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.DigestUtils;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
public class EmployeeServiceImpl implements EmployeeService {

    @Autowired
    private EmployeeMapper employeeMapper;

    @Value("${food-safety.jwt.admin-secret-key}")
    private String adminSecretKey;

    @Value("${food-safety.jwt.admin-ttl}")
    private Long adminTtl;

    /**
     * 员工登录
     */
    @Override
    public EmployeeLoginVO login(EmployeeLoginDTO employeeLoginDTO) {
        String username = employeeLoginDTO.getUsername();
        String password = employeeLoginDTO.getPassword();

        log.info("员工尝试登录，用户名：{}", username);

        // 1. 根据用户名查询员工
        Employee employee = getByUsername(username);
        if (employee == null) {
            log.warn("登录失败，账号不存在：{}", username);
            throw new RuntimeException("账号不存在");
        }

        // 2. 检查员工状态
        if (!checkStatus(employee)) {
            log.warn("登录失败，账号已锁定：{}", username);
            throw new RuntimeException("账号已锁定");
        }

        // 3. 密码校验（MD5加密后比较）
        String encryptedPassword = DigestUtils.md5DigestAsHex(password.getBytes(StandardCharsets.UTF_8));
        if (!encryptedPassword.equals(employee.getPassword())) {
            log.warn("登录失败，密码错误：{}", username);
            throw new RuntimeException("密码错误");
        }

        // 4. 生成JWT令牌
        Map<String, Object> claims = new HashMap<>();
        claims.put("empId", employee.getId());
        claims.put("username", employee.getUsername());
        claims.put("name", employee.getName());

        String token = JwtUtil.createJWT(adminSecretKey, adminTtl, claims);

        // 5. 封装返回结果
        EmployeeLoginVO employeeLoginVO = EmployeeLoginVO.builder()
                .id(employee.getId())
                .userName(employee.getUsername())
                .name(employee.getName())
                .token(token)
                .build();

        log.info("员工登录成功，用户名：{}，员工ID：{}", username, employee.getId());
        return employeeLoginVO;
    }

    /**
     * 根据ID查询员工
     */
    @Override
    public Employee getById(Long id) {
        return employeeMapper.getById(id);
    }

    /**
     * 根据用户名查询员工
     */
    @Override
    public Employee getByUsername(String username) {
        return employeeMapper.getByUsername(username);
    }

    /**
     * 检查员工状态
     * 状态为1表示正常，0表示锁定
     */
    @Override
    public boolean checkStatus(Employee employee) {
        return employee != null && employee.getStatus() == 1;
    }
}