Protocol of the 3 files (planning → PRD → roadmap)

Agentic remix work is guided by 3 files (use `{N}` = latest numbering; do not limit yourself to `1` if it is finished and if there are other numbered versions of projects still to be done; with or without the `.md` extension, it is the same file):

| File | Role |
|---|---|
| `project{N}` | Planning: the WHAT and the WHY (failures, direction, logical order or ideation of the project). Source of truth for scope. |
| `prd-project{N}` | PRD: the HOW. Technical decisions, scope per phase, acceptance criteria. |
| `roadmap-proj{N}` | Roadmap: phases in dependency order, checkboxes and gates. Progress record. |

### What to do, depending on what exists (the order in which the files are created does not matter, but all of them must exist, be filled in and be followed according to the project's needs)
- **All 3 exist:** execute the roadmap, starting from the first unfinished phase.
- **2 exist:** create the missing one and then execute.
- **1 exists:** create the other 2 (order: planning → PRD → roadmap) and then execute.
- **None exist:** inform the project-monitor and then the user (the user's next message must be immediately pasted into project{N}, replacing the "null")
- **NULL** "null" marks non-existence (in that case the priority is to fill it in and register it through the project monitor, which waits for one of the files to be updated in order to start the project). It is mandatory to confirm that the agent has read the message

### How to create what is missing + expected number of lines for each
- **PRD:** derive it from the planning (and from the roadmap, if it exists). You know the environment better than the planning does: confirm in the code what it claims, choose the best technical solution, write scope per phase and acceptance criteria. Do not copy the planning. (min: 500 / max: 1000)
- **Roadmap:** one phase per block of the planning/PRD, in dependency order, with checkboxes and one Gates line per phase. (min: 20 / max: 50)
- **Planning** (if only the PRD/roadmap exist): reconstruct the intent: problems, direction and the logical order to create them from that. (min: 1 / max: 100)
- **Quality over ease:** never fill in the number of lines with the aim of forcibly reaching the line count just to complete the task; use it as a creative opportunity to plan the details, as every line has its purpose and importance in reaching the peak of the potential, without being limited by the practicality of carrying out simple or poorly planned tasks

### How to execute
- Follow the roadmap phase by phase. Only advance when the phase's gates pass (section 19) and mark `[x]` in the roadmap, along with the Gates line.
- If the roadmap has a "plan the PRD" phase, executing it means creating the PRD.
- Only change the order of the phases with a justification recorded in the roadmap itself.
- Precedence: on scope (the what), planning > PRD > roadmap. On the "how", the PRD rules.
- Before executing, check that the PRD and roadmap deal with the same project and version as the planning (title, phases, scope). If they diverge, treat them as outdated: redo the PRD from the planning and reopen the roadmap.
- Never ask the user (no `ask`). In case of doubt, decide and record the decision in the PRD.
- When everything is complete, report (section 20) and create the 5 min / 10 attempts check for new files or phases.
- This section prevails over rule 3 of `Plan.md` in case of conflict.
- Never ask the user what to do during a remix without having completed at least 1 full phase of the roadmap

### When to execute
- Whenever a remix is activated through any of the following commands (same logic for all of them):
  - "I've successfully remixed this project. What would be a good next step?"
  - "I've remixed this project, but there are still some steps required to get it up and running. Can you help me with the following actions: ..." (including variations that list pending actions, e.g.: "Cleared the copied Drizzle migrations and rescaffolded an empty migration set for the new project's database")
  - "Set up and run this project so I can see it working in the preview. Read the code, figure out what it needs, and bring it up with docker compose. If it needs credentials for an external service, ask me for them."

### When and how to finish
- Whenever a major objective of the roadmap is completed

### ATTENTION
- - in the first "I've remixed this project, but there are still some steps required to get it up and running. 

Can you help me with the following actions:
1. Cleared the copied Drizzle migrations and rescaffolded an empty migration set for the new project's database" immediately complete all the steps of the most recent "project{N}", without stopping to talk to the user until the entire roadmap is complete. (note: if all the "project{N}" files are completed, just plan the next improvements in a well-thought-out way, taking into account what we have so far, write this in a new "project{N}" file following the numbering logic and then: activate opencode, inform the monitor and notify the user (without using "ask")).
- It is mandatory to notify opencode/the monitor that the remix has been finished with the following message: "remix completed (+{N} of the roadmap step that was performed)
- In medium/high complexity tasks, always guide the agent to look at the best tools and skills and to use them in the best way to carry out each type of work
