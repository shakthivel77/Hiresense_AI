import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Layers,
  Clock,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Award,
} from 'lucide-react';

interface Resource {
  id: string;
  title: string;
  url: string;
  type: string;
  source: string;
  description?: string;
  isFree: boolean;
}

interface Subtopic {
  id: string;
  title: string;
  description?: string;
  skillId?: string;
  estimatedMinutes: number;
  resources: Resource[];
}

interface Module {
  id: string;
  title: string;
  description?: string;
  displayOrder: number;
  subtopics: Subtopic[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  domainSlug: string;
  difficulty: string;
  prerequisites: string[];
  estimatedDuration: string;
  learningOutcomes: string[];
  status: string;
  modules: Module[];
}

interface CourseCatalogViewProps {
  onNavigateToRoadmap?: (domainSlug?: string, skillId?: string) => void;
  onNavigateToDiagnostic?: (domainSlug?: string) => void;
}

export const CourseCatalogView: React.FC<CourseCatalogViewProps> = ({
  onNavigateToRoadmap,
  onNavigateToDiagnostic,
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [expandedSubtopics, setExpandedSubtopics] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/courses')
      .then((res) => res.json())
      .then((body) => {
        if (body.success && Array.isArray(body.data)) {
          setCourses(body.data);
          if (body.data.length > 0) {
            setSelectedCourse(body.data[0]);
            // Expand first module by default
            if (body.data[0].modules?.length > 0) {
              setExpandedModules({ [body.data[0].modules[0].id]: true });
              if (body.data[0].modules[0].subtopics?.length > 0) {
                setExpandedSubtopics({ [body.data[0].modules[0].subtopics[0].id]: true });
              }
            }
          }
        }
      })
      .catch((err) => console.warn('[CourseCatalog] Failed to fetch courses:', err))
      .finally(() => setLoading(false));
  }, []);

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({ ...prev, [modId]: !prev[modId] }));
  };

  const toggleSubtopic = (subId: string) => {
    setExpandedSubtopics((prev) => ({ ...prev, [subId]: !prev[subId] }));
  };

  if (loading) {
    return <div className="p-12 text-center text-xs text-muted">Loading official course catalog...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-xl p-6 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-accent-primary" />
            <h1 className="text-xl font-bold text-primary">Centralized Learning Courses</h1>
            <span className="text-[10px] bg-accent-primary/10 border border-accent-primary/30 text-accent-primary px-2 py-0.5 rounded font-mono font-bold">
              CURATED SYLLABUS
            </span>
          </div>
          <p className="text-xs text-muted mt-1">
            Structured modular courses mapped directly to canonical skills, learning resources, and verification assessments.
          </p>
        </div>

        {onNavigateToDiagnostic && selectedCourse && (
          <button
            onClick={() => onNavigateToDiagnostic(selectedCourse.domainSlug)}
            className="flex items-center gap-2 bg-accent-primary hover:bg-accent-primary/90 text-base text-xs font-bold px-3.5 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <Award className="h-4 w-4" />
            <span>Verify Course Skills</span>
          </button>
        )}
      </div>

      {/* Track Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {courses.map((c) => {
          const isSelected = selectedCourse?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCourse(c);
                if (c.modules?.length > 0) {
                  setExpandedModules({ [c.modules[0].id]: true });
                }
              }}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition-all text-left ${
                isSelected
                  ? 'bg-elevated border-accent-primary text-primary shadow-sm'
                  : 'bg-surface border-border text-muted hover:text-primary hover:border-border/80'
              }`}
            >
              <div className="text-[10px] uppercase font-mono text-accent-primary">{c.domainSlug}</div>
              <div className="font-bold text-sm text-primary mt-0.5 truncate max-w-xs">{c.title}</div>
            </button>
          );
        })}
      </div>

      {/* Selected Course Syllabus View */}
      {selectedCourse && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Syllabus: Modules & Subtopics */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h2 className="text-base font-bold text-primary">{selectedCourse.title}</h2>
              <p className="text-xs text-muted mt-1 leading-relaxed">{selectedCourse.description}</p>

              <div className="flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-border/60 text-xs text-muted">
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-accent-secondary" />
                  Estimated: {selectedCourse.estimatedDuration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-accent-primary" />
                  Level: <span className="capitalize font-semibold text-primary">{selectedCourse.difficulty}</span>
                </span>
              </div>
            </div>

            {/* Modules Hierarchy */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Curriculum Modules</h3>

              {selectedCourse.modules.map((mod, modIdx) => {
                const isModExpanded = expandedModules[mod.id] ?? false;
                return (
                  <div key={mod.id} className="bg-surface border border-border rounded-xl overflow-hidden transition-all">
                    <button
                      onClick={() => toggleModule(mod.id)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-elevated/40 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-6 w-6 rounded-md bg-accent-primary/10 border border-accent-primary/20 text-accent-primary font-mono text-xs font-bold flex items-center justify-center">
                          {modIdx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-primary">{mod.title}</h4>
                          {mod.description && <p className="text-[11px] text-muted mt-0.5">{mod.description}</p>}
                        </div>
                      </div>
                      {isModExpanded ? <ChevronDown className="h-4 w-4 text-muted" /> : <ChevronRight className="h-4 w-4 text-muted" />}
                    </button>

                    {isModExpanded && (
                      <div className="p-4 pt-0 border-t border-border/40 space-y-3 bg-elevated/10">
                        {mod.subtopics.map((sub) => {
                          const isSubExpanded = expandedSubtopics[sub.id] ?? false;
                          return (
                            <div key={sub.id} className="border border-border/60 rounded-lg p-3 bg-surface/80">
                              <div
                                onClick={() => toggleSubtopic(sub.id)}
                                className="flex items-center justify-between cursor-pointer"
                              >
                                <div>
                                  <h5 className="text-xs font-semibold text-primary flex items-center gap-2">
                                    <span>{sub.title}</span>
                                    {sub.skillId && (
                                      <span className="text-[10px] font-mono text-accent-secondary bg-accent-secondary/10 px-1.5 py-0.5 rounded">
                                        Skill: {sub.skillId}
                                      </span>
                                    )}
                                  </h5>
                                  {sub.description && <p className="text-[11px] text-muted mt-0.5">{sub.description}</p>}
                                </div>
                                <span className="text-[10px] text-muted flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {sub.estimatedMinutes}m
                                </span>
                              </div>

                              {/* Resources under subtopic */}
                              {isSubExpanded && sub.resources?.length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-border/60 space-y-2">
                                  <span className="text-[10px] font-bold text-muted uppercase">Verified Resources:</span>
                                  {sub.resources.map((res) => (
                                    <a
                                      key={res.id}
                                      href={res.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="flex items-center justify-between p-2 rounded-md bg-elevated hover:bg-elevated/80 border border-border/60 transition-colors text-xs text-primary group"
                                    >
                                      <div>
                                        <div className="font-medium group-hover:text-accent-primary transition-colors">
                                          {res.title}
                                        </div>
                                        <div className="text-[10px] text-muted">{res.source} • {res.type}</div>
                                      </div>
                                      <ExternalLink className="h-3.5 w-3.5 text-muted group-hover:text-accent-primary transition-colors" />
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Prerequisites & Learning Outcomes */}
          <div className="space-y-4">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                Target Learning Outcomes
              </h4>
              <ul className="space-y-2 text-xs text-muted">
                {selectedCourse.learningOutcomes.map((outcome, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-state-success shrink-0 mt-0.5" />
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-surface border border-border rounded-xl p-5">
              <h4 className="text-xs font-bold text-primary uppercase tracking-wider mb-2.5">
                Course Prerequisites
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {selectedCourse.prerequisites.map((prereq, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] bg-elevated border border-border text-primary px-2.5 py-1 rounded-md"
                  >
                    {prereq}
                  </span>
                ))}
              </div>
            </div>

            {onNavigateToRoadmap && (
              <div className="p-4 bg-gradient-to-br from-elevated to-surface border border-accent-primary/20 rounded-xl">
                <h5 className="text-xs font-bold text-primary">Interactive Prerequisite Graph</h5>
                <p className="text-[11px] text-muted mt-1">
                  Visualize upstream prerequisite dependencies and unlock states in the interactive DAG visualizer.
                </p>
                <button
                  onClick={() => onNavigateToRoadmap(selectedCourse.domainSlug)}
                  className="mt-3 flex items-center gap-2 text-xs font-semibold text-accent-primary hover:underline"
                >
                  <span>Open Roadmap DAG View</span>
                  <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
