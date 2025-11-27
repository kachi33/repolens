export interface RepoAnalysis {
    hasPackageJson: boolean;
    hasDockerfile: boolean;
    hasCI: boolean;
    hasPythonRequirements: boolean;
    frameworks: string[];
    tools: string[];
    dependencies?: Record<string, string>;
}

import { GithubClient } from "./github";
import { defaultTagger } from "./tagger";

export class RepoAnalyzer {
    private client: GithubClient;

    constructor(client: GithubClient) {
        this.client = client;
    }

async analyzeRepo(owner: string, repo: string): Promise<RepoAnalysis> {
    const analysis: RepoAnalysis = {
        hasPackageJson: false,
        hasDockerfile: false,
        hasCI: false,
        hasPythonRequirements: false,
        frameworks: [],
        tools: [],
    };

    const [hasPackageJson, hasDockerfile, hasPythonRequirements, hasCI] = await Promise.all([
        this.client.fileExists(owner, repo, 'package.json'),
        this.client.fileExists(owner, repo, 'Dockerfile'),
        this.client.fileExists(owner, repo, 'requirements.txt'),
        this.client.checkDirectory(owner, repo, '.github/workflows'),
    ]);

    analysis.hasPackageJson = hasPackageJson;
    analysis.hasDockerfile = hasDockerfile;
    analysis.hasPythonRequirements = hasPythonRequirements;
    analysis.hasCI = hasCI;

    let pythonRequirementsContent: string | undefined;

    const contentPromises: Promise<void>[] = [];

    if (analysis.hasPackageJson) {
        contentPromises.push(this.analyzePackageJson(owner, repo, analysis));
    }

    if (analysis.hasPythonRequirements) {
        contentPromises.push((async () => {
            pythonRequirementsContent = await this.client.fetchFileContent(owner, repo, 'requirements.txt') || undefined;
        })());
    }

    await Promise.all(contentPromises);

    const tags = defaultTagger.generateTags({
        dependencies: analysis.dependencies,
        hasDockerfile: analysis.hasDockerfile,
        hasCI: analysis.hasCI,
        hasPythonRequirements: analysis.hasPythonRequirements,
        pythonRequirementsContent,
    });

    analysis.frameworks = tags.frameworks;
    analysis.tools = tags.tools;

    return analysis;
}

    private async analyzePackageJson(owner: string, repo: string, analysis: RepoAnalysis): Promise<void> {
        const content = await this.client.fetchFileContent(owner, repo, 'package.json');
        if (!content) return;

        try {
            const packageJson = JSON.parse(content);
            analysis.dependencies = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };
        } catch (error) {
            console.error(`Failed to parse package.json for ${owner}/${repo}`);
        }
    }
}