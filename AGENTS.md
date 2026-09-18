<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Diretrizes de Arquitetura, Clean Code e Documentação

## 1. Comentários e Documentação
- Blocos JSDoc completos em todas as funções, componentes, hooks, interfaces e types (com objetivos, `@param`, `@returns`, `@throws`).
- Comentários inline explicativos em regras de negócio, transformações e lógica assíncrona/complexa.
- Cabeçalho padronizado no topo de cada arquivo com:
  - Responsabilidade do módulo
  - Caminho recomendado no projeto

## 2. Organização e Imports
- Organização em blocos lógicos:
  1. Dependências e bibliotecas externas (React, Next.js, lucide-react, etc.)
  2. Componentes internos (`@/components/...`)
  3. Hooks, utilitários, libs e serviços (`@/hooks/...`, `@/lib/...`, `@/actions/...`)
  4. Tipos e interfaces (`@/types/...`)
- Uso estrito de path aliases `@/...`.
- Remoção total de imports não utilizados.

## 3. Integridade e Tipagem
- Preservação estrita das regras de negócio e fluxo existente.
- Tipagem estrita no TypeScript (sem uso de `any`).
- Código completo entregue sem omissões ou placeholders.

