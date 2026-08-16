package com.roadmaptracker.RoadmapTracker.repository;

import com.roadmaptracker.RoadmapTracker.model.StudyEntry;
import org.springframework.data.jpa.repository.JpaRepository;

public interface StudyEntryRepository extends JpaRepository<StudyEntry, Integer> {
}
