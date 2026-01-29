// implementacoes de ferramentas de sistema de arquivos usando node.js

import { promises as fs } from 'fs';
import { homedir } from 'os';
import { join, resolve } from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// expande ~ e variaveis de ambiente
function expandPath(path: string): string {
    if (path.startsWith('~')) {
        return join(homedir(), path.slice(1));
    }
    return resolve(path);
}

// formata bytes em formato legivel
function formatSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * lista arquivos em um diretorio
 */
export async function listDirectory(path: string, showHidden: boolean = false): Promise<string> {
    try {
        const fullPath = expandPath(path);
        const stats = await fs.stat(fullPath);

        if (!stats.isDirectory()) {
            return `erro: '${path}' nao e um diretorio.`;
        }

        const files = await fs.readdir(fullPath);
        const items: string[] = [];

        for (const file of files.sort()) {
            if (!showHidden && file.startsWith('.')) continue;

            try {
                const filePath = join(fullPath, file);
                const fileStats = await fs.stat(filePath);
                const icon = fileStats.isDirectory() ? '📁' : '📄';
                const size = fileStats.isFile() ? ` (${formatSize(fileStats.size)})` : '';
                items.push(`${icon} ${file}${size}`);
            } catch {
                items.push(`${file} (sem acesso)`);
            }
        }

        if (items.length === 0) {
            return `diretorio '${path}' esta vazio.`;
        }

        return `conteudo de ${path}:\n${items.join('\n')}`;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return `erro: diretorio '${path}' nao existe.`;
        }
        if (error.code === 'EACCES') {
            return `erro: sem permissao para acessar '${path}'.`;
        }
        return `erro ao listar diretorio: ${error.message}`;
    }
}

/**
 * encontra arquivos que coincidem com um padrao
 */
export async function findFile(
    pattern: string,
    searchPath: string = '~',
    maxResults: number = 20
): Promise<string> {
    try {
        const fullPath = expandPath(searchPath);
        const { stdout } = await execAsync(
            `find "${fullPath}" -name "${pattern}" -type f -maxdepth 5 2>/dev/null | head -n ${maxResults}`,
            { timeout: 30000 }
        );

        const files = stdout.trim().split('\n').filter(f => f.length > 0);

        if (files.length === 0) {
            return `nenhum arquivo encontrado com o padrao '${pattern}' em '${searchPath}'.`;
        }

        return `arquivos encontrados (${files.length}):\n${files.map(f => `📄 ${f}`).join('\n')}`;
    } catch (error: any) {
        return `erro na busca: ${error.message}`;
    }
}

/**
 * obtem o tamanho de um arquivo ou diretorio
 */
export async function getFileSize(path: string): Promise<string> {
    try {
        const fullPath = expandPath(path);
        const stats = await fs.stat(fullPath);

        if (stats.isFile()) {
            return `📄 ${path}: ${formatSize(stats.size)}`;
        }

        // para diretorios, usa du
        const { stdout } = await execAsync(`du -sh "${fullPath}" 2>/dev/null`, { timeout: 60000 });
        const size = stdout.split('\t')[0];

        // conta arquivos
        const { stdout: countOut } = await execAsync(
            `find "${fullPath}" -type f 2>/dev/null | wc -l`,
            { timeout: 30000 }
        );
        const fileCount = countOut.trim();

        return `📁 ${path}\ntamanho total: ${size}\narquivos: ${fileCount}`;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return `erro: '${path}' nao existe.`;
        }
        return `erro: ${error.message}`;
    }
}

/**
 * le o conteudo de um arquivo de texto
 */
export async function readFile(path: string, maxLines: number = 100): Promise<string> {
    try {
        const fullPath = expandPath(path);
        const stats = await fs.stat(fullPath);

        if (!stats.isFile()) {
            return `erro: '${path}' nao e um arquivo.`;
        }

        if (stats.size > 1024 * 1024) {
            return `erro: arquivo muito grande (>${formatSize(stats.size)}). use 'head' ou 'tail' para arquivos grandes.`;
        }

        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split('\n').slice(0, maxLines);

        const output = lines.join('\n');

        if (lines.length === maxLines) {
            return `conteudo de ${path} (primeiras ${maxLines} linhas):\n\n${output}\n\n[... arquivo truncado ...]`;
        }

        return `conteudo de ${path}:\n\n${output}`;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return `erro: arquivo '${path}' nao existe.`;
        }
        if (error.code === 'EACCES') {
            return `erro: sem permissao para ler '${path}'.`;
        }
        return `erro ao ler arquivo: ${error.message}`;
    }
}

/**
 * obtem o caminho absoluto de um arquivo, comando ou aplicativo
 */
export async function getPath(name: string): Promise<string> {
    try {
        // tenta 'which' para comandos
        try {
            const { stdout } = await execAsync(`which "${name}"`);
            if (stdout.trim()) {
                return `caminho de '${name}': ${stdout.trim()}`;
            }
        } catch { }

        // tenta locais comuns
        const commonPaths = [
            `/usr/bin/${name}`,
            `/usr/local/bin/${name}`,
            `/bin/${name}`,
            `/sbin/${name}`,
            `/usr/sbin/${name}`,
        ];

        for (const path of commonPaths) {
            try {
                await fs.access(path);
                return `caminho de '${name}': ${path}`;
            } catch { }
        }

        return `nao foi possivel encontrar '${name}' no sistema.`;
    } catch (error: any) {
        return `erro ao buscar caminho: ${error.message}`;
    }
}

/**
 * executa uma ferramenta de sistema de arquivos
 */
export async function executeFilesystemTool(toolName: string, args: any): Promise<string> {
    switch (toolName) {
        case 'list_directory':
            return await listDirectory(args.path, args.show_hidden);
        case 'find_file':
            return await findFile(args.pattern, args.search_path, args.max_results);
        case 'get_file_size':
            return await getFileSize(args.path);
        case 'read_file':
            return await readFile(args.path, args.max_lines);
        case 'get_path':
            return await getPath(args.name);
        default:
            return `erro: tool '${toolName}' nao encontrada.`;
    }
}
