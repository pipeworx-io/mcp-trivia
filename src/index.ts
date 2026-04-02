/**
 * Trivia MCP — wraps Open Trivia Database (free, no auth)
 *
 * Tools:
 * - get_questions: Fetch trivia questions with optional filters
 * - list_categories: List all available trivia categories
 * - get_category_stats: Get question counts for a specific category
 */

interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
}

const BASE_URL = 'https://opentdb.com';

type RawQuestion = {
  category: string;
  type: string;
  difficulty: string;
  question: string;
  correct_answer: string;
  incorrect_answers: string[];
};

type RawQuestionsResponse = {
  response_code: number;
  results: RawQuestion[];
};

type RawCategory = {
  id: number;
  name: string;
};

type RawCategoriesResponse = {
  trivia_categories: RawCategory[];
};

type RawCategoryCountResponse = {
  category_id: number;
  category_question_count: {
    total_question_count: number;
    total_easy_question_count: number;
    total_medium_question_count: number;
    total_hard_question_count: number;
  };
};

// HTML entity map for decoding encoded question text from the API
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#039;': "'",
  '&apos;': "'",
  '&ndash;': '\u2013',
  '&mdash;': '\u2014',
  '&laquo;': '\u00ab',
  '&raquo;': '\u00bb',
  '&ldquo;': '\u201c',
  '&rdquo;': '\u201d',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&hellip;': '\u2026',
  '&deg;': '\u00b0',
  '&eacute;': '\u00e9',
  '&egrave;': '\u00e8',
  '&ecirc;': '\u00ea',
  '&agrave;': '\u00e0',
  '&aacute;': '\u00e1',
  '&ocirc;': '\u00f4',
  '&ouml;': '\u00f6',
  '&uuml;': '\u00fc',
  '&ccedil;': '\u00e7',
  '&ntilde;': '\u00f1',
};

function decodeHtml(text: string): string {
  return text
    .replace(/&[a-zA-Z0-9#]+;/g, (entity) => {
      if (entity in HTML_ENTITIES) return HTML_ENTITIES[entity]!;
      // numeric entities: &#NNN; or &#xHHH;
      const numMatch = entity.match(/^&#(\d+);$/);
      if (numMatch) return String.fromCharCode(parseInt(numMatch[1]!, 10));
      const hexMatch = entity.match(/^&#x([0-9a-fA-F]+);$/);
      if (hexMatch) return String.fromCharCode(parseInt(hexMatch[1]!, 16));
      return entity;
    });
}

const RESPONSE_CODE_MESSAGES: Record<number, string> = {
  1: 'No results: not enough questions for the requested parameters',
  2: 'Invalid parameter in request',
  3: 'Session token not found',
  4: 'Session token empty: all questions for this token have been used',
  5: 'Rate limit exceeded: too many requests, please wait 5 seconds',
};

const tools: McpToolExport['tools'] = [
  {
    name: 'get_questions',
    description:
      'Get trivia questions from the Open Trivia Database. Optionally filter by category, difficulty, and question type.',
    inputSchema: {
      type: 'object',
      properties: {
        amount: {
          type: 'number',
          description: 'Number of questions to return. Defaults to 10. Max 50.',
        },
        category: {
          type: 'number',
          description:
            'Category ID to filter by. Use list_categories to get available IDs.',
        },
        difficulty: {
          type: 'string',
          description: 'Difficulty level. One of: easy, medium, hard.',
        },
        type: {
          type: 'string',
          description:
            'Question type. One of: multiple (multiple choice), boolean (true/false).',
        },
      },
    },
  },
  {
    name: 'list_categories',
    description: 'List all available trivia categories and their IDs.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'get_category_stats',
    description:
      'Get the total and per-difficulty question counts for a specific category.',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'number',
          description: 'Category ID. Use list_categories to get available IDs.',
        },
      },
      required: ['category'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  switch (name) {
    case 'get_questions':
      return getQuestions(
        (args.amount as number | undefined) ?? 10,
        args.category as number | undefined,
        args.difficulty as string | undefined,
        args.type as string | undefined,
      );
    case 'list_categories':
      return listCategories();
    case 'get_category_stats':
      return getCategoryStats(args.category as number);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

async function getQuestions(
  amount: number,
  category: number | undefined,
  difficulty: string | undefined,
  type: string | undefined,
) {
  const params = new URLSearchParams({ amount: String(amount) });
  if (category !== undefined) params.set('category', String(category));
  if (difficulty) params.set('difficulty', difficulty);
  if (type) params.set('type', type);

  const res = await fetch(`${BASE_URL}/api.php?${params.toString()}`);
  if (!res.ok) throw new Error(`Open Trivia DB error: ${res.status}`);

  const data = (await res.json()) as RawQuestionsResponse;
  if (data.response_code !== 0) {
    const msg = RESPONSE_CODE_MESSAGES[data.response_code] ?? `Response code ${data.response_code}`;
    throw new Error(`Open Trivia DB error: ${msg}`);
  }

  return {
    count: data.results.length,
    questions: data.results.map((q) => ({
      category: decodeHtml(q.category),
      difficulty: q.difficulty,
      type: q.type,
      question: decodeHtml(q.question),
      correct_answer: decodeHtml(q.correct_answer),
      incorrect_answers: q.incorrect_answers.map(decodeHtml),
    })),
  };
}

async function listCategories() {
  const res = await fetch(`${BASE_URL}/api_category.php`);
  if (!res.ok) throw new Error(`Open Trivia DB error: ${res.status}`);

  const data = (await res.json()) as RawCategoriesResponse;

  return {
    count: data.trivia_categories.length,
    categories: data.trivia_categories.map((c) => ({
      id: c.id,
      name: c.name,
    })),
  };
}

async function getCategoryStats(category: number) {
  const res = await fetch(`${BASE_URL}/api_count.php?category=${category}`);
  if (!res.ok) throw new Error(`Open Trivia DB error: ${res.status}`);

  const data = (await res.json()) as RawCategoryCountResponse;
  const counts = data.category_question_count;

  return {
    category_id: data.category_id,
    total: counts.total_question_count,
    easy: counts.total_easy_question_count,
    medium: counts.total_medium_question_count,
    hard: counts.total_hard_question_count,
  };
}

export default { tools, callTool } satisfies McpToolExport;
