import type { SkillCategory } from "../schema";

export type ParsedSkill = {
  name: string;
  category: SkillCategory;
  confidenceRating: number;
  occurrences: number;
  inSkillsSection: boolean;
};

export type ResumeParseResult = {
  rawText: string;
  skills: ParsedSkill[];
};

const MAX_EXTRACTED_SKILLS = 30;

type TaxonomyEntry = {
  canonical: string;
  aliases: string[];
  category: "technical" | "tool" | "soft";
};

const skillTaxonomy: TaxonomyEntry[] = [
  { canonical: "JavaScript", aliases: ["javascript", "js", "ecmascript"], category: "technical" },
  { canonical: "TypeScript", aliases: ["typescript", "ts"], category: "technical" },
  { canonical: "Python", aliases: ["python", "py"], category: "technical" },
  { canonical: "Java", aliases: ["java"], category: "technical" },
  { canonical: "C++", aliases: ["c++", "cpp"], category: "technical" },
  { canonical: "C#", aliases: ["c#", "dotnet", ".net", "csharp"], category: "technical" },
  { canonical: "Go", aliases: ["golang"], category: "technical" },
  { canonical: "Rust", aliases: ["rust"], category: "technical" },
  { canonical: "PHP", aliases: ["php"], category: "technical" },
  { canonical: "Ruby", aliases: ["ruby", "ruby on rails", "rails"], category: "technical" },
  { canonical: "Swift", aliases: ["swift"], category: "technical" },
  { canonical: "Kotlin", aliases: ["kotlin"], category: "technical" },
  { canonical: "Dart", aliases: ["dart"], category: "technical" },
  { canonical: "Scala", aliases: ["scala"], category: "technical" },
  { canonical: "Elixir", aliases: ["elixir"], category: "technical" },
  { canonical: "Haskell", aliases: ["haskell"], category: "technical" },
  { canonical: "Bash", aliases: ["bash", "shell scripting", "zsh"], category: "technical" },
  { canonical: "SQL", aliases: ["sql", "tsql", "plsql"], category: "technical" },
  { canonical: "HTML", aliases: ["html", "html5"], category: "technical" },
  { canonical: "CSS", aliases: ["css", "css3", "scss", "sass", "less"], category: "technical" },
  { canonical: "React", aliases: ["react", "react.js", "reactjs"], category: "technical" },
  { canonical: "Next.js", aliases: ["next.js", "nextjs"], category: "technical" },
  { canonical: "Vue.js", aliases: ["vue", "vue.js", "vuejs"], category: "technical" },
  { canonical: "Nuxt", aliases: ["nuxt", "nuxt.js"], category: "technical" },
  { canonical: "Angular", aliases: ["angular"], category: "technical" },
  { canonical: "Svelte", aliases: ["svelte", "sveltekit"], category: "technical" },
  { canonical: "Redux", aliases: ["redux", "redux toolkit"], category: "technical" },
  { canonical: "Tailwind CSS", aliases: ["tailwind", "tailwindcss"], category: "technical" },
  { canonical: "Node.js", aliases: ["node.js", "nodejs"], category: "technical" },
  { canonical: "Express", aliases: ["express", "express.js"], category: "technical" },
  { canonical: "NestJS", aliases: ["nestjs", "nest.js"], category: "technical" },
  { canonical: "Fastify", aliases: ["fastify"], category: "technical" },
  { canonical: "Django", aliases: ["django"], category: "technical" },
  { canonical: "Flask", aliases: ["flask"], category: "technical" },
  { canonical: "FastAPI", aliases: ["fastapi"], category: "technical" },
  { canonical: "Spring Boot", aliases: ["spring boot", "springboot"], category: "technical" },
  { canonical: "ASP.NET Core", aliases: ["asp.net core", "aspnet core"], category: "technical" },
  { canonical: "GraphQL", aliases: ["graphql", "apollo"], category: "technical" },
  { canonical: "REST APIs", aliases: ["rest api", "restful", "rest apis"], category: "technical" },
  { canonical: "gRPC", aliases: ["grpc"], category: "technical" },
  { canonical: "PostgreSQL", aliases: ["postgres", "postgresql"], category: "technical" },
  { canonical: "MySQL", aliases: ["mysql"], category: "technical" },
  { canonical: "MongoDB", aliases: ["mongodb"], category: "technical" },
  { canonical: "Redis", aliases: ["redis"], category: "technical" },
  { canonical: "Elasticsearch", aliases: ["elasticsearch", "elastic search"], category: "technical" },
  { canonical: "Prisma", aliases: ["prisma"], category: "technical" },
  { canonical: "Docker", aliases: ["docker"], category: "tool" },
  { canonical: "Kubernetes", aliases: ["kubernetes", "k8s"], category: "tool" },
  { canonical: "Terraform", aliases: ["terraform"], category: "tool" },
  { canonical: "Ansible", aliases: ["ansible"], category: "tool" },
  { canonical: "Jenkins", aliases: ["jenkins"], category: "tool" },
  { canonical: "GitHub Actions", aliases: ["github actions"], category: "tool" },
  { canonical: "GitLab CI", aliases: ["gitlab ci"], category: "tool" },
  { canonical: "CircleCI", aliases: ["circleci"], category: "tool" },
  { canonical: "AWS", aliases: ["aws", "amazon web services"], category: "tool" },
  { canonical: "Google Cloud", aliases: ["gcp", "google cloud"], category: "tool" },
  { canonical: "Azure", aliases: ["azure", "microsoft azure"], category: "tool" },
  { canonical: "Vercel", aliases: ["vercel"], category: "tool" },
  { canonical: "Netlify", aliases: ["netlify"], category: "tool" },
  { canonical: "Linux", aliases: ["linux", "ubuntu", "debian"], category: "tool" },
  { canonical: "Git", aliases: ["git"], category: "tool" },
  { canonical: "GitHub", aliases: ["github"], category: "tool" },
  { canonical: "GitLab", aliases: ["gitlab"], category: "tool" },
  { canonical: "Jira", aliases: ["jira"], category: "tool" },
  { canonical: "Postman", aliases: ["postman"], category: "tool" },
  { canonical: "Figma", aliases: ["figma"], category: "tool" },
  { canonical: "Data Structures", aliases: ["data structures", "algorithms", "dsa"], category: "technical" },
  { canonical: "System Design", aliases: ["system design", "distributed systems"], category: "technical" },
  { canonical: "Microservices", aliases: ["microservices", "microservice"], category: "technical" },
  { canonical: "CI/CD", aliases: ["ci/cd", "continuous integration", "continuous delivery"], category: "technical" },
  { canonical: "Unit Testing", aliases: ["unit testing"], category: "technical" },
  { canonical: "E2E Testing", aliases: ["cypress", "playwright", "e2e testing"], category: "technical" },
  { canonical: "Jest", aliases: ["jest"], category: "tool" },
  { canonical: "Vitest", aliases: ["vitest"], category: "tool" },
  { canonical: "Mocha", aliases: ["mocha"], category: "tool" },
  { canonical: "Vite", aliases: ["vite"], category: "tool" },
  { canonical: "Webpack", aliases: ["webpack"], category: "tool" },
  { canonical: "Babel", aliases: ["babel"], category: "tool" },
  { canonical: "pnpm", aliases: ["pnpm"], category: "tool" },
  { canonical: "Yarn", aliases: ["yarn"], category: "tool" },
  { canonical: "npm", aliases: ["npm"], category: "tool" },
  { canonical: "TurboRepo", aliases: ["turborepo"], category: "tool" },
  { canonical: "Storybook", aliases: ["storybook"], category: "tool" },
  { canonical: "Material UI", aliases: ["material ui", "mui"], category: "technical" },
  { canonical: "Chakra UI", aliases: ["chakra ui"], category: "technical" },
  { canonical: "Bootstrap", aliases: ["bootstrap"], category: "technical" },
  { canonical: "Framer Motion", aliases: ["framer motion"], category: "technical" },
  { canonical: "Three.js", aliases: ["three.js", "threejs"], category: "technical" },
  { canonical: "React Native", aliases: ["react native"], category: "technical" },
  { canonical: "Flutter", aliases: ["flutter"], category: "technical" },
  { canonical: "Android", aliases: ["android"], category: "technical" },
  { canonical: "iOS", aliases: ["ios"], category: "technical" },
  { canonical: "Xcode", aliases: ["xcode"], category: "tool" },
  { canonical: "Kafka", aliases: ["kafka", "apache kafka"], category: "technical" },
  { canonical: "RabbitMQ", aliases: ["rabbitmq"], category: "technical" },
  { canonical: "WebSockets", aliases: ["websocket", "websockets", "socket.io"], category: "technical" },
  { canonical: "Serverless", aliases: ["serverless", "aws lambda"], category: "technical" },
  { canonical: "Prometheus", aliases: ["prometheus"], category: "tool" },
  { canonical: "Grafana", aliases: ["grafana"], category: "tool" },
  { canonical: "Datadog", aliases: ["datadog"], category: "tool" },
  { canonical: "Sentry", aliases: ["sentry"], category: "tool" },
  { canonical: "Snowflake", aliases: ["snowflake"], category: "technical" },
  { canonical: "BigQuery", aliases: ["bigquery"], category: "technical" },
  { canonical: "Redshift", aliases: ["redshift"], category: "technical" },
  { canonical: "Databricks", aliases: ["databricks"], category: "technical" },
  { canonical: "Airflow", aliases: ["airflow"], category: "tool" },
  { canonical: "dbt", aliases: ["dbt"], category: "tool" },
  { canonical: "Pandas", aliases: ["pandas"], category: "technical" },
  { canonical: "NumPy", aliases: ["numpy"], category: "technical" },
  { canonical: "Scikit-learn", aliases: ["scikit-learn", "sklearn"], category: "technical" },
  { canonical: "TensorFlow", aliases: ["tensorflow"], category: "technical" },
  { canonical: "PyTorch", aliases: ["pytorch"], category: "technical" },
  { canonical: "OpenCV", aliases: ["opencv"], category: "technical" },
  { canonical: "LLMs", aliases: ["llm", "large language model", "transformer"], category: "technical" },
  { canonical: "LangChain", aliases: ["langchain"], category: "technical" },
  { canonical: "RAG", aliases: ["retrieval augmented generation"], category: "technical" },
  { canonical: "Vector Databases", aliases: ["pinecone", "weaviate", "qdrant", "vector database"], category: "technical" },
  { canonical: "NLP", aliases: ["nlp", "natural language processing"], category: "technical" },
  { canonical: "Data Analysis", aliases: ["data analysis", "analytics"], category: "technical" },
  { canonical: "A/B Testing", aliases: ["a/b testing", "ab testing"], category: "technical" },
  { canonical: "ETL", aliases: ["etl", "elt", "data pipeline"], category: "technical" },
  { canonical: "Tableau", aliases: ["tableau"], category: "tool" },
  { canonical: "Power BI", aliases: ["power bi"], category: "tool" },
  { canonical: "Looker", aliases: ["looker"], category: "tool" },
  { canonical: "Supabase", aliases: ["supabase"], category: "technical" },
  { canonical: "Firebase", aliases: ["firebase"], category: "technical" },
  { canonical: "Auth0", aliases: ["auth0"], category: "technical" },
  { canonical: "OAuth", aliases: ["oauth", "openid connect", "oidc"], category: "technical" },
  { canonical: "JWT", aliases: ["jwt", "json web token"], category: "technical" },
  { canonical: "Cybersecurity", aliases: ["cybersecurity", "application security"], category: "technical" },
  { canonical: "Cryptography", aliases: ["cryptography", "encryption"], category: "technical" },
  { canonical: "Nginx", aliases: ["nginx"], category: "tool" },
  { canonical: "Domain-Driven Design", aliases: ["domain driven design", "ddd"], category: "technical" },
  { canonical: "TDD", aliases: ["tdd", "test driven development"], category: "technical" },
  { canonical: "Agile", aliases: ["agile", "scrum", "kanban"], category: "technical" },
  { canonical: "Machine Learning", aliases: ["machine learning"], category: "technical" },
  { canonical: "Deep Learning", aliases: ["deep learning"], category: "technical" },
  { canonical: "MLOps", aliases: ["mlops"], category: "technical" },
  { canonical: "Jupyter", aliases: ["jupyter", "jupyter notebook"], category: "tool" },
  { canonical: "Hugging Face", aliases: ["hugging face"], category: "technical" },
  { canonical: "Spark", aliases: ["apache spark"], category: "technical" },
  { canonical: "Hadoop", aliases: ["hadoop"], category: "technical" },
  { canonical: "DynamoDB", aliases: ["dynamodb"], category: "technical" },
  { canonical: "Cassandra", aliases: ["cassandra"], category: "technical" },
  { canonical: "ClickHouse", aliases: ["clickhouse"], category: "technical" },
  { canonical: "S3", aliases: ["amazon s3"], category: "technical" },
  { canonical: "Lambda", aliases: ["aws lambda functions"], category: "technical" },
  { canonical: "WebAssembly", aliases: ["webassembly", "wasm"], category: "technical" },
  { canonical: "Blockchain", aliases: ["blockchain", "web3"], category: "technical" },
  { canonical: "Solidity", aliases: ["solidity"], category: "technical" },
  { canonical: "SRE", aliases: ["site reliability engineering"], category: "technical" },
  { canonical: "Observability", aliases: ["observability"], category: "technical" },
  { canonical: "Tracing", aliases: ["distributed tracing"], category: "technical" },
  { canonical: "Performance Optimization", aliases: ["performance tuning", "performance optimization"], category: "technical" },
  { canonical: "Accessibility", aliases: ["accessibility", "a11y"], category: "technical" },
  { canonical: "Internationalization", aliases: ["internationalization", "i18n"], category: "technical" },
  { canonical: "SSR", aliases: ["server-side rendering", "ssr"], category: "technical" },
  { canonical: "tRPC", aliases: ["trpc"], category: "technical" },
  { canonical: "Zod", aliases: ["zod"], category: "technical" },
  { canonical: "OpenAPI", aliases: ["openapi", "swagger"], category: "technical" },
  { canonical: "Protocol Buffers", aliases: ["protobuf", "protocol buffers"], category: "technical" },
  { canonical: "Caching", aliases: ["caching", "cache invalidation"], category: "technical" },
  { canonical: "Rate Limiting", aliases: ["rate limiting"], category: "technical" },
  { canonical: "Mentoring", aliases: ["mentoring", "technical mentorship"], category: "soft" },
  { canonical: "Technical Leadership", aliases: ["technical leadership"], category: "soft" },
  { canonical: "Stakeholder Management", aliases: ["stakeholder management"], category: "soft" },
  { canonical: "Communication", aliases: ["communication skills"], category: "soft" },
  { canonical: "Product Thinking", aliases: ["product thinking", "product mindset"], category: "soft" },
];

function escapeForRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}

// Word-ish boundaries that still allow tech punctuation like c++, c#, ci/cd, .net
const BOUNDARY = "[^a-z0-9+#-]";

function countOccurrences(haystack: string, term: string): number {
  const trimmed = term.trim();
  if (!trimmed) {
    return 0;
  }
  const pattern = new RegExp(`(?:^|${BOUNDARY})${escapeForRegex(trimmed)}(?=${BOUNDARY}|$)`, "gi");
  let count = 0;
  while (pattern.exec(haystack) !== null) {
    count += 1;
  }
  return count;
}

const GENERIC_SECTION_HEADERS = [
  "experience",
  "work experience",
  "professional experience",
  "employment",
  "employment history",
  "education",
  "projects",
  "personal projects",
  "summary",
  "profile",
  "about",
  "objective",
  "certifications",
  "certificates",
  "awards",
  "achievements",
  "interests",
  "hobbies",
  "contact",
  "references",
  "publications",
  "volunteer",
  "languages",
  "activities",
];

const SKILLS_HEADER_RE =
  /^\s*(technical skills|core skills|key skills|skills? *(?:& *tools)?|technologies|tech stack|tooling|core competencies|competencies|technical proficiencies|proficiencies)\s*:?\s*(.*)$/i;

const GENERIC_HEADER_RE = new RegExp(
  `^\\s*(${GENERIC_SECTION_HEADERS.map(escapeForRegex).join("|")})\\s*:?\\s*$`,
  "i",
);

/**
 * Isolates the text inside a resume's "Skills" / "Technologies" section so
 * skills listed there can be weighted more heavily than incidental mentions.
 * Handles both block headers and inline "Skills: a, b, c" formats.
 */
function findSkillsRegion(text: string): string {
  const lines = text.split("\n");
  const collected: string[] = [];
  let capturing = false;

  for (const line of lines) {
    const headerMatch = line.match(SKILLS_HEADER_RE);

    if (headerMatch) {
      capturing = true;
      const inlineRemainder = headerMatch[2]?.trim();
      if (inlineRemainder) {
        collected.push(inlineRemainder);
      }
      continue;
    }

    if (capturing) {
      // Stop when we hit the next recognizable section heading.
      if (GENERIC_HEADER_RE.test(line) || SKILLS_HEADER_RE.test(line)) {
        capturing = false;
        continue;
      }
      collected.push(line);
    }
  }

  return collected.join("\n");
}

/**
 * Turns raw signal (mentions + whether the term sits in a dedicated skills
 * section) into a 1-5 confidence rating. A skill explicitly declared in a
 * "Skills" section, or mentioned 3+ times, is treated as a core/main skill.
 */
function scoreToConfidence(occurrences: number, inSkillsSection: boolean): number {
  if (inSkillsSection || occurrences >= 3) {
    return 5;
  }
  if (occurrences === 2) {
    return 4;
  }
  return 3;
}

function extractSkills(rawText: string): ParsedSkill[] {
  const haystack = ` ${rawText} `;
  const skillsRegion = ` ${findSkillsRegion(rawText)} `;

  const scored: ParsedSkill[] = [];

  for (const entry of skillTaxonomy) {
    let occurrences = 0;
    let inSkillsSection = false;

    for (const alias of entry.aliases) {
      occurrences += countOccurrences(haystack, alias);
      if (!inSkillsSection && countOccurrences(skillsRegion, alias) > 0) {
        inSkillsSection = true;
      }
    }

    if (occurrences === 0) {
      continue;
    }

    scored.push({
      name: entry.canonical,
      category: entry.category as SkillCategory,
      confidenceRating: scoreToConfidence(occurrences, inSkillsSection),
      occurrences,
      inSkillsSection,
    });
  }

  // Rank: skills-section hits first, then by mentions, then by confidence.
  scored.sort((a, b) => {
    if (a.inSkillsSection !== b.inSkillsSection) {
      return a.inSkillsSection ? -1 : 1;
    }
    if (b.occurrences !== a.occurrences) {
      return b.occurrences - a.occurrences;
    }
    return b.confidenceRating - a.confidenceRating;
  });

  return scored.slice(0, MAX_EXTRACTED_SKILLS);
}

export function parseResumeText(rawText: string): ResumeParseResult {
  return {
    rawText,
    skills: extractSkills(rawText),
  };
}
