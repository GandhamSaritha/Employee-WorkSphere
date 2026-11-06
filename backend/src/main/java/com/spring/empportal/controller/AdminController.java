package com.spring.empportal.controller;

import com.spring.empportal.model.LeaveReques;
import com.spring.empportal.repo.LeaveRequestRepo;
import com.spring.empportal.repo.UserRepo;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepo userRepo;
    private final LeaveRequestRepo leaveRepo;

    public AdminController(
            UserRepo userRepo,
            LeaveRequestRepo leaveRepo) {
        this.userRepo = userRepo;
        this.leaveRepo = leaveRepo;
    }

    @GetMapping("/employees")
    public List<Map<String, Object>> employees() {
        return userRepo.findAll().stream().map(user -> {
            Map<String, Object> data = new java.util.HashMap<>();
            data.put("id", user.getId());
            data.put("username", user.getUsername());
            data.put("email", user.getEmail());
            data.put("role", user.getRole());
            data.put("enabled", user.isEnabled());
            data.put("createdAt", user.getCreatedAt());
            return data;
        }).toList();
    }

    @GetMapping("/leaves")
    public List<LeaveReques> allLeaves() {
        return leaveRepo.findAllByOrderBySubmittedAtDesc();
    }

    @PutMapping("/leaves/{id}/status")
    public ResponseEntity<?> updateLeaveStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> data) {

        String status = data.getOrDefault("status", "")
                .trim().toUpperCase();

        if (!status.equals("APPROVED") && !status.equals("REJECTED")) {
            return ResponseEntity.badRequest().body(
                Map.of("message", "Status must be APPROVED or REJECTED.")
            );
        }

        return leaveRepo.findById(id).map(leave -> {
            if (!"PENDING".equals(leave.getStatus())) {
                return ResponseEntity.badRequest().body(
                    Map.of("message", "This request has already been reviewed.")
                );
            }

            leave.setStatus(status);
            return ResponseEntity.ok(leaveRepo.save(leave));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }
}