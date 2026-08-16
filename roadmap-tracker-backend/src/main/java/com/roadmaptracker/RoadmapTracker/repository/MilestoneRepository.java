package com.roadmaptracker.RoadmapTracker.repository;

import com.roadmaptracker.RoadmapTracker.model.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MilestoneRepository extends JpaRepository<Milestone, Integer> {
}
