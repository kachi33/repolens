import { Command } from "commander";
import dotenv from "dotenv";
import chalk from "chalk";
import { GithubClient, Languages } from "./github";
import { writeFileSync } from "fs";
import { RepoAnalyzer, RepoAnalysis } from "./analyzer";
import { generateDashboard } from "./dashboard";



dotenv.config();

const program = new Command();

program
    .name("repolens")
    .description("CLI tool to fetch and display GitHub repository information")
    .version("1.0.0")
    .requiredOption("-u, --user <user>", "GitHub username or organization")
    .option("-t, --token <token>", "GitHub personal access token (or use Github_Token env var)")
    .option("-o, --output <file>", 'Output file path', './repolens_report.md')
    .parse();

async function main() {
    const options = program.opts();
    const token = options.token || process.env.GITHUB_TOKEN;
    if (!token) {
        console.error(chalk.red("Error: GitHub token is required. Provide it via --token option or GITHUB_TOKEN environment variable."));
        process.exit(1);
    }

    const client = new GithubClient(token);

    console.log(chalk.blue(`Fetching repos for ${options.user}.....`));
    const repos = await client.fetchRepos(options.user);
    console.log(chalk.green(`Found ${repos.length} repositories.`));

    const languagesMap = new Map<string, Languages>();

    console.log(chalk.blue('Fetching languages for all repos in parallel...'));
    const languagePromises = repos.map(async (repo) => {
        const languages = await client.fetchLanguages(repo.owner.login, repo.name);
        return { name: repo.name, languages };
    });

    const languageResults = await Promise.all(languagePromises);
    languageResults.forEach(({ name, languages }) => {
        languagesMap.set(name, languages);
    });
    console.log(chalk.green('✓ Languages fetched'));
    console.log(chalk.blue('\nAnalyzing repositories in parallel...'));
    const analyzer = new RepoAnalyzer(client);
    const analysisMap = new Map<string, RepoAnalysis>();

    const analysisPromises = repos.map(async (repo) => {
        const analysis = await analyzer.analyzeRepo(repo.owner.login, repo.name);
        return { name: repo.name, analysis };
    });

    const analysisResults = await Promise.all(analysisPromises);
    analysisResults.forEach(({ name, analysis }) => {
        analysisMap.set(name, analysis);
    });
    console.log(chalk.green('✓ Analysis complete'));

    const report = generateDashboard(options.user, repos, languagesMap, analysisMap);

    writeFileSync(options.output, report);
    console.log(chalk.green(`Report written to ${options.output}`));
}

main().catch(console.error);
