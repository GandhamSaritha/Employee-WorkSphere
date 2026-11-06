package com.spring.empportal.repo;

import com.spring.empportal.model.LeaveReques;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRequestRepo
        extends JpaRepository<LeaveReques, Long> {

    List<LeaveReques> findByUserIdOrderBySubmittedAtDesc(Long userId);
    List<LeaveReques> findAllByOrderBySubmittedAtDesc();
}