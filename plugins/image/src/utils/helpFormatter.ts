/**
 * Standardized Help Formatter for MediaProc Image CLI
 * Creates consistent, beautiful help displays for all image commands
 */

import chalk from 'chalk';

/**
 * Interface for command help options
 */
export interface HelpOption {
  flag: string;
  description: string;
}

/**
 * Interface for command help examples
 */
export interface HelpExample {
  command: string;
  description: string;
}

/**
 * Interface for help section
 */
export interface HelpSection {
  title: string;
  items: string[];
}

/**
 * Interface for command help configuration
 */
export interface CommandHelpConfig {
  commandName: string;
  emoji: string;
  description: string;
  usage: string[];
  options: HelpOption[];
  examples: HelpExample[];
  additionalSections?: HelpSection[];
  tips?: string[];
}

/**
 * Create a gradient-like effect using chalk
 */
function createGradientText(text: string, startColor: string): string {
  // Simple gradient simulation using chalk colors
  return chalk.hex(startColor)(text);
}

/**
 * Create a box around content
 */
function createBox(content: string, borderColor: 'cyan' | 'red' | 'yellow' | 'green' = 'cyan'): string {
  const lines = content.split('\n');
  const maxLength = Math.max(...lines.map(line => stripAnsi(line).length));
  const width = Math.min(maxLength + 4, 100);
  
  const colorFn = chalk[borderColor];
  const topBorder = colorFn('╭' + '─'.repeat(width - 2) + '╮');
  const bottomBorder = colorFn('╰' + '─'.repeat(width - 2) + '╯');
  
  const boxedLines = lines.map(line => {
    const stripped = stripAnsi(line);
    const padding = ' '.repeat(Math.max(0, width - stripped.length - 4));
    return colorFn('│ ') + line + padding + colorFn(' │');
  });
  
  return '\n' + topBorder + '\n' + boxedLines.join('\n') + '\n' + bottomBorder + '\n';
}

/**
 * Strip ANSI codes from string for length calculation
 */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Create standardized help display for commands
 */
export function createStandardHelp(config: CommandHelpConfig): void {
  let helpContent = '';

  // Header
  helpContent += createGradientText(`${config.emoji} MediaProc Image - ${config.commandName} Command`, '#4facfe') + '\n\n';

  // Description
  helpContent += chalk.white(config.description) + '\n\n';

  // Usage
  helpContent += chalk.cyan.bold('Usage:') + '\n';
  config.usage.forEach(usage => {
    helpContent += chalk.white(`  ${chalk.magenta('mediaproc')} ${chalk.cyan('image')} ${usage}`) + '\n';
  });
  helpContent += '\n';

  // Options
  helpContent += chalk.cyan.bold('Options:') + '\n';

  // Check if help flag already exists
  const hasHelpFlag = config.options && config.options.some(option =>
    option.flag.includes('-h') || option.flag.includes('--help')
  );

  // Add custom options first
  if (config.options && config.options.length > 0) {
    config.options.forEach(option => {
      const flagPart = chalk.yellow(option.flag.padEnd(30));
      const descPart = chalk.gray(option.description);
      helpContent += `  ${flagPart} ${descPart}\n`;
    });
  }

  // Add the global help flag only if it doesn't already exist
  if (!hasHelpFlag) {
    helpContent += `  ${chalk.yellow('-h, --help'.padEnd(30))} ${chalk.gray('Show this help message')}\n`;
  }
  helpContent += '\n';

  // Examples
  if (config.examples && config.examples.length > 0) {
    helpContent += chalk.cyan.bold('Examples:') + '\n';
    config.examples.forEach(example => {
      // Check if command already starts with 'mediaproc image', if not add it
      const command = example.command.startsWith('mediaproc image ') 
        ? example.command 
        : `mediaproc image ${example.command}`;
      
      const formattedCommand = command
        .replace(/^mediaproc /, `${chalk.magenta('mediaproc')} `)
        .replace(/image /, `${chalk.cyan('image')} `);
      
      helpContent += chalk.white(`  ${formattedCommand}`) + '\n';
      helpContent += chalk.dim(`    → ${example.description}`) + '\n\n';
    });
  }

  // Additional sections
  if (config.additionalSections && config.additionalSections.length > 0) {
    config.additionalSections.forEach(section => {
      helpContent += chalk.hex('#00d2d3').bold(`💡 ${section.title}:`) + '\n';
      section.items.forEach(item => {
        helpContent += chalk.hex('#95afc0')(`  • ${item}`) + '\n';
      });
      helpContent += '\n';
    });
  }

  // Tips
  if (config.tips && config.tips.length > 0) {
    config.tips.forEach(tip => {
      helpContent += chalk.yellow(`💡 Tip: ${tip}`) + '\n';
    });
    helpContent += '\n';
  }

  // Footer
  helpContent += chalk.dim(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`) + '\n';
  helpContent += chalk.hex('#636e72')(`🖼️  MediaProc Image Plugin • Powered by Sharp • High Performance`);

  console.log(createBox(helpContent, 'cyan'));
}

/**
 * Quick help display for commands with minimal options
 */
export function createQuickHelp(
  commandName: string, 
  emoji: string, 
  description: string, 
  usage: string, 
  options: string[]
): void {
  let helpContent = '';
  
  helpContent += createGradientText(`${emoji} ${commandName.toUpperCase()} COMMAND`, '#4facfe') + '\n\n';
  helpContent += chalk.white(description) + '\n\n';
  helpContent += chalk.cyan.bold('Usage:') + '\n';
  helpContent += chalk.white(`  ${chalk.magenta('mediaproc')} ${chalk.cyan('image')} ${usage}`) + '\n\n';

  if (options.length > 0) {
    helpContent += chalk.cyan.bold('Options:') + '\n';
    options.forEach(option => {
      helpContent += chalk.gray(`  ${option}`) + '\n';
    });
  }

  console.log(createBox(helpContent, 'cyan'));
}

/**
 * Create error help display
 */
export function createErrorHelp(commandName: string, error: string, suggestion?: string): void {
  let helpContent = '';
  
  helpContent += chalk.red.bold(`❌ ${commandName.toUpperCase()} ERROR`) + '\n\n';
  helpContent += chalk.white(error) + '\n';

  if (suggestion) {
    helpContent += '\n' + chalk.yellow(`💡 Suggestion: ${suggestion}`) + '\n';
  }

  helpContent += '\n' + chalk.gray(`Run: `) + chalk.cyan(`mediaproc image ${commandName} --help`) + chalk.gray(` for more information`);

  console.log(createBox(helpContent, 'red'));
}

/**
 * Create success message display
 */
export function createSuccessMessage(message: string, details?: string[]): void {
  let content = chalk.green.bold('✓ ' + message) + '\n';
  
  if (details && details.length > 0) {
    content += '\n';
    details.forEach(detail => {
      content += chalk.dim(`  ${detail}`) + '\n';
    });
  }
  
  console.log(content);
}

/**
 * Create info message display
 */
export function createInfoMessage(title: string, items: string[]): void {
  let content = chalk.blue.bold('ℹ ' + title) + '\n';
  items.forEach(item => {
    content += chalk.gray(`  • ${item}`) + '\n';
  });
  console.log(content);
}

/**
 * Create warning message display
 */
export function createWarningMessage(message: string, details?: string[]): void {
  let content = chalk.yellow.bold('⚠ ' + message) + '\n';
  
  if (details && details.length > 0) {
    content += '\n';
    details.forEach(detail => {
      content += chalk.dim(`  ${detail}`) + '\n';
    });
  }
  
  console.log(content);
}
