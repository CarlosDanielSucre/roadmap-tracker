package com.roadmaptracker.RoadmapTracker.controller;

import com.roadmaptracker.RoadmapTracker.repository.StudyEntryRepository;
import com.roadmaptracker.RoadmapTracker.model.StudyEntry;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;


@RestController
@CrossOrigin(origins = "https://carlossucredev.github.io")
@CrossOrigin(origins = "http://127.0.0.1:5500")
public class StudyEntryController {

    private final StudyEntryRepository repository;

    public StudyEntryController(StudyEntryRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/entries")
    public List<StudyEntry> getAllEntries() {
        return repository.findAll();
    }
    @PostMapping("/entries")
    public StudyEntry postStudyEntry (@RequestBody StudyEntry entry) {
        return repository.save(entry);
    }
    @GetMapping("/entries/{id}")
    public Optional<StudyEntry> getStudyEntryById (@PathVariable int id) {
        return repository.findById(id);
    }
    @DeleteMapping("/entries/{id}")
    public void deleteStudyEntryById (@PathVariable int id){
        repository.deleteById(id);
    }
}
