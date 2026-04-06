import { useEffect, useMemo, useState } from 'react';
import { getOrganizationProjectsDashboard } from '../services/github';
import type { DashboardData, ProjectDashboard } from '../types/github';
import '../styles/ProjectsList.css';

const REFRESH_INTERVAL_MS = 60_000;
const CAROUSEL_INTERVAL_MS = 18_000;

function getCarouselLayout() {
  if (typeof window === 'undefined') {
    return { columns: 2, projectsPerSlide: 4 };
  }

  const width = window.innerWidth;

  if (width >= 2200) {
    return { columns: 3, projectsPerSlide: 6 };
  }

  if (width >= 1400) {
    return { columns: 2, projectsPerSlide: 4 };
  }

  if (width >= 900) {
    return { columns: 2, projectsPerSlide: 2 };
  }

  return { columns: 1, projectsPerSlide: 1 };
}

function formatClock(dateIso: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(dateIso));
}

function formatDueDate(date?: string): string {
  if (!date) {
    return 'Sin fecha';
  }

  return new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function getDueDateTone(date?: string): 'is-urgent' | 'is-soon' | 'is-planned' | 'is-undated' {
  if (!date) {
    return 'is-undated';
  }

  const today = new Date();
  const dueDate = new Date(date);
  const diffInDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 3) {
    return 'is-urgent';
  }

  if (diffInDays <= 10) {
    return 'is-soon';
  }

  return 'is-planned';
}

function projectCardClass(project: ProjectDashboard): string {
  if (project.closed) {
    return 'project-card is-closed';
  }

  const firstMilestone = project.milestones[0];
  if (!firstMilestone) {
    return 'project-card is-mid';
  }

  if (firstMilestone.completionRate >= 80) {
    return 'project-card is-strong';
  }

  if (firstMilestone.completionRate >= 50) {
    return 'project-card is-mid';
  }

  return 'project-card is-early';
}

export function ProjectsList() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [layout, setLayout] = useState(getCarouselLayout);

  async function fetchDashboard() {
    try {
      setError(null);
      const dashboardData = await getOrganizationProjectsDashboard();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible cargar el dashboard');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboard();

    const timer = window.setInterval(() => {
      fetchDashboard();
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    function handleResize() {
      setLayout(getCarouselLayout());
    }

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const sortedProjects = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.projects].sort((a, b) => {
      if (a.closed !== b.closed) {
        return Number(a.closed) - Number(b.closed);
      }

      const aDate = a.milestones[0]?.dueDate;
      const bDate = b.milestones[0]?.dueDate;
      if (aDate && bDate) {
        const byDate = new Date(aDate).getTime() - new Date(bDate).getTime();
        if (byDate !== 0) {
          return byDate;
        }
      }
      if (aDate && !bDate) {
        return -1;
      }
      if (!aDate && bDate) {
        return 1;
      }

      return b.totalItems - a.totalItems;
    });
  }, [data]);

  const slides = useMemo(() => {
    const grouped: ProjectDashboard[][] = [];

    for (let index = 0; index < sortedProjects.length; index += layout.projectsPerSlide) {
      grouped.push(sortedProjects.slice(index, index + layout.projectsPerSlide));
    }

    return grouped;
  }, [layout.projectsPerSlide, sortedProjects]);

  useEffect(() => {
    if (slides.length <= 1) {
      setCurrentSlide(0);
      return;
    }

    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, CAROUSEL_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, [slides]);

  const visibleProjects = slides[currentSlide] || [];

  if (loading) {
    return (
      <main className="tv-dashboard tv-dashboard-loading">
        <h1>Cargando dashboard comercial...</h1>
      </main>
    );
  }

  if (error) {
    return (
      <main className="tv-dashboard tv-dashboard-error">
        <h1>Error de conexion con GitHub GraphQL</h1>
        <p>{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="tv-dashboard tv-dashboard-error">
        <h1>Sin datos para mostrar</h1>
      </main>
    );
  }

  return (
    <main className="tv-dashboard">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Monitoreo comercial en vivo</p>
          <h1>Projects Dashboard - {data.organization}</h1>
        </div>
        <div className="header-meta">
          <p>Actualizacion cada 60s</p>
          <p>Ultima carga: {formatClock(data.generatedAt)}</p>
        </div>
      </header>

      <section className="list-meta" aria-label="Resumen de lista">
        <p>
          {sortedProjects.length} proyectos con milestones visibles | slide {slides.length === 0 ? 0 : currentSlide + 1} de {slides.length} | {visibleProjects.length} proyectos en esta vista | auto-actualiza cada 60s
        </p>
      </section>

      <section className={`projects-grid columns-${layout.columns}`} aria-label="Estado por proyecto">
        {visibleProjects.map((project) => (
          <article key={project.id} className={projectCardClass(project)}>
            <div className="project-top">
              <div className="project-heading">
                <h2>{project.title}</h2>
                {project.shortDescription ? <p className="project-description">{project.shortDescription}</p> : null}
              </div>
              <div className="project-side">
                <span className={`project-pill ${project.closed ? 'closed' : 'open'}`}>
                  {project.closed ? 'Cerrado' : 'Activo'}
                </span>
                <span className="project-count">{project.milestones.length} milestones</span>
              </div>
            </div>

            <div className="milestone-list" aria-label="Milestones por proyecto">
              {project.milestones.map((milestone) => (
                <div key={`${project.id}-${milestone.title}`} className="milestone-row">
                  <div className="milestone-main">
                    <div className="milestone-copy">
                      <p className="milestone-subtitle">{milestone.title}</p>
                      <div className="milestone-metrics">
                        <span>{milestone.doneItems} done</span>
                        <span>{milestone.inProgressItems} in progress</span>
                        <span>{milestone.todoItems} todo</span>
                        <span>{milestone.totalItems} total</span>
                      </div>
                    </div>
                    <div className={`milestone-date-badge ${getDueDateTone(milestone.dueDate)}`}>
                      <span className="milestone-date-label">Entrega</span>
                      <strong>{formatDueDate(milestone.dueDate)}</strong>
                    </div>
                  </div>

                  <div className="milestone-progress-line">
                    <div className="mini-progress-track" role="img" aria-label={`Milestone ${milestone.title} ${milestone.completionRate}%`}>
                      <div className="mini-progress-fill" style={{ width: `${milestone.completionRate}%` }} />
                    </div>
                    <p className="milestone-percent">{milestone.completionRate}% completado</p>
                  </div>
                </div>
              ))}
            </div>

            <footer className="project-footer">
              <span>#{project.number}</span>
              <a
                href={`https://github.com/orgs/${data.organization}/projects/${project.number}`}
                target="_blank"
                rel="noreferrer"
              >
                Abrir en GitHub
              </a>
            </footer>
          </article>
        ))}
      </section>

      {slides.length > 1 ? (
        <section className="carousel-dots" aria-label="Indicadores de carrusel">
          {slides.map((_, index) => (
            <button
              key={`dot-${index}`}
              type="button"
              className={index === currentSlide ? 'dot active' : 'dot'}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Ir a la vista ${index + 1}`}
            />
          ))}
        </section>
      ) : null}
    </main>
  );
}
