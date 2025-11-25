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

    analysis.hasPackageJson = await this.client.fileExists(owner, repo, 'package.json');
    analysis.hasDockerfile = await this.client.fileExists(owner, repo, 'Dockerfile');
    analysis.hasPythonRequirements = await this.client.fileExists(owner, repo, 'requirements.txt');
    analysis.hasCI = await this.client.checkDirectory(owner, repo, '.github/workflows');

    if (analysis.hasPackageJson) {
        await this.analyzePackageJson(owner, repo, analysis);
    }

    if (analysis.hasPythonRequirements) {
        await this.analyzePythonRequirements(owner, repo, analysis);
    }

    if (analysis.hasDockerfile) {
        analysis.tools.push('docker');
    }
    if (analysis.hasCI) {
        analysis.tools.push('github-actions');
    }

    return analysis;
}

    private async analyzePackageJson(owner: string, repo: string, analysis: RepoAnalysis): Promise<void> {
        const content = await this.client.fetchFileContent(owner, repo, 'package.json');
        if (!content) return;

        try {
            const packageJson = JSON.parse(content);
            const allDeps = {
                ...packageJson.dependencies,
                ...packageJson.devDependencies,
            };

            analysis.dependencies = allDeps;

            if (allDeps['react']) analysis.frameworks.push('react');
            if (allDeps['next']) analysis.frameworks.push('nextjs');
            if (allDeps['nuxt']) analysis.frameworks.push('nuxt');
            if (allDeps['vue']) analysis.frameworks.push('vue');
            if (allDeps['@angular/core']) analysis.frameworks.push('angular');
            if (allDeps['express']) analysis.frameworks.push('express');
            if (allDeps['fastify']) analysis.frameworks.push('fastify');
            if (allDeps['nestjs']) analysis.frameworks.push('nestjs');
            if (allDeps['@nestjs/core']) analysis.frameworks.push('nestjs');

            if (allDeps['typescript']) analysis.tools.push('typescript');
            if (allDeps['jest'] || allDeps['vitest']) analysis.tools.push('testing');
            if (allDeps['eslint']) analysis.tools.push('linting');
            if (allDeps['prettier']) analysis.tools.push('formatting');
        } catch (error) {
            console.error(`Failed to parse package.json for ${owner}/${repo}`);
        }
    }

    private async analyzePythonRequirements(owner: string, repo: string, analysis: RepoAnalysis): Promise<void> {
        const content = await this.client.fetchFileContent(owner, repo, 'requirements.txt');
        if (!content) return;

        // Detect Python frameworks
        if (content.includes('django')) analysis.frameworks.push('django');
        if (content.includes('flask')) analysis.frameworks.push('flask');
        if (content.includes('fastapi')) analysis.frameworks.push('fastapi');
    }
}