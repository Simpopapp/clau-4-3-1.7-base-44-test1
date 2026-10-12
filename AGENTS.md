<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Regras do projeto

- Estado do projeto, arquitetura e pendências vivem em `.opencode/AGENTS.md` (seção 6.0) e no roadmap `.opencode/roadmap-proj9.md`.
- Progresso (localStorage v6): derive caixa/due/strong de `state.questions` (snapshot), nunca do log de tentativas; versão futura do storage é somente-leitura; datas iteram por dia do calendário (`src/lib/dates.ts`), nunca com passo fixo de 24 h.
