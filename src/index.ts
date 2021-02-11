import { exec } from 'child_process';
import { RipGrepError, Match, Options } from './types';

export * from './types';

function formatResults(stdout: string) {
  stdout = stdout.trim();

  if (!stdout) {
    return [];
  }

  return stdout.split('\n').map((line) => new Match(line));
}

export function ripGrep(cwd: string, searchTerm: string): Promise<Array<Match>>;
export function ripGrep(cwd: string, options: Options): Promise<Array<Match>>;

export function ripGrep(cwd: string, optionsOrSearchTerm: Options | string): Promise<Array<Match>> {
  let options: Options;

  if (typeof optionsOrSearchTerm === 'string') {
    options = {
      string: optionsOrSearchTerm,
    };
  } else {
    options = optionsOrSearchTerm;
  }

  if (!cwd) {
    return Promise.reject(new Error('No `cwd` provided'));
  }

  if (arguments.length === 1) {
    return Promise.reject(new Error('No search term provided'));
  }

  let execString = 'rg --column --line-number --color never';
  if ('regex' in options) {
    execString = `${execString} -e ${options.regex}`;
  } else if ('string' in options) {
    execString = `${execString} -F ${options.string}`;
  }

  if (options.globs) {
    execString = options.globs.reduce((command, glob) => {
      return `${command} -g '${glob}'`;
    }, execString);
  }

  return new Promise(function (resolve, reject) {
    exec(execString, { cwd }, (error, stdout, stderr) => {
      if (!error || (error && stderr === '')) {
        resolve(formatResults(stdout));
      } else {
        reject(new RipGrepError(error, stderr));
      }
    });
  });
}
