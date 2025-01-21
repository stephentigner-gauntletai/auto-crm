# AutoCRM

A modern customer support system built with Next.js and Supabase.

## Tech Stack

- Frontend: Next.js 14+ with shadcn/ui and Tailwind CSS
- Backend: Supabase for database and authentication
- Deployment: AWS Amplify

## Development Setup

### Prerequisites

- Node.js 18.19.1 or later
- npm 10.x or later

### Installation

1. Clone the repository:

```bash
git clone [repository-url]
cd auto-crm
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration.

4. Start the development server:

```bash
npm run dev
```

## CI/CD Configuration

The project uses GitHub Actions for CI/CD and AWS Amplify for deployment. Three workflows are configured:

### 1. Continuous Integration (`ci.yml`)
Runs on every push and pull request to main:
- Type checking
- Linting
- Format checking
- Build verification

### 2. Deployment (`deploy.yml`)
Runs on push to main:
- Builds the application
- Deploys to AWS Amplify production environment

### 3. Preview Deployments (`preview.yml`)
Runs on pull requests:
- Creates a preview environment
- Posts preview URL as a comment on the PR

### Required GitHub Secrets

The following secrets need to be configured in GitHub repository settings:

```
AWS_ACCESS_KEY_ID          # AWS access key for deployment
AWS_SECRET_ACCESS_KEY      # AWS secret key for deployment
AWS_REGION                 # AWS region (e.g., us-east-1)
NEXT_PUBLIC_SUPABASE_URL   # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY  # Supabase anonymous key
AMPLIFY_APP_ID             # AWS Amplify application ID
```

To set up these secrets:
1. Go to your GitHub repository
2. Navigate to Settings > Secrets and variables > Actions
3. Click "New repository secret"
4. Add each secret with its corresponding value

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Contributing

Contributions are not currently accepted.
This is part of my work for the GauntletAI fellowship.
