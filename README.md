# Firestore Security Auditor

A command-line tool to audit Firestore security rules for potential vulnerabilities and best practices. test

## Installation

```bash
npm install -g firestore-security-auditor
```

Or use it without installing:

```bash
npx firestore-security-auditor --help
```

## Usage

```bash
firestore-security-auditor [options]
```

### Options

- `-p, --project <project>`: Firestore project ID (required)
- `-r, --rules-file <rulesFile>`: Path to Firestore security rules file (optional)
- `-v, --verbose`: Enable verbose output (optional)

### Examples

Audit rules by specifying a project and rules file:

```bash
firestore-security-auditor --project my-firebase-project --rules-file ./firestore.rules
```

Audit rules by fetching them directly from the project:

```bash
firestore-security-auditor --project my-firebase-project
```

Enable verbose output:

```bash
firestore-security-auditor --project my-firebase-project --verbose
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/firestore-security-auditor.git
cd firestore-security-auditor

# Install dependencies
npm install

# Build the project
npm run build
```

### Development Commands

- `npm run dev`: Run the CLI in development mode
- `npm run build`: Build the TypeScript code
- `npm run lint`: Lint the code
- `npm test`: Run tests

## License

MIT
