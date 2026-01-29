// implementacoes de ferramentas de sistema usando node.js

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * obtem informacoes de uso de disco
 */
export async function getDiskUsage(): Promise<string> {
    try {
        const { stdout } = await execAsync(
            'df -h --output=source,size,used,avail,pcent,target -x tmpfs -x devtmpfs'
        );
        return `uso de disco:\n\`\`\`\n${stdout}\n\`\`\``;
    } catch (error: any) {
        return `erro ao obter uso de disco: ${error.message}`;
    }
}

/**
 * obtem informacoes de uso de memoria
 */
export async function getMemoryInfo(): Promise<string> {
    try {
        const { stdout } = await execAsync('free -h');
        return `uso de memoria:\n\`\`\`\n${stdout}\n\`\`\``;
    } catch (error: any) {
        return `erro ao obter memoria: ${error.message}`;
    }
}

/**
 * obtem informacoes do sistema
 */
export async function getSystemInfo(): Promise<string> {
    try {
        const [hostname, kernel, uptime] = await Promise.all([
            execAsync('hostname'),
            execAsync('uname -r'),
            execAsync('uptime -p'),
        ]);

        return `informacoes do sistema:
- hostname: ${hostname.stdout.trim()}
- kernel: ${kernel.stdout.trim()}
- uptime: ${uptime.stdout.trim()}`;
    } catch (error: any) {
        return `erro ao obter info do sistema: ${error.message}`;
    }
}

/**
 * lista os processos que mais consomem cpu ou memoria
 */
export async function listProcesses(
    sortBy: string = 'cpu',
    limit: number = 10
): Promise<string> {
    try {
        const sortFlag = sortBy === 'memory' ? '-m' : '-c';
        const { stdout } = await execAsync(
            `ps aux --sort=${sortFlag === '-c' ? '-pcpu' : '-pmem'} | head -n ${limit + 1}`
        );
        return `processos (ordenados por ${sortBy}):\n\`\`\`\n${stdout}\n\`\`\``;
    } catch (error: any) {
        return `erro ao listar processos: ${error.message}`;
    }
}

/**
 * obtem informacoes sobre um pacote instalado ou disponivel
 */
export async function getPackageInfo(packageName: string): Promise<string> {
    try {
        // tenta apt-cache show
        try {
            const { stdout } = await execAsync(`apt-cache show "${packageName}" 2>/dev/null | head -n 20`);
            if (stdout.trim()) {
                return `informacoes do pacote '${packageName}':\n\`\`\`\n${stdout}\n\`\`\``;
            }
        } catch { }

        // tenta dpkg -l
        try {
            const { stdout } = await execAsync(`dpkg -l "${packageName}" 2>/dev/null`);
            if (stdout.includes(packageName)) {
                return `pacote instalado:\n\`\`\`\n${stdout}\n\`\`\``;
            }
        } catch { }

        return `pacote '${packageName}' nao encontrado.`;
    } catch (error: any) {
        return `erro ao consultar pacote: ${error.message}`;
    }
}

/**
 * executa uma ferramenta de sistema
 */
export async function executeSystemTool(toolName: string, args: any): Promise<string> {
    switch (toolName) {
        case 'get_disk_usage':
            return await getDiskUsage();
        case 'get_memory_info':
            return await getMemoryInfo();
        case 'get_system_info':
            return await getSystemInfo();
        case 'list_processes':
            return await listProcesses(args.sortBy, args.limit);
        case 'get_package_info':
            return await getPackageInfo(args.package_name);
        default:
            return `erro: tool '${toolName}' nao encontrada.`;
    }
}
