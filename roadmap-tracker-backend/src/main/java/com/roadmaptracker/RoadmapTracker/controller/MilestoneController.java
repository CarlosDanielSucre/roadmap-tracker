package com.roadmaptracker.RoadmapTracker.controller;

import com.roadmaptracker.RoadmapTracker.model.Milestone;
import com.roadmaptracker.RoadmapTracker.repository.MilestoneRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@CrossOrigin(origins = {
    "https://carlossucredev.github.io",
    "http://127.0.0.1:5500"
})
public class MilestoneController {
    private final MilestoneRepository repository;

    public MilestoneController(MilestoneRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/milestones")
    public List<Milestone> getAllMilestone() {
        return repository.findAll();
    }
    @GetMapping("/milestones/{id}")
    public Optional<Milestone> getMilestoneById(@PathVariable int id) {
        return repository.findById(id);
    }
    @PostMapping("/milestones")
    public Milestone postMilestone(@RequestBody Milestone milestone) {
        return repository.save(milestone);
    }
    @DeleteMapping("/milestones/{id}")
    public void deleteMilestoneById (@PathVariable int id) {
        repository.deleteById(id);
    }
    @PutMapping("/milestones/{id}")
    public Milestone updateMilestoneById(@PathVariable int id, @RequestBody Milestone milestone) {
        Milestone existing = repository.findById(id).orElseThrow();
        existing.setDone(milestone.isDone());
        return repository.save(existing);
    }
}
