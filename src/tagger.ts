export interface TagMapping {
    tag: string;
    type: 'framework' | 'tool';
    patterns: string[];
}

export interface TagContext {
    dependencies?: Record<string, string>;
    hasDockerfile?: boolean;
    hasCI?: boolean;
    hasPythonRequirements?: boolean;
    pythonRequirementsContent?: string;
}

export class TaggingEngine {
    private tagMappings: TagMapping[] = [
        { tag: 'react', type: 'framework', patterns: ['react', '@types/react'] },
        { tag: 'nextjs', type: 'framework', patterns: ['next'] },
        { tag: 'vue', type: 'framework', patterns: ['vue'] },
        { tag: 'nuxt', type: 'framework', patterns: ['nuxt'] },
        { tag: 'angular', type: 'framework', patterns: ['@angular/core', '@angular/common'] },
        { tag: 'svelte', type: 'framework', patterns: ['svelte'] },
        { tag: 'solid', type: 'framework', patterns: ['solid-js'] },
        { tag: 'preact', type: 'framework', patterns: ['preact'] },
        { tag: 'express', type: 'framework', patterns: ['express'] },
        { tag: 'fastify', type: 'framework', patterns: ['fastify'] },
        { tag: 'nestjs', type: 'framework', patterns: ['@nestjs/core', 'nestjs'] },
        { tag: 'koa', type: 'framework', patterns: ['koa'] },
        { tag: 'hapi', type: 'framework', patterns: ['@hapi/hapi', 'hapi'] },
        { tag: 'django', type: 'framework', patterns: ['django', 'Django'] },
        { tag: 'flask', type: 'framework', patterns: ['flask', 'Flask'] },
        { tag: 'fastapi', type: 'framework', patterns: ['fastapi', 'FastAPI'] },
        { tag: 'remix', type: 'framework', patterns: ['@remix-run/react', '@remix-run/node'] },
        { tag: 'gatsby', type: 'framework', patterns: ['gatsby'] },
        { tag: 'astro', type: 'framework', patterns: ['astro'] },
        { tag: 'react-native', type: 'framework', patterns: ['react-native'] },
        { tag: 'expo', type: 'framework', patterns: ['expo'] },
        { tag: 'electron', type: 'framework', patterns: ['electron'] },
        { tag: 'tauri', type: 'framework', patterns: ['@tauri-apps/api', '@tauri-apps/cli'] },
        { tag: 'webpack', type: 'tool', patterns: ['webpack'] },
        { tag: 'vite', type: 'tool', patterns: ['vite'] },
        { tag: 'rollup', type: 'tool', patterns: ['rollup'] },
        { tag: 'esbuild', type: 'tool', patterns: ['esbuild'] },
        { tag: 'parcel', type: 'tool', patterns: ['parcel'] },
        { tag: 'turbopack', type: 'tool', patterns: ['turbopack'] },
        { tag: 'testing', type: 'tool', patterns: ['jest', 'vitest', 'mocha', 'chai', '@testing-library/react', 'cypress', 'playwright', '@playwright/test', 'selenium-webdriver'] },
        { tag: 'linting', type: 'tool', patterns: ['eslint', 'tslint'] },
        { tag: 'formatting', type: 'tool', patterns: ['prettier'] },
        { tag: 'typescript', type: 'tool', patterns: ['typescript'] },
        { tag: 'redux', type: 'tool', patterns: ['redux', '@reduxjs/toolkit'] },
        { tag: 'mobx', type: 'tool', patterns: ['mobx'] },
        { tag: 'zustand', type: 'tool', patterns: ['zustand'] },
        { tag: 'recoil', type: 'tool', patterns: ['recoil'] },
        { tag: 'jotai', type: 'tool', patterns: ['jotai'] },
        { tag: 'tailwind', type: 'tool', patterns: ['tailwindcss'] },
        { tag: 'styled-components', type: 'tool', patterns: ['styled-components'] },
        { tag: 'emotion', type: 'tool', patterns: ['@emotion/react', '@emotion/styled'] },
        { tag: 'sass', type: 'tool', patterns: ['sass', 'node-sass'] },
        { tag: 'graphql', type: 'tool', patterns: ['graphql', 'apollo-server', '@apollo/client', 'urql', 'relay-runtime'] },
        { tag: 'prisma', type: 'tool', patterns: ['prisma', '@prisma/client'] },
        { tag: 'typeorm', type: 'tool', patterns: ['typeorm'] },
        { tag: 'sequelize', type: 'tool', patterns: ['sequelize'] },
        { tag: 'mongoose', type: 'tool', patterns: ['mongoose'] },
        { tag: 'drizzle', type: 'tool', patterns: ['drizzle-orm'] },
        { tag: 'docker', type: 'tool', patterns: ['Dockerfile'] },
        { tag: 'github-actions', type: 'tool', patterns: ['.github/workflows'] },
    ];

    generateTags(context: TagContext): { frameworks: string[]; tools: string[] } {
        const frameworks = new Set<string>();
        const tools = new Set<string>();

        if (context.dependencies) {
            for (const mapping of this.tagMappings) {
                for (const pattern of mapping.patterns) {
                    if (context.dependencies[pattern]) {
                        if (mapping.type === 'framework') {
                            frameworks.add(mapping.tag);
                        } else {
                            tools.add(mapping.tag);
                        }
                        break;
                    }
                }
            }
        }

        if (context.hasDockerfile) {
            tools.add('docker');
        }

        if (context.hasCI) {
            tools.add('github-actions');
        }

        if (context.pythonRequirementsContent) {
            const content = context.pythonRequirementsContent.toLowerCase();
            for (const mapping of this.tagMappings) {
                if (mapping.type === 'framework' && ['django', 'flask', 'fastapi'].includes(mapping.tag)) {
                    for (const pattern of mapping.patterns) {
                        if (content.includes(pattern.toLowerCase())) {
                            frameworks.add(mapping.tag);
                            break;
                        }
                    }
                }
            }
        }

        return {
            frameworks: Array.from(frameworks),
            tools: Array.from(tools),
        };
    }

    addTagMapping(mapping: TagMapping): void {
        this.tagMappings.push(mapping);
    }

    getTagMappings(): TagMapping[] {
        return [...this.tagMappings];
    }

    removeTagMapping(tag: string): boolean {
        const initialLength = this.tagMappings.length;
        this.tagMappings = this.tagMappings.filter(m => m.tag !== tag);
        return this.tagMappings.length < initialLength;
    }
}

export const defaultTagger = new TaggingEngine();
