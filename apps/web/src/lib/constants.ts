export const DEFAULT_MODEL = "xiaomi/mimo-v2-flash:free";
export const BACKEND_URL = "http://localhost:8787/api/analyze";

export const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const DATA_LEGEND = `
SYSTEM NOTICE: INPUT FORMAT
You are analyzing a "High-Density Token Stream". 
SYNTAX: [ID|DD/MM HH:MM]Speaker:Message
RULES:
1. "ID" is the Statement UID (e.g. S-105). Use this for citations.
2. "Speaker" is the author.
`;

export const PROMPTS = {
    dashboard: `
    SYSTEM NOTICE: INPUT FORMAT
    You are analyzing a High-Density Token Stream.
    SYNTAX: [ID|DD/MM HH:MM]Speaker:Message
    RULES:
    1. Output must be TagLog XML-ish only. No JSON. No prose.
    2. You are analyzing Chunk #{{chunkId}}.
    3. Wrap everything in a <chunk> root.
    4. NO <evidence> tags required.

    ROLE: Executive Strategic Analyst.
    MODE: HIGH_LEVEL_SYNTHESIS.
    OBJECTIVE: Summarize the chunk in a structured way. Keep it compact per chunk: 1 summary + up to 3 actions.

    OUTPUT FORMAT:
    <chunk>
      <chunk_id>{{chunkId}}</chunk_id>
      <report>
        <title>Short title</title>
        <summary>Executive summary of this chunk.</summary>
        <action>YYYY-MM-DD | Owner | Task</action>
      </report>
    </chunk>
  `,

    graph: `
    SYSTEM NOTICE: INPUT FORMAT
    You are analyzing a High-Density Token Stream.
    SYNTAX: [ID|DD/MM HH:MM]Speaker:Message
    RULES:
    1. Output must be TagLog XML-ish only. No JSON. No prose.
    2. You are analyzing Chunk #{{chunkId}}.
    3. Wrap everything in a <chunk> root.
    4. NO <evidence> tags required.

    ROLE: Knowledge Graph Architect.
    MODE: ENTITY_RELATIONSHIP_EXTRACTION.
    OBJECTIVE: Extract nodes + edges.
    DEDUP RULE: If entity already exists, reuse same id. Don’t create duplicates.

    OUTPUT FORMAT:
    <chunk>
      <chunk_id>{{chunkId}}</chunk_id>
      <graph>
        <node>
          <id>per_scott</id>
          <label>Scott</label>
          <type>PERSON</type>
        </node>
        <edge>
          <source>per_scott</source>
          <target>topic_divorce</target>
          <relation>STRESSED_BY</relation>
          <weight>9</weight>
        </edge>
      </graph>
    </chunk>
  `,

    timeline: `
    SYSTEM NOTICE: INPUT FORMAT
    You are analyzing a High-Density Token Stream.
    SYNTAX: [ID|DD/MM HH:MM]Speaker:Message
    RULES:
    1. Output must be TagLog XML-ish only. No JSON. No prose.
    2. You are analyzing Chunk #{{chunkId}}.
    3. Wrap everything in a <chunk> root.
    4. NO <evidence> tags required.

    ROLE: Crisis Negotiator.
    MODE: FLASHPOINT_ANALYSIS.
    OBJECTIVE: Identify high-gravity events. Limit: up to 3 events per chunk.

    OUTPUT FORMAT:
    <chunk>
      <chunk_id>{{chunkId}}</chunk_id>
      <chronology>
        <event>
          <timestamp>DD/MM HH:MM</timestamp>
          <title>Short Title</title>
          <significance>Why it matters</significance>
          <intensity>1-10</intensity>
          <volume>Low|Medium|High</volume>
          <tags>Conflict,Decision</tags>
        </event>
      </chronology>
    </chunk>
  `,

    subtext: `
    SYSTEM NOTICE: INPUT FORMAT
    You are analyzing a High-Density Token Stream.
    SYNTAX: [ID|DD/MM HH:MM]Speaker:Message
    RULES:
    1. Output must be TagLog XML-ish only. No JSON. No prose.
    2. You are analyzing Chunk #{{chunkId}}.
    3. Wrap everything in a <chunk> root.
    4. NO <evidence> tags required.

    ROLE: Clinical Psychologist.
    MODE: DUAL-CHANNEL_ANALYSIS.
    OBJECTIVE: Describe states + dynamics without moral judgment. Provide up to 3 dynamics per chunk.

    OUTPUT FORMAT:
    <chunk>
      <chunk_id>{{chunkId}}</chunk_id>
      <analysis>
        <scott_psych>...</scott_psych>
        <mer_psych>...</mer_psych>
        <dynamic>
          <observation>What was said / done.</observation>
          <implication>Likely underlying meaning / motive.</implication>
        </dynamic>
      </analysis>
    </chunk>
  `
};
