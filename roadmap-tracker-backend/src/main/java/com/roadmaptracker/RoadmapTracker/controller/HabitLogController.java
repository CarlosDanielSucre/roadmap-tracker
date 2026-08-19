package com.roadmaptracker.RoadmapTracker.controller;

import com.roadmaptracker.RoadmapTracker.model.HabitLog;
import com.roadmaptracker.RoadmapTracker.model.Milestone;
import com.roadmaptracker.RoadmapTracker.repository.HabitLogRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = {
    "https://carlosdanielsucre.github.io",
    "http://127.0.0.1:5500"
})
public class HabitLogController {
    private final HabitLogRepository repository;

    public HabitLogController(HabitLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/habitlogs")
    public List<HabitLog> getAllHabitLogs() {
        return repository.findAll();
    }
    @GetMapping("/habitlogs/{id}")
    public Optional<HabitLog> getHabitLogById(@PathVariable int id) {
        return repository.findById(id);
    }
    @PostMapping("/habitlogs")
    public HabitLog postHabitLog(@RequestBody HabitLog habitlog) {
        return repository.save(habitlog);
    }
    @DeleteMapping("/habitlogs/{id}")
    public void deleteHabitLogById (@PathVariable int id) {
        repository.deleteById(id);
    }

}
