/**
 * Structural lint for contract/mobile-api.yaml: walks every schema object and
 * reports keys that are not JSON Schema 2020-12 / OpenAPI 3.1 keywords.
 * A stray key almost always means YAML split an unquoted flow-mapping value
 * at a comma (`{ description: a, b }` parses as `description: a` + `b: null`).
 */
const SCHEMA_KEYWORDS = new Set([
  // JSON Schema 2020-12 core + applicator + validation + metadata + format + content
  '$id', '$schema', '$ref', '$anchor', '$dynamicRef', '$dynamicAnchor', '$vocabulary', '$comment', '$defs',
  'allOf', 'anyOf', 'oneOf', 'not', 'if', 'then', 'else', 'dependentSchemas', 'prefixItems', 'items',
  'contains', 'properties', 'patternProperties', 'additionalProperties', 'propertyNames',
  'unevaluatedItems', 'unevaluatedProperties',
  'type', 'enum', 'const', 'multipleOf', 'maximum', 'exclusiveMaximum', 'minimum', 'exclusiveMinimum',
  'maxLength', 'minLength', 'pattern', 'maxItems', 'minItems', 'uniqueItems', 'maxContains', 'minContains',
  'maxProperties', 'minProperties', 'required', 'dependentRequired',
  'title', 'description', 'default', 'deprecated', 'readOnly', 'writeOnly', 'examples',
  'format', 'contentEncoding', 'contentMediaType', 'contentSchema',
  // OpenAPI 3.1 Schema Object fixed fields
  'discriminator', 'xml', 'externalDocs', 'example'
]);

const SCHEMA_MAPS = ['properties', 'patternProperties', '$defs', 'dependentSchemas'];
const SCHEMA_LISTS = ['allOf', 'anyOf', 'oneOf', 'prefixItems'];
const SCHEMA_SINGLES = [
  'items', 'additionalProperties', 'not', 'if', 'then', 'else', 'contains', 'propertyNames',
  'unevaluatedItems', 'unevaluatedProperties', 'contentSchema'
];

type Node = Record<string, unknown>;
const isObject = (v: unknown): v is Node => typeof v === 'object' && v !== null && !Array.isArray(v);

export type StrayKey = { path: string; key: string };

const walkSchema = (schema: unknown, path: string, out: StrayKey[]): void => {
  if (!isObject(schema)) return;
  for (const key of Object.keys(schema)) {
    if (!SCHEMA_KEYWORDS.has(key) && !key.startsWith('x-')) out.push({ path, key });
  }
  for (const k of SCHEMA_MAPS) {
    const map = schema[k];
    if (isObject(map)) for (const [name, sub] of Object.entries(map)) walkSchema(sub, `${path}.${k}.${name}`, out);
  }
  for (const k of SCHEMA_LISTS) {
    const list = schema[k];
    if (Array.isArray(list)) list.forEach((sub, i) => walkSchema(sub, `${path}.${k}[${i}]`, out));
  }
  for (const k of SCHEMA_SINGLES) walkSchema(schema[k], `${path}.${k}`, out);
};

/** Outside schemas, any `schema:` key (parameters, media types, headers) is a schema root. */
const walkDocument = (node: unknown, path: string, out: StrayKey[]): void => {
  if (Array.isArray(node)) {
    node.forEach((sub, i) => walkDocument(sub, `${path}[${i}]`, out));
    return;
  }
  if (!isObject(node)) return;
  for (const [key, value] of Object.entries(node)) {
    const here = path ? `${path}.${key}` : key;
    if (key === 'schema') walkSchema(value, here, out);
    else if (here === 'components.schemas' && isObject(value)) {
      for (const [name, sub] of Object.entries(value)) walkSchema(sub, `${here}.${name}`, out);
    } else walkDocument(value, here, out);
  }
};

export const findStrayKeys = (doc: unknown): StrayKey[] => {
  const out: StrayKey[] = [];
  walkDocument(doc, '', out);
  return out;
};
