# byteowlz JSON Schemas

Central repository for JSON schemas used across the byteowlz ecosystem.

## Overview

This repository contains JSON schemas that ensure consistency and validation across multiple projects:

- **Extraction schemas**: For xtr-py and xtrs data extraction
- **Business schemas**: For based business management
- **Memory schemas**: For mmry memory storage
- **Search schemas**: For sx search results

## Directory Structure

```
schemas/
├── extraction/          # Data extraction schemas (xtr-py, xtrs)
│   ├── contact_details.json
│   ├── event.json
│   ├── invoice.json
│   └── ... (10 schemas total)
│
├── business/           # Business entity schemas (based)
│   ├── contact_import.json
│   ├── party.json
│   ├── document.json
│   ├── product.json
│   └── payment.json
│
├── memory/             # Memory storage schemas (mmry)
│   └── memory.json
│
└── search/             # Search result schemas (sx)
    └── search_result.json
```

## Using These Schemas

### In Your Project

Each project can sync schemas using a sync script. Example:

```bash
#!/usr/bin/env bash
SCHEMA_REPO_URL="https://raw.githubusercontent.com/byteowlz/schemas/main"

# Fetch a specific schema
curl -sf "$SCHEMA_REPO_URL/extraction/contact_details.json" -o schemas/contact_details.json
```

## Schema Format

All schemas follow JSON Schema Draft 07 specification:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema Name",
  "description": "Clear description of what this schema represents",
  "type": "object",
  "properties": {
    "field_name": {
      "type": "string",
      "description": "Field description"
    }
  },
  "required": ["field_name"]
}
```

## Contributing

### Adding a New Schema

1. Create the schema file in the appropriate category directory
2. Ensure it follows the JSON Schema Draft 07 spec
3. Add clear `title`, `description`, and property descriptions
4. Test with affected projects
5. Create a pull request

### Modifying Existing Schemas

1. Consider backward compatibility
2. Test changes against all affected projects
3. Document breaking changes in PR description

## Validation

Validate schemas using:

```bash
# Using jsonschema (Python)
pip install jsonschema
jsonschema --check schemas/extraction/contact_details.json

# Using ajv-cli (Node.js)
npm install -g ajv-cli
ajv validate -s schemas/extraction/contact_details.json -d example.json
```

## Schema Relationships

Some schemas are designed to be compatible:

**contact_details ↔ contact_import**

- `extraction/contact_details.json`: Extract from text
- `business/contact_import.json`: Import to based
- Compatible structure allows seamless data flow

## License

MIT License - See [LICENSE](./LICENSE) file for details
