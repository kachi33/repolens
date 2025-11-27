import { RepoInfo, Languages } from "./github";
import { RepoAnalysis } from "./analyzer";

interface BarChartItem {
    label: string;
    count: number;
}

function generateBarChart(items: BarChartItem[], maxBarLength: number = 40): string {
    if (items.length === 0) return '';

    const maxCount = Math.max(...items.map(i => i.count));
    const sortedItems = items.sort((a, b) => b.count - a.count).slice(0, 10);

    let chart = '';
    for (const item of sortedItems) {
        const barLength = Math.round((item.count / maxCount) * maxBarLength);
        const bar = '█'.repeat(barLength);
        const percentage = ((item.count / items.reduce((sum, i) => sum + i.count, 0)) * 100).toFixed(1);
        chart += `${item.label.padEnd(20)} ${bar} ${item.count} (${percentage}%)\n`;
    }

    return chart;
}

function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function generateDashboard(
    username: string,
    repos: RepoInfo[],
    languagesMap: Map<string, Languages>,
    analysisMap: Map<string, RepoAnalysis>
): string {
    const sortedRepos = [...repos].sort((a, b) => b.stargazers_count - a.stargazers_count);
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);

    const dates = repos.map(r => new Date(r.created_at).getTime());
    const oldestDate = new Date(Math.min(...dates));
    const newestDate = new Date(Math.max(...dates));

    let md = `# ${username}'s GitHub Profile Report\n\n`;
    md += `> Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}\n\n`;

    md += `## Overview\n\n`;
    md += `- **Total Repositories:** ${repos.length}\n`;
    md += `- **Total Stars:** ⭐ ${totalStars}\n`;
    md += `- **Date Range:** ${formatDate(oldestDate.toISOString())} - ${formatDate(newestDate.toISOString())}\n\n`;

    const languageCounts = new Map<string, number>();
    repos.forEach(repo => {
        const langs = languagesMap.get(repo.name);
        const primaryLang = langs ? Object.keys(langs)[0] : repo.language;
        if (primaryLang && primaryLang !== 'undefined') {
            languageCounts.set(primaryLang, (languageCounts.get(primaryLang) || 0) + 1);
        }
    });

    if (languageCounts.size > 0) {
        md += `## Languages\n\n`;
        md += '```\n';
        md += generateBarChart(
            Array.from(languageCounts.entries()).map(([label, count]) => ({ label, count }))
        );
        md += '```\n\n';
    }

    const frameworkCounts = new Map<string, number>();
    analysisMap.forEach(analysis => {
        analysis.frameworks.forEach(fw => {
            frameworkCounts.set(fw, (frameworkCounts.get(fw) || 0) + 1);
        });
    });

    if (frameworkCounts.size > 0) {
        md += `## Frameworks\n\n`;
        md += '```\n';
        md += generateBarChart(
            Array.from(frameworkCounts.entries()).map(([label, count]) => ({ label, count }))
        );
        md += '```\n\n';
    }

    const toolCounts = new Map<string, number>();
    analysisMap.forEach(analysis => {
        analysis.tools.forEach(tool => {
            toolCounts.set(tool, (toolCounts.get(tool) || 0) + 1);
        });
    });

    if (toolCounts.size > 0) {
        md += `## Tools & Technologies\n\n`;
        md += '```\n';
        md += generateBarChart(
            Array.from(toolCounts.entries()).map(([label, count]) => ({ label, count }))
        );
        md += '```\n\n';
    }

    md += `##  Repositories\n\n`;
    md += `| Repository | ⭐ Stars | Language | Frameworks | Tools | Created | Updated |\n`;
    md += `|------------|---------|----------|------------|-------|---------|----------|\n`;

    for (const repo of sortedRepos) {
        const langs = languagesMap.get(repo.name);
        const analysis = analysisMap.get(repo.name);
        const primaryLang = langs ? Object.keys(langs)[0] : repo.language || 'N/A';
        const frameworks = analysis?.frameworks.join(', ') || '-';
        const tools = analysis?.tools.join(', ') || '-';
        const created = formatDate(repo.created_at);
        const updated = formatDate(repo.updated_at);

        md += `| [${repo.name}](${repo.html_url}) | ${repo.stargazers_count} | ${primaryLang} | ${frameworks} | ${tools} | ${created} | ${updated} |\n`;
    }

    const allTags = new Set<string>();
    analysisMap.forEach(analysis => {
        analysis.frameworks.forEach(fw => allTags.add(fw));
        analysis.tools.forEach(tool => allTags.add(tool));
    });

    if (allTags.size > 0) {
        md += `\n## All Tags\n\n`;
        const sortedTags = Array.from(allTags).sort();
        md += sortedTags.map(tag => `\`${tag}\``).join(' • ');
        md += '\n';
    }

    return md;
}
