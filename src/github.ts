export interface RepoInfo {
    id: number;
    name: string;
    full_name: string;
    private: boolean;
    owner: {
        login: string;
        id: number;
        avatar_url: string;
        html_url: string;
    };
    html_url: string;
    description: string | null;
    fork: boolean;
    url: string;
    created_at: string;
    updated_at: string;
    pushed_at: string;
    homepage: string | null;
    size: number;
    stargazers_count: number;
    watchers_count: number;
    language: string | null;
}

export interface Languages {
    [language: string]: number;
}

export class GithubClient {
    private baseUrl = "https://api.github.com";
    private token: string;
    constructor(token: string) {
        this.token = token;
    }
    async fetchRepos(username: string): Promise<RepoInfo[]> {
        const response = await fetch(`${this.baseUrl}/users/${username}/repos`, {
            headers: {
                Authorization: `token ${this.token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch repositories for user ${username}: ${response.statusText}`);
        }
        const repos: RepoInfo[] = await response.json();
        return repos;
    }

    async fetchLanguages(owner: string, repo: string): Promise<Languages> {
        const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/languages`, {
            headers: {
                Authorization: `token ${this.token}`,
                Accept: 'application/vnd.github.v3+json',
            },
        });
        if (!response.ok) {
            throw new Error(`Failed to fetch languages for repository ${owner}/${repo}: ${response.statusText}`);
        }
        const languages: Languages = await response.json();
        return languages;
    }
}

export function generateRepoMarkdown(repos: RepoInfo[], languagesMap: Map<string, Languages>): string {
    let md = `# RepoLens Summary\n\n`;

    md += `Total Repositories: ${repos.length}\n\n`;
    md += `| Repository | Stars | Language |\n`;
    md += `|------------|-------|----------|\n`;

    for (const repo of repos) {
        const langs = languagesMap.get(repo.name);
        const primaryLang = langs ? Object.keys(langs)[0] : repo.language || 'N/A';
        const date = new Date(repo.created_at).toLocaleDateString();

        md += `| [${repo.name}](${repo.html_url}) | ${repo.stargazers_count} | ${primaryLang} | ${date} |\n`;
    }
    return md;
}