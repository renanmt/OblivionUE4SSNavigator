# Oblivion UE4SS Navigator

A modern web interface for exploring and searching through Oblivion Remastered's internal structure using UE4SS type data.

![Dark Theme UI](screenshot.png)

## Features

- 🔍 **Smart Search**: Search across multiple entity types with real-time filtering
- 🎯 **Type Filtering**: Filter results by:
  - Classes
  - Enums
  - Aliases
  - Global Functions
  - Methods
  - Properties
  - Parameters
- 🎨 **Modern Dark Theme**: Beautiful dark theme optimized for readability
- ⚡ **Fast Performance**: Built with Svelte for optimal performance
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ☁️ **Cloudflare Pages**: Optimized for global deployment with Cloudflare Pages

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or pnpm
- Cloudflare account (for deployment)
- Wrangler CLI (optional, for local development with Cloudflare)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/OblivionUE4SSNavigator.git
cd OblivionUE4SSNavigator
```

2. Install dependencies:
```bash
npm install
# or
pnpm install
```

3. Place your UE4SS type data files in the `static/data` directory:
- `Types.lua`
- `oblivion_types.lua`

### Development

#### Local Development
```bash
# Standard development server
npm run dev
# or
pnpm dev

# Development with Cloudflare Pages
npm run pages:dev
# or
pnpm pages:dev
```

The application will be available at `http://localhost:5173`

### Building and Deployment

#### Local Build
```bash
npm run build
# or
pnpm build
```

#### Cloudflare Pages Deployment

1. **First-time setup**:
   - Connect your GitHub repository to Cloudflare Pages
   - Set build command: `npm run build`
   - Set build output directory: `.svelte-kit/cloudflare`
   - Set Node.js version to 18 or higher

2. **Manual deployment**:
```bash
npm run pages:deploy
# or
pnpm pages:deploy
```

3. **Environment Variables**:
   - Production and preview environments can be configured in `wrangler.toml`
   - Sensitive values should be set through Cloudflare Pages dashboard

## Usage

1. **Quick Search**: Use the search bar at the top to find any entity by name
2. **Filter Results**: Toggle the type filters to narrow down your search
3. **Browse Results**: Results are organized by type in separate tabs
4. **Navigate**: Click on type references to navigate between related entities

## Technical Details

- Built with [Svelte](https://svelte.dev/)
- Uses TypeScript for type safety
- Implements a custom type parser for UE4SS Lua type definitions
- Features a reactive data store for efficient state management
- Deployed on [Cloudflare Pages](https://pages.cloudflare.com/) for optimal global performance
- Uses Cloudflare's edge functions for serverless capabilities

## Project Structure

```
.
├── src/                  # Source code
├── static/              # Static assets
│   └── data/            # UE4SS type data files
├── wrangler.toml        # Cloudflare Pages configuration
└── svelte.config.js     # Svelte configuration
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Oblivion Remastered modding community
- Powered by UE4SS type information
- Inspired by modern documentation browsers and type explorers
- Hosted on Cloudflare's global network
