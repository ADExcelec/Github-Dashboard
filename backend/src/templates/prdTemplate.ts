import type { CreatePrdRequest } from '../types/prd.js';

function renderList(items: string[]) {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderRequirements(requirements: CreatePrdRequest['requirements']) {
  return requirements
    .map((requirement) => {
      const criteria = requirement.acceptanceCriteria.map((item) => `- [ ] ${item}`).join('\n');
      const repos = renderList(requirement.impactedRepositories);

      return `### ${requirement.rfId} - ${requirement.name}\nDescripcion:\n${requirement.description}\n\nCriterios de aceptacion:\n${criteria}\n\nRepositorios impactados:\n${repos}\n\nIssue(s):\n- Pendiente de creacion`; 
    })
    .join('\n\n---\n\n');
}

export function renderPrdMarkdown(input: CreatePrdRequest & { prdId: string; createdAt: string }) {
  return `# ${input.prdId} - ${input.title}

---

## 1. Informacion General
- ID: ${input.prdId}
- Cliente: ${input.client}
- Proyecto: ${input.project}
- Fecha de creacion: ${input.createdAt}
- Autor: ${input.author}
- Estado: ${input.status}
- Version: ${input.version}

---

## 2. Objetivo
${input.objective}

---

## 3. Alcance

### Incluye
${renderList(input.scope.includes)}

### No incluye
${renderList(input.scope.excludes)}

---

## 4. Requerimientos Funcionales

${renderRequirements(input.requirements)}

---

## 5. Requerimientos No Funcionales
- Performance: ${input.nonFunctional.performance}
- Seguridad: ${input.nonFunctional.security}
- Disponibilidad: ${input.nonFunctional.availability}

---

## 6. Trazabilidad (ISO)

| RF | Issue | PR | Repo | Release | Estado |
|----|-------|----|------|---------|--------|
${input.requirements.map((requirement) => `| ${requirement.rfId} | Pendiente | Pendiente | Pendiente | Pendiente | ${input.status} |`).join('\n')}

---

## 7. Evidencia
- PRs:
  - Pendiente
- Screenshots:
  - Pendiente
- Logs:
  - Pendiente

---

## 8. Riesgos
${renderList(input.risks)}

---

## 9. Control de Cambios

| Fecha | Cambio | Autor |
|------|--------|-------|
| ${input.createdAt} | Creacion del PRD | ${input.author} |

---

## 10. Definicion de Terminado (DoD)
- [ ] Codigo implementado
- [ ] PR aprobado
- [ ] Tests ejecutados
- [ ] Issues cerrados
- [ ] Evidencia adjunta
- [ ] Deploy realizado
`;
}
