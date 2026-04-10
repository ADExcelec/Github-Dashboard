import { useMemo, useState } from 'react';
import { createPrd } from '../services/prd';
import type { CreatePrdPayload, PrdRequirementInput, PrdStatus } from '../types/prd';
import '../styles/PrdForm.css';

const statuses: PrdStatus[] = ['Draft', 'Approved', 'In Progress', 'Done'];
const authors = [
  'Edilberto Ospino',
  'Juan Pablo Correa',
  'Luis Alejandro Rivas',
  'Juan Alvarez',
  'Diego Ulloa',
  'Juan Jose Medina',
  'Andres Felipe Diaz Monsalve',
  'Brahiam Rueda',
  'Jaer Palacios',
];

function initialRequirement(index: number): PrdRequirementInput {
  const rfNumber = String(index + 1).padStart(2, '0');
  return {
    rfId: `RF-${rfNumber}`,
    name: '',
    description: '',
    acceptanceCriteria: ['', ''],
    impactedRepositories: [''],
  };
}

function createRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function splitMultiline(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function PrdForm() {
  const [client, setClient] = useState('');
  const [project, setProject] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<PrdStatus>('Draft');
  const [version, setVersion] = useState(1);
  const [objective, setObjective] = useState('');
  const [scopeIncludes, setScopeIncludes] = useState('');
  const [scopeExcludes, setScopeExcludes] = useState('');
  const [requirements, setRequirements] = useState<PrdRequirementInput[]>([initialRequirement(0)]);
  const [performance, setPerformance] = useState('');
  const [security, setSecurity] = useState('');
  const [availability, setAvailability] = useState('');
  const [risks, setRisks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ prdId: string; path: string; commitUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      client.trim().length >= 2 &&
      project.trim().length >= 2 &&
      title.trim().length >= 5 &&
      authors.includes(author) &&
      objective.trim().length >= 10 &&
      splitMultiline(scopeIncludes).length >= 1 &&
      splitMultiline(scopeExcludes).length >= 1 &&
      requirements.length >= 1 &&
      requirements.every((rf) => rf.rfId.match(/^RF-[0-9]{2}$/) && rf.name.trim().length >= 3)
    );
  }, [author, client, objective, project, requirements, scopeExcludes, scopeIncludes, title]);

  function updateRequirement(index: number, changes: Partial<PrdRequirementInput>) {
    setRequirements((prev) => prev.map((item, idx) => (idx === index ? { ...item, ...changes } : item)));
  }

  function updateRequirementCriteria(index: number, value: string) {
    updateRequirement(index, { acceptanceCriteria: splitMultiline(value) });
  }

  function updateRequirementRepos(index: number, value: string) {
    updateRequirement(index, { impactedRepositories: splitMultiline(value) });
  }

  function addRequirement() {
    setRequirements((prev) => [...prev, initialRequirement(prev.length)]);
  }

  function removeRequirement(index: number) {
    setRequirements((prev) => prev.filter((_, idx) => idx !== index));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setError('Completa todos los campos obligatorios antes de crear el PRD.');
      return;
    }

    const payload: CreatePrdPayload = {
      requestId: createRequestId(),
      client: client.trim(),
      project: project.trim(),
      title: title.trim(),
      author: author.trim(),
      status,
      version,
      objective: objective.trim(),
      scope: {
        includes: splitMultiline(scopeIncludes),
        excludes: splitMultiline(scopeExcludes),
      },
      requirements: requirements.map((rf) => ({
        ...rf,
        rfId: rf.rfId.trim(),
        name: rf.name.trim(),
        description: rf.description.trim(),
        acceptanceCriteria: rf.acceptanceCriteria,
        impactedRepositories: rf.impactedRepositories,
      })),
      nonFunctional: {
        performance: performance.trim(),
        security: security.trim(),
        availability: availability.trim(),
      },
      risks: splitMultiline(risks),
    };

    setError(null);
    setResult(null);
    setIsSubmitting(true);

    try {
      const created = await createPrd(payload);
      setResult({ prdId: created.prdId, path: created.path, commitUrl: created.commitUrl });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Error inesperado al crear PRD');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="prd-page">
      <header className="prd-header">
        <h1>Crear PRD (Plantilla Cerrada)</h1>
        <p>Completa los campos definidos y publica el documento en product-docs.</p>
      </header>

      <section className="form-guide">
        <p>
          Todos los campos son obligatorios. En campos de lista, escribe un item por linea. En repositorios usa formato
          <strong> organizacion/repositorio</strong> y en RF ID usa formato <strong>RF-01</strong>.
        </p>
      </section>

      <form className="prd-form" onSubmit={onSubmit}>
        <section className="prd-section">
          <h2>Informacion general</h2>
          <div className="grid-two">
            <label>
              Cliente
              <input
                value={client}
                onChange={(e) => setClient(e.target.value)}
                required
                minLength={2}
                placeholder="Ej: Excelec Salud"
              />
              <span className="field-hint">Tipo texto, minimo 2 caracteres.</span>
            </label>
            <label>
              Proyecto
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                required
                minLength={2}
                placeholder="Ej: Portal de Autorizaciones"
              />
              <span className="field-hint">Tipo texto, minimo 2 caracteres.</span>
            </label>
            <label>
              Titulo
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                minLength={5}
                placeholder="Ej: Mejora del flujo de aprobaciones"
              />
              <span className="field-hint">Tipo texto, minimo 5 caracteres.</span>
            </label>
            <label>
              Autor
              <select value={author} onChange={(e) => setAuthor(e.target.value)} required>
                <option value="">Selecciona un desarrollador</option>
                {authors.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <span className="field-hint">Seleccion cerrada de desarrolladores permitidos.</span>
            </label>
            <label>
              Estado
              <select value={status} onChange={(e) => setStatus(e.target.value as PrdStatus)}>
                {statuses.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <span className="field-hint">Selecciona uno: Draft, Approved, In Progress, Done.</span>
            </label>
            <label>
              Version
              <input type="number" min={1} value={version} onChange={(e) => setVersion(Number(e.target.value))} />
              <span className="field-hint">Tipo numerico entero mayor que 0.</span>
            </label>
          </div>
        </section>

        <section className="prd-section">
          <h2>Objetivo y alcance</h2>
          <label>
            Objetivo
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              minLength={10}
              required
              rows={4}
              placeholder="Ej: Reducir tiempos de aprobacion y aumentar trazabilidad operativa"
            />
            <span className="field-hint">Tipo texto largo, minimo 10 caracteres.</span>
          </label>
          <div className="grid-two">
            <label>
              Incluye (una linea por item)
              <textarea
                value={scopeIncludes}
                onChange={(e) => setScopeIncludes(e.target.value)}
                rows={4}
                placeholder={"Validacion de documentos\nHistorial de decisiones"}
              />
              <span className="field-hint">Tipo lista de texto. Minimo 1 item.</span>
            </label>
            <label>
              No incluye (una linea por item)
              <textarea
                value={scopeExcludes}
                onChange={(e) => setScopeExcludes(e.target.value)}
                rows={4}
                placeholder={"Facturacion\nCambios en ERP"}
              />
              <span className="field-hint">Tipo lista de texto. Minimo 1 item.</span>
            </label>
          </div>
        </section>

        <section className="prd-section">
          <div className="section-head">
            <h2>Requerimientos funcionales</h2>
            <button type="button" onClick={addRequirement}>
              Agregar RF
            </button>
          </div>

          {requirements.map((requirement, index) => (
            <article className="rf-card" key={`${requirement.rfId}-${index}`}>
              <div className="rf-card-head">
                <h3>{requirement.rfId || `RF-${String(index + 1).padStart(2, '0')}`}</h3>
                {requirements.length > 1 ? (
                  <button type="button" onClick={() => removeRequirement(index)}>
                    Eliminar
                  </button>
                ) : null}
              </div>

              <div className="grid-two">
                <label>
                  RF ID (RF-01)
                  <input
                    value={requirement.rfId}
                    onChange={(e) => updateRequirement(index, { rfId: e.target.value.toUpperCase() })}
                    pattern="RF-[0-9]{2}"
                    required
                    placeholder="RF-01"
                  />
                  <span className="field-hint">Formato exacto RF-01, RF-02, RF-03.</span>
                </label>
                <label>
                  Nombre RF
                  <input
                    value={requirement.name}
                    onChange={(e) => updateRequirement(index, { name: e.target.value })}
                    required
                    minLength={3}
                    placeholder="Ej: Aprobar solicitud con observaciones"
                  />
                  <span className="field-hint">Tipo texto, minimo 3 caracteres.</span>
                </label>
              </div>

              <label>
                Descripcion
                <textarea
                  value={requirement.description}
                  onChange={(e) => updateRequirement(index, { description: e.target.value })}
                  minLength={10}
                  rows={3}
                  required
                  placeholder="Describe la funcionalidad esperada de forma clara"
                />
                <span className="field-hint">Tipo texto largo, minimo 10 caracteres.</span>
              </label>

              <div className="grid-two">
                <label>
                  Criterios de aceptacion (una linea por criterio)
                  <textarea
                    value={requirement.acceptanceCriteria.join('\n')}
                    onChange={(e) => updateRequirementCriteria(index, e.target.value)}
                    rows={3}
                    placeholder={"Debe guardar observacion\nDebe registrar usuario y fecha"}
                  />
                  <span className="field-hint">Tipo lista de texto. Minimo 1 item.</span>
                </label>
                <label>
                  Repos impactados (formato org/repo)
                  <textarea
                    value={requirement.impactedRepositories.join('\n')}
                    onChange={(e) => updateRequirementRepos(index, e.target.value)}
                    rows={3}
                    placeholder={"DesarrolloExcelec/api-autorizaciones\nDesarrolloExcelec/front-autorizaciones"}
                  />
                  <span className="field-hint">Formato exacto: organizacion/repositorio.</span>
                </label>
              </div>
            </article>
          ))}
        </section>

        <section className="prd-section">
          <h2>No funcionales y riesgos</h2>
          <div className="grid-two">
            <label>
              Performance
              <input
                value={performance}
                onChange={(e) => setPerformance(e.target.value)}
                required
                minLength={3}
                placeholder="Ej: Respuesta menor a 2 segundos"
              />
              <span className="field-hint">Tipo texto, minimo 3 caracteres.</span>
            </label>
            <label>
              Seguridad
              <input
                value={security}
                onChange={(e) => setSecurity(e.target.value)}
                required
                minLength={3}
                placeholder="Ej: Solo usuarios autenticados"
              />
              <span className="field-hint">Tipo texto, minimo 3 caracteres.</span>
            </label>
            <label>
              Disponibilidad
              <input
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                required
                minLength={3}
                placeholder="Ej: Disponibilidad 99.5 por ciento"
              />
              <span className="field-hint">Tipo texto, minimo 3 caracteres.</span>
            </label>
            <label>
              Riesgos (una linea por riesgo)
              <textarea
                value={risks}
                onChange={(e) => setRisks(e.target.value)}
                rows={3}
                placeholder={"Dependencia del backend legado\nDatos incompletos en migracion"}
              />
              <span className="field-hint">Tipo lista de texto. Minimo 1 item.</span>
            </label>
          </div>
        </section>

        <footer className="prd-actions">
          <button type="submit" disabled={isSubmitting || !canSubmit}>
            {isSubmitting ? 'Creando...' : 'Crear PRD'}
          </button>
          {!canSubmit ? (
            <p>Faltan campos obligatorios, formato RF invalido o autor no seleccionado de la lista.</p>
          ) : null}
        </footer>
      </form>

      {error ? <p className="prd-error">{error}</p> : null}
      {result ? (
        <section className="prd-result">
          <h2>PRD creado</h2>
          <p>ID: {result.prdId}</p>
          <p>Ruta: {result.path}</p>
          {result.commitUrl ? (
            <a href={result.commitUrl} target="_blank" rel="noreferrer">
              Ver commit en GitHub
            </a>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}
