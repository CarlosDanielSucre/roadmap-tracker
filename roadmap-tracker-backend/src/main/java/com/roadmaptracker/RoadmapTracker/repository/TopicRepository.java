package com.roadmaptracker.RoadmapTracker.repository;

import com.roadmaptracker.RoadmapTracker.model.Topic;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TopicRepository extends JpaRepository<Topic, Integer> {
}
